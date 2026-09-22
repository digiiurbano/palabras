
// URL del backend: usa VITE_API_URL en producción o localhost en desarrollo
const API_URL = 'http://localhost:3030';

const OFFICIAL_USERS = [
  {
    id: 'u-admin-001', nombre: 'Ana García', roles: ['Admin'],
    correo: 'admin@jnpalabras.com', contrasena: 'JNPalabrasAdmin2026!',
    avatar: 'AG', activo: true, fecha_creacion: '2024-01-15'
  },
  {
    id: 'u-asesor-001', nombre: 'Carlos Martínez', roles: ['Asesor'],
    correo: 'asesor@jnpalabras.com', contrasena: 'JNPalabrasAsesor2026!',
    avatar: 'CM', activo: true, fecha_creacion: '2024-02-10'
  },
  {
    id: 'u-prof-001', nombre: 'Dra. Elena Weber', roles: ['Profesor'],
    correo: 'profesor@jnpalabras.com', contrasena: 'JNPalabrasProfesor2026!',
    avatar: 'EW', activo: true, fecha_creacion: '2024-02-20'
  },
  {
    id: 'u-cand-001', nombre: 'Dr. Javier Torres', roles: ['Candidato'],
    correo: 'candidato@jnpalabras.com', contrasena: 'JNPalabrasCandidato2026!',
    avatar: 'JT', activo: true, fecha_creacion: '2024-03-05'
  },
  {
    id: 'u-emp-001', nombre: 'Klinikum Stuttgart', roles: ['Empresa'],
    correo: 'empresa@jnpalabras.com', contrasena: 'JNPalabrasEmpresa2026!',
    avatar: 'KS', activo: true, fecha_creacion: '2024-01-20'
  },
  {
    id: 'u-socio-001', nombre: 'Laura Rodríguez (MediLink)', roles: ['Socio'],
    correo: 'socio@jnpalabras.com', contrasena: 'JNPalabrasSocio2026!',
    avatar: 'LR', activo: true, fecha_creacion: '2024-03-01'
  }
];

const DB = {
  data: null,

  async init() {
    // Inicializar con INITIAL_DATA por si la conexión falla (fallback en memoria, no persistente localmente)
    if (!this.data) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    // Intentar sincronizar el estado base con el backend (solo como scaffolding, 
    // las entidades reales se obtendrán por sus endpoints REST)
    try {
      const res = await fetch(`${API_URL}/api/db`);
      if (res.ok) {
        this.data = await res.json();
      }
    } catch (e) {
      console.warn("Backend no alcanzable. Usando fallback en memoria.");
    }
  },

  get() {
    if (!this.data) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    return this.data;
  },

  save(data) {
    this.data = data;
    fetch(`${API_URL}/api/db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => console.warn("Modo offline: no se pudo guardar en backend"));
  },

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    fetch(`${API_URL}/api/reset`, { method: 'POST' })
      .then(() => window.location.reload())
      .catch(() => window.location.reload());
  },

  // ── USUARIOS ──────────────────────────────────────────────────
  getUsuarios() {
    const list = this.get().usuarios;
    return (Array.isArray(list) && list.length > 0) ? list : OFFICIAL_USERS;
  },

  async findUsuario(correo, contrasena) {
    // 1. Intentar API en backend si está disponible
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
      });
      if (res.ok) {
        const user = await res.json();
        if (user && user.id) return user;
      }
    } catch (e) {
      // Ignorar fallo de red y continuar con validación local
    }

    // 2. Buscar en memoria/local de la DB
    const list = await this.getUsuarios();
    let user = list.find(u => u.correo === correo && u.contrasena === contrasena);
    
    // 3. Fallback directo a las credenciales oficiales embebidas
    if (!user) {
      user = OFFICIAL_USERS.find(u => u.correo === correo && u.contrasena === contrasena);
    }
    
    return user;
  },

  async findUsuarioById(id) {
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    
    const list = await this.getUsuarios();
    let user = list.find(u => u.id === id);
    if (!user) {
      user = OFFICIAL_USERS.find(u => u.id === id);
    }
    return user;
  },

  async createUsuario(data) {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Fallo al crear usuario en backend, fallback local");
    }
    
    const db = this.get();
    const nuevo = { ...data, id: 'u-' + Date.now(), fecha_creacion: new Date().toISOString(), activo: true };
    if (!db.usuarios) db.usuarios = [...OFFICIAL_USERS];
    db.usuarios.push(nuevo);
    this.save(db);
    return nuevo;
  },

  async updateUsuario(id, data) {
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return;
    } catch (e) {}

    const db = this.get();
    if (!db.usuarios) db.usuarios = [...OFFICIAL_USERS];
    const idx = db.usuarios.findIndex(u => u.id === id);
    if (idx !== -1) db.usuarios[idx] = { ...db.usuarios[idx], ...data };
    this.save(db);
  },

  async deleteUsuario(id) {
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) return;
    } catch (e) {}

    const db = this.get();
    if (!db.usuarios) db.usuarios = [...OFFICIAL_USERS];
    db.usuarios = db.usuarios.filter(u => u.id !== id);
    this.save(db);
  },

  // ── SESIÓN ────────────────────────────────────────────────────
  getSession() { 
    try {
      const stored = localStorage.getItem('jnpalabras_session');
      return stored ? JSON.parse(stored) : null;
    } catch(e) { return null; }
  },

  setSession(usuario) {
    try {
      localStorage.setItem('jnpalabras_session', JSON.stringify(usuario));
    } catch(e) {}
  },

  clearSession() {
    try {
      localStorage.removeItem('jnpalabras_session');
    } catch(e) {}
  },

  // ── CANDIDATOS ────────────────────────────────────────────────
  getCandidatos() {
    return this.get().candidatos || [];
  },

  getCandidatoById(id) {
    const list = this.getCandidatos();
    return list.find(c => c.id === id);
  },

  getCandidatosByEstado(estado) {
    const list = this.getCandidatos();
    return list.filter(c => c.estado_proceso === estado);
  },

  getCandidatosBySocio(id_socio) {
    const list = this.getCandidatos();
    return list.filter(c => c.id_socio === id_socio);
  },

  async createCandidato(data) {
    try {
      const res = await fetch(`${API_URL}/api/candidatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const nuevo = await res.json();
        const db = this.get();
        if (!db.candidatos) db.candidatos = [];
        db.candidatos.push(nuevo);
        return nuevo;
      }
    } catch(e) {
      console.warn('Error creando candidato en API, guardando en memoria');
    }
    
    // Fallback
    const db = this.get();
    const nuevo = { ...data, id: 'c-' + Date.now(), fecha_alta: new Date().toISOString().split('T')[0], consentimiento_gdpr: true };
    if (!db.candidatos) db.candidatos = [];
    db.candidatos.push(nuevo);
    this.save(db);
    return nuevo;
  },

  async updateCandidato(id, data) {
    try {
      const res = await fetch(`${API_URL}/api/candidatos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const editado = await res.json();
        // Update local memory copy
        const db = this.get();
        if (db.candidatos) {
          const idx = db.candidatos.findIndex(c => c.id === id);
          if (idx !== -1) db.candidatos[idx] = editado;
        }
        return editado;
      }
    } catch(e) {}
    const db = this.get();
    const idx = db.candidatos.findIndex(c => c.id === id);
    if (idx !== -1) db.candidatos[idx] = { ...db.candidatos[idx], ...data };
    this.save(db);
    return db.candidatos[idx];
  },

  async deleteCandidato(id) {
    try {
      const res = await fetch(`${API_URL}/api/candidatos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const db = this.get();
        if (db.candidatos) db.candidatos = db.candidatos.filter(c => c.id !== id);
        return true;
      }
    } catch(e) {}
    const db = this.get();
    db.candidatos = db.candidatos.filter(c => c.id !== id);
    this.save(db);
    return true;
  },

  async getCV(id_candidato) {
    const cand = await this.getCandidatoById(id_candidato);
    if (!cand) return null;
    if (cand.cv_data) return JSON.parse(JSON.stringify(cand.cv_data));

    // Fallback inicial enriquecido
    const parts = (cand.nombre || '').split(' ');
    const vorname = parts.slice(0, 2).join(' ') || cand.nombre || '';
    const name = parts.slice(2).join(' ') || '';
    return {
      personal: {
        vorname,
        name,
        beruf: cand.especialidad || 'Arzt / Facharzt',
        geburtsdatum: '',
        adresse: `${cand.pais || 'Kolumbien'}`,
        nationalitaet: cand.pais ? `${cand.pais.toLowerCase()}isch` : '',
        familienstand: 'Ledig',
        telefon: '',
        email: '',
        foto: cand.foto ? (cand.foto.startsWith('http') ? cand.foto : '') : ''
      },
      profil: `Engagierte(r) ${cand.especialidad || 'Mediziner(in)'} mit solider klinischer Erfahrung und hoher Motivation für die berufliche Integration im deutschen Gesundheitssystem.`,
      werdegang: [
        {
          zeitraum: '01/01/2020 – AKTUELL',
          titel: `${(cand.especialidad || 'ARZT').toUpperCase()} - HOSPITAL UNIVERSITARIO`,
          beschreibung: 'Stationäre und ambulante Patientenversorgung, diagnostische Verfahren und interdisziplinäre Zusammenarbeit.'
        }
      ],
      ausbildung: [
        {
          zeitraum: '2012 – 2018',
          beschreibung: `Studium der Medizin / Pflege,\nUniversität in ${cand.pais || 'Lateinamerika'}`
        }
      ],
      sprachen: [
        { sprache: 'Spanisch', niveau: 'Muttersprache' },
        { sprache: 'Deutsch', niveau: `Niveau ${cand.nivel_aleman || 'B2'}` }
      ]
    };
  },

  saveCV(id_candidato, cvData) {
    const db = this.get();
    const idx = db.candidatos.findIndex(c => c.id === id_candidato);
    if (idx !== -1) {
      db.candidatos[idx].cv_data = cvData;
      if (cvData.personal) {
        if (cvData.personal.vorname || cvData.personal.name) {
          db.candidatos[idx].nombre = `${cvData.personal.vorname || ''} ${cvData.personal.name || ''}`.trim() || db.candidatos[idx].nombre;
        }
        if (cvData.personal.beruf) {
          db.candidatos[idx].especialidad = cvData.personal.beruf;
        }
        if (cvData.personal.nationalitaet) {
          db.candidatos[idx].pais = cvData.personal.nationalitaet;
        }
      }
      if (Array.isArray(cvData.sprachen)) {
        const d = cvData.sprachen.find(s => s.sprache && s.sprache.toLowerCase().includes('deutsch'));
        if (d && d.niveau) {
          const match = d.niveau.match(/\b(A1|A2|B1|B2|C1|C2|FSP)\b/i);
          if (match) db.candidatos[idx].nivel_aleman = match[1].toUpperCase();
        }
      }

      // Sincronizar documento en la bóveda
      if (!db.documentos) db.documentos = [];
      const existingDocIdx = db.documentos.findIndex(doc => doc.id_candidato === id_candidato && (doc.categoria === 'Curriculum Vitae' || doc.nombre.includes('Lebenslauf')));
      if (existingDocIdx !== -1) {
        db.documentos[existingDocIdx].estado = 'Aprobado';
        db.documentos[existingDocIdx].fecha = new Date().toISOString().split('T')[0];
      } else {
        db.documentos.push({
          id: 'doc-' + Date.now(),
          id_candidato,
          nombre: 'Lebenslauf_JN_Palabras.pdf',
          categoria: 'Curriculum Vitae',
          estado: 'Aprobado',
          tamano: '1.2 MB',
          fecha: new Date().toISOString().split('T')[0]
        });
      }
      this.save(db);
    }
    return cvData;
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
