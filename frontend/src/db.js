// URL del backend: usa variable de entorno en producción, localhost en desarrollo
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const DB = {
  data: null,

  async init() {
    try {
      const res = await fetch(`${API_URL}/api/db`);
      this.data = await res.json();
    } catch (e) {
      console.warn("Backend no disponible. Por favor arranca el backend.");
      this.data = {};
    }
  },

  get() {
    return this.data;
  },

  save(data) {
    this.data = data;
    fetch(`${API_URL}/api/db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(e => console.error("Error guardando en backend", e));
  },

  reset() {
    fetch(`${API_URL}/api/reset`, { method: 'POST' })
      .then(() => window.location.reload())
      .catch(console.error);
  },

  // ── USUARIOS ──────────────────────────────────────────────────
  getUsuarios() { return this.get().usuarios || []; },

  findUsuario(correo, contrasena) {
    return this.getUsuarios().find(u => u.correo === correo && u.contrasena === contrasena);
  },

  findUsuarioById(id) {
    return this.getUsuarios().find(u => u.id === id);
  },

  createUsuario(data) {
    const db = this.get();
    const nuevo = { ...data, id: 'u-' + Date.now(), fecha_creacion: new Date().toISOString(), activo: true };
    db.usuarios.push(nuevo);
    this.save(db);
    return nuevo;
  },

  updateUsuario(id, data) {
    const db = this.get();
    const idx = db.usuarios.findIndex(u => u.id === id);
    if (idx !== -1) db.usuarios[idx] = { ...db.usuarios[idx], ...data };
    this.save(db);
  },

  deleteUsuario(id) {
    const db = this.get();
    db.usuarios = db.usuarios.filter(u => u.id !== id);
    this.save(db);
  },

  // ── SESIÓN ────────────────────────────────────────────────────
  getSession() { return this.get().session; },

  setSession(usuario) {
    const db = this.get();
    db.session = usuario;
    this.save(db);
  },

  clearSession() {
    const db = this.get();
    db.session = null;
    this.save(db);
  },

  // ── CANDIDATOS ────────────────────────────────────────────────
  getCandidatos() { return this.get().candidatos || []; },

  getCandidatoById(id) { return this.getCandidatos().find(c => c.id === id); },

  getCandidatosByEstado(estado) { return this.getCandidatos().filter(c => c.estado_proceso === estado); },

  getCandidatosBySocio(id_socio) { return this.getCandidatos().filter(c => c.id_socio === id_socio); },

  updateCandidato(id, data) {
    const db = this.get();
    const idx = db.candidatos.findIndex(c => c.id === id);
    if (idx !== -1) db.candidatos[idx] = { ...db.candidatos[idx], ...data };
    this.save(db);
  },

  createCandidato(data) {
    const db = this.get();
    const nuevo = { ...data, id: 'c-' + Date.now(), fecha_alta: new Date().toISOString().split('T')[0], consentimiento_gdpr: true };
    db.candidatos.push(nuevo);
    db.kpis.total_candidatos++;
    db.kpis.candidatos_activos++;
    db.kpis.nuevos_este_mes++;
    this.save(db);
    this.addNotificacion({
      id_usuario_dest: 'u-asesor-001',
      tipo: 'Nuevo_Candidato',
      titulo: 'Nuevo candidato registrado',
      mensaje: `${data.nombre} (${data.pais}, ${data.especialidad}) se ha registrado como nuevo lead.`
    });
    return nuevo;
  },

  // ── DOCUMENTOS ────────────────────────────────────────────────
  getDocumentos(id_candidato) {
    return (this.get().documentos || []).filter(d => d.id_candidato === id_candidato);
  },

  updateDocumento(id, data) {
    const db = this.get();
    const idx = db.documentos.findIndex(d => d.id === id);
    if (idx !== -1) {
      db.documentos[idx] = { ...db.documentos[idx], ...data };
      if (data.estado === 'Aprobado' || data.estado === 'Rechazado') {
        const doc = db.documentos[idx];
        const cand = db.candidatos.find(c => c.id === doc.id_candidato);
        if (cand && cand.id_usuario) {
          this.addNotificacion({
            id_usuario_dest: cand.id_usuario,
            tipo: data.estado === 'Aprobado' ? 'Documento_Aprobado' : 'Documento_Rechazado',
            titulo: `Documento ${data.estado.toLowerCase()}: ${doc.nombre}`,
            mensaje: data.estado === 'Rechazado'
              ? `Tu documento "${doc.nombre}" fue rechazado. Razón: ${data.comentario || 'Ver comentarios del asesor.'}`
              : `Tu documento "${doc.nombre}" fue aprobado exitosamente. ✅`
          }, db);
        }
      }
    }
    this.save(db);
  },

  addDocumento(data) {
    const db = this.get();
    const nuevo = { ...data, id: 'd-' + Date.now(), fecha: new Date().toISOString().split('T')[0], estado: 'Pendiente', comentario: '' };
    db.documentos.push(nuevo);
    this.addNotificacion({
      id_usuario_dest: 'u-asesor-001',
      tipo: 'Nuevo_Candidato',
      titulo: 'Nuevo documento subido',
      mensaje: `Un candidato ha subido un nuevo documento: ${data.nombre}.`
    }, db);
    this.save(db);
    return nuevo;
  },

  // ── VACANTES ──────────────────────────────────────────────────
  getVacantes() { return this.get().vacantes || []; },

  getVacantesByEmpresa(id_empresa) { return this.getVacantes().filter(v => v.id_empresa === id_empresa); },

  createVacante(data) {
    const db = this.get();
    const nueva = { ...data, id: 'v-' + Date.now(), fecha: new Date().toISOString().split('T')[0] };
    db.vacantes.push(nueva);
    db.kpis.vacantes_activas++;
    this.save(db);
    return nueva;
  },

  updateVacante(id, data) {
    const db = this.get();
    const idx = db.vacantes.findIndex(v => v.id === id);
    if (idx !== -1) db.vacantes[idx] = { ...db.vacantes[idx], ...data };
    this.save(db);
  },

  deleteVacante(id) {
    const db = this.get();
    db.vacantes = db.vacantes.filter(v => v.id !== id);
    db.kpis.vacantes_activas = Math.max(0, db.kpis.vacantes_activas - 1);
    this.save(db);
  },

  // ── NOTIFICACIONES ────────────────────────────────────────────
  getNotificaciones(id_usuario) {
    return (this.get().notificaciones || [])
      .filter(n => n.id_usuario_dest === id_usuario)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  getNotifNoLeidas(id_usuario) {
    return this.getNotificaciones(id_usuario).filter(n => !n.leida).length;
  },

  addNotificacion(data, db = null) {
    const d = db || this.get();
    const nueva = {
      ...data,
      id: 'notif-' + Date.now(),
      leida: false,
      fecha: new Date().toISOString()
    };
    d.notificaciones.push(nueva);
    if (!db) this.save(d);
  },

  marcarTodasLeidas(id_usuario) {
    const db = this.get();
    db.notificaciones.forEach(n => { if (n.id_usuario_dest === id_usuario) n.leida = true; });
    this.save(db);
  },

  // ── GRUPOS Y CLASES ───────────────────────────────────────────
  getGrupos() { return this.get().grupos || []; },

  getGruposByProfesor(id_prof) { return this.getGrupos().filter(g => g.id_profesor === id_prof); },

  getInscripcionesByGrupo(id_grupo) {
    const db = this.get();
    return (db.inscripciones || [])
      .filter(i => i.id_grupo === id_grupo)
      .map(i => {
        const cand = db.candidatos.find(c => c.id === i.id_candidato);
        return { ...i, candidato: cand };
      });
  },

  updateInscripcion(id, data) {
    const db = this.get();
    const idx = db.inscripciones.findIndex(i => i.id === id);
    if (idx !== -1) db.inscripciones[idx] = { ...db.inscripciones[idx], ...data };
    this.save(db);
    if (data.en_riesgo !== undefined) {
      this.addNotificacion({
        id_usuario_dest: 'u-asesor-001',
        tipo: 'Alerta_Rendimiento',
        titulo: 'Alerta de rendimiento',
        mensaje: `Un alumno ha sido marcado en riesgo por el profesor.`
      });
    }
  },

  // ── MATERIALES ────────────────────────────────────────────────
  getMateriales(id_grupo) { return (this.get().materiales || []).filter(m => m.id_grupo === id_grupo); },

  addMaterial(data) {
    const db = this.get();
    const nuevo = { ...data, id: 'm-' + Date.now(), fecha: new Date().toISOString().split('T')[0] };
    db.materiales.push(nuevo);
    this.save(db);
    return nuevo;
  },

  // ── MATCHINGS ─────────────────────────────────────────────────
  getMatchings() { return this.get().matchings || []; },

  crearMatching(id_candidato, id_vacante) {
    const db = this.get();
    const cand = db.candidatos.find(c => c.id === id_candidato);
    const vac = db.vacantes.find(v => v.id === id_vacante);
    let score = 70;
    if (cand && vac) {
      const nivelMap = { A1:1,A2:2,B1:3,B2:4,C1:5,C2:6,FSP:6 };
      if ((nivelMap[cand.nivel_aleman] || 0) >= (nivelMap[vac.nivel_aleman] || 0)) score += 15;
      if (cand.especialidad === vac.especialidad) score += 15;
    }
    const nuevo = {
      id: 'match-' + Date.now(),
      id_candidato, id_vacante,
      puntuacion: score,
      estado: 'Sugerido',
      fecha: new Date().toISOString().split('T')[0]
    };
    db.matchings.push(nuevo);
    this.save(db);
    return nuevo;
  },

  // ── SOCIOS ────────────────────────────────────────────────────
  getSocios() { return this.get().socios || []; },
  getSocioByUsuario(id_usuario) { return this.getSocios().find(s => s.id_usuario === id_usuario); },
  getComisionesBySocio(id_socio) { return (this.get().comisiones || []).filter(c => c.id_socio === id_socio); },

  // ── NOTAS ─────────────────────────────────────────────────────
  getNotas(id_candidato) { return (this.get().notas || []).filter(n => n.id_candidato === id_candidato).sort((a,b) => new Date(b.fecha)-new Date(a.fecha)); },

  addNota(data) {
    const db = this.get();
    const nueva = { ...data, id: 'n-' + Date.now(), fecha: new Date().toISOString().split('T')[0] };
    db.notas.push(nueva);
    this.save(db);
    return nueva;
  },

  // ── ENTREVISTAS ───────────────────────────────────────────────
  getEntrevistas() { return this.get().entrevistas || []; },

  addEntrevista(data) {
    const db = this.get();
    const nueva = { ...data, id: 'ent-' + Date.now() };
    db.entrevistas.push(nueva);
    this.addNotificacion({ id_usuario_dest: 'u-cand-001', tipo: 'Entrevista_Agendada', titulo: 'Entrevista agendada', mensaje: `Tienes una entrevista agendada con ${data.empresa} para el ${new Date(data.fecha_propuesta).toLocaleDateString('es-ES')}.` }, db);
    this.addNotificacion({ id_usuario_dest: 'u-emp-001', tipo: 'Entrevista_Agendada', titulo: 'Entrevista confirmada', mensaje: `Entrevista con candidato confirmada para el ${new Date(data.fecha_propuesta).toLocaleDateString('es-ES')}.` }, db);
    this.save(db);
    return nueva;
  },

  // ── KPIs ──────────────────────────────────────────────────────
  getKpis() { return this.get().kpis || {}; }
};
