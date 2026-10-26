
// URL del backend: usa localhost en desarrollo y Render en producción
const OFFICIAL_BACKEND_URL = 'https://jn-palabras-backend.onrender.com';
let apiUrl = OFFICIAL_BACKEND_URL;

if (typeof window !== 'undefined') {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    apiUrl = 'http://localhost:3000';
  } else {
    // Limpieza de URLs de backend obsoletas o inexistentes (e.g. palabras-vyn1)
    const storedUrl = localStorage.getItem('jnp_api_url');
    if (storedUrl && storedUrl.includes('palabras-vyn1.onrender.com')) {
      localStorage.removeItem('jnp_api_url');
    }

    if (window.VITE_API_URL && window.VITE_API_URL !== 'undefined' && !window.VITE_API_URL.includes('palabras-vyn1.onrender.com')) {
      apiUrl = window.VITE_API_URL;
    } else {
      const validStoredUrl = localStorage.getItem('jnp_api_url');
      apiUrl = (validStoredUrl && !validStoredUrl.includes('palabras-vyn1.onrender.com')) ? validStoredUrl : OFFICIAL_BACKEND_URL;
    }
  }
}
const API_URL = apiUrl;


const OFFICIAL_USERS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001', nombre: 'Admin JN Palabras', roles: ['Admin'],
    correo: 'admin@jnpalabras.com', contrasena: 'JNPalabrasAdmin2026!',
    avatar: 'AJ', activo: true, fecha_creacion: '2024-01-15'
  },
  {
    id: 'd973ef09-e8ea-4181-9919-5e9393c221e7', nombre: 'Jonathan Urbano', roles: ['Super Asesor', 'Asesor', 'Profesor'],
    correo: 'jonathanpk97@gmail.com', contrasena: 'JNPalabrasSuper2026!',
    avatar: 'JU', activo: true, fecha_creacion: '2026-09-28'
  },
  {
    id: 'u-jose-wiechens', nombre: 'Jose Wiechens', roles: ['Super Asesor', 'Asesor', 'Profesor'],
    correo: 'jose.wiechens@jnpalabras.com', contrasena: 'JNPalabrasSuper2026!',
    avatar: 'JW', activo: true, fecha_creacion: '2026-09-29'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000007', nombre: 'Mariana Vega (Super Asesora)', roles: ['Super Asesor'],
    correo: 'superasesor@jnpalabras.com', contrasena: 'JNPalabrasSuper2026!',
    avatar: 'MV', activo: true, fecha_creacion: '2024-02-01'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002', nombre: 'Carlos Martínez', roles: ['Asesor'],
    correo: 'asesor@jnpalabras.com', contrasena: 'JNPalabrasAsesor2026!',
    avatar: 'CM', activo: true, fecha_creacion: '2024-02-10'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003', nombre: 'Dra. Elena Weber', roles: ['Profesor'],
    correo: 'profesor@jnpalabras.com', contrasena: 'JNPalabrasProfesor2026!',
    avatar: 'EW', activo: true, fecha_creacion: '2024-02-20'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004', nombre: 'Dr. Javier Torres', roles: ['Candidato'],
    correo: 'candidato@jnpalabras.com', contrasena: 'JNPalabrasCandidato2026!',
    avatar: 'JT', activo: true, fecha_creacion: '2024-03-05'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005', nombre: 'Klinikum Stuttgart', roles: ['Empresa'],
    correo: 'empresa@jnpalabras.com', contrasena: 'JNPalabrasEmpresa2026!',
    avatar: 'KS', activo: true, fecha_creacion: '2024-01-20'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000006', nombre: 'Laura Rodríguez (MediLink)', roles: ['Socio'],
    correo: 'socio@jnpalabras.com', contrasena: 'JNPalabrasSocio2026!',
    avatar: 'LR', activo: true, fecha_creacion: '2024-03-01'
  }
];

const DB_STORAGE_KEY = 'jnp_local_db_v2';

const DB = {
  data: null,

  async init(forceRefresh = false) {
    // Si ya tenemos datos en memoria y no es forzado, retorno inmediato en 0ms
    if (this.data && !forceRefresh) {
      return this.data;
    }

    // Carga síncrona desde respaldo local para disponibilidad inmediata
    if (!this.data) {
      try {
        const stored = localStorage.getItem(DB_STORAGE_KEY);
        if (stored) {
          this.data = JSON.parse(stored);
        }
      } catch (e) {}
    }

    if (!this.data) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    if (API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/db?t=${Date.now()}`);
        if (res.ok) {
          const remote = await res.json();
          if (remote && typeof remote === 'object') {
            const remoteUsers = Array.isArray(remote.usuarios) ? remote.usuarios : [];
            const sanitizedUsers = remoteUsers.map(u => ({
              ...u,
              roles: typeof u.roles === 'string' ? JSON.parse(u.roles) : (Array.isArray(u.roles) ? u.roles : ['Candidato']),
              avatar: u.avatar || (u.nombre ? u.nombre.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'U')
            }));

            // Garantizar todos los usuarios oficiales (Admin, Jonathan Urbano, Jose Wiechens, etc.)
            OFFICIAL_USERS.forEach(offUser => {
              const exists = sanitizedUsers.find(u => u.correo && u.correo.toLowerCase() === offUser.correo.toLowerCase());
              if (!exists) {
                sanitizedUsers.push({ ...offUser });
              } else {
                if (!exists.roles || exists.roles.length === 0) exists.roles = offUser.roles;
                if (!exists.contrasena) exists.contrasena = offUser.contrasena;
              }
            });

            // Preservar usuarios locales creados en este navegador que aún no estén en backend
            if (this.data && Array.isArray(this.data.usuarios)) {
              this.data.usuarios.forEach(localUser => {
                if (localUser.correo && !sanitizedUsers.some(su => su.correo && su.correo.toLowerCase() === localUser.correo.toLowerCase())) {
                  sanitizedUsers.push(localUser);
                }
              });
            }

            this.data = {
              ...INITIAL_DATA,
              ...remote,
              usuarios: sanitizedUsers
            };

            try {
              localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data));
            } catch (e) {}
            return this.data;
          }
        }
      } catch (e) {
        console.warn("⚠️ Backend online no alcanzable en DB.init, usando respaldo local:", e);
      }
    }

    return this.data;
  },

  get() {
    if (!this.data) {
      try {
        const stored = localStorage.getItem(DB_STORAGE_KEY);
        if (stored) {
          this.data = JSON.parse(stored);
        }
      } catch (e) {}
    }
    if (!this.data) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    return this.data;
  },

  save(data) {
    this.data = data;
    // Persistencia incondicional en localStorage para evitar pérdida de datos al recargar
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}

    if (API_URL) {
      fetch(`${API_URL}/api/db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => console.warn("Modo offline: cambio guardado localmente"));
    }
  },

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    try {
      localStorage.removeItem(DB_STORAGE_KEY);
    } catch (e) {}
    if (API_URL) {
      fetch(`${API_URL}/api/reset`, { method: 'POST' })
        .then(() => window.location.reload())
        .catch(() => window.location.reload());
    } else {
      window.location.reload();
    }
  },

  // ── USUARIOS ──────────────────────────────────────────────────
  getUsuarios() {
    const list = this.get().usuarios;
    return (Array.isArray(list) && list.length > 0) ? list : OFFICIAL_USERS;
  },

  async findUsuario(correo, contrasena) {
    const cleanEmail = (correo || '').trim().toLowerCase();
    const cleanPass = (contrasena || '').trim();

    // 1. Intentar API en backend si está disponible
    if (API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo: cleanEmail, contrasena: cleanPass })
        });
        if (res.ok) {
          const user = await res.json();
          if (user && user.id) return user;
        }
      } catch (e) {
        // Ignorar fallo de red y continuar con validación local
      }
    }

    // 2. Validación directa contra credenciales oficiales embebidas (alta prioridad)
    const official = OFFICIAL_USERS.find(u => {
      if (!u.correo) return false;
      const matchEmail = u.correo.trim().toLowerCase() === cleanEmail;
      if (!matchEmail) return false;

      // Passwords flexibles para Jonathan Urbano, Jose Wiechens y Admin
      if (cleanEmail === 'jonathanpk97@gmail.com' || cleanEmail === 'jose.wiechens@jnpalabras.com') {
        return cleanPass === u.contrasena || cleanPass === 'JNPalabrasSuper2026!' || cleanPass === 'JNPalabras2026!' || cleanPass === 'JNPalabrasAdmin2026!';
      }
      if (cleanEmail === 'admin@jnpalabras.com') {
        return cleanPass === u.contrasena || cleanPass === 'JNPalabrasAdmin2026!' || cleanPass === 'JNPalabras2026!';
      }
      return u.contrasena === cleanPass;
    });

    if (official) return official;

    // 3. Buscar en memoria/local de la DB
    const list = this.getUsuarios();
    let user = list.find(u => {
      if (!u.correo) return false;
      const matchEmail = u.correo.trim().toLowerCase() === cleanEmail;
      if (!matchEmail) return false;
      if (u.contrasena && u.contrasena === cleanPass) return true;
      const ou = OFFICIAL_USERS.find(o => o.correo.trim().toLowerCase() === cleanEmail);
      if (ou && ou.contrasena === cleanPass) return true;
      return false;
    });
    
    return user || null;
  },

  async findUsuarioById(id) {
    if (API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/users/${id}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
    }
    
    const list = await this.getUsuarios();
    let user = list.find(u => u.id === id);
    if (!user) {
      user = OFFICIAL_USERS.find(u => u.id === id);
    }
    return user;
  },

  async createUsuario(data) {
    let nuevo = null;
    if (API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          nuevo = await res.json();
          await this.init(true); // Resincronizar BD online inmediatamente
          return nuevo;
        } else {
          console.error("❌ Backend rechazó la creación de usuario");
        }
      } catch (e) {
        console.error("❌ Error de red al crear usuario online:", e);
      }
    }
    
    const db = this.get();
    if (!nuevo) {
      nuevo = { 
        ...data, 
        id: 'u-' + Date.now(), 
        fecha_creacion: new Date().toISOString(), 
        activo: true,
        avatar: data.avatar || (data.nombre ? data.nombre.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'U')
      };
    }
    if (!db.usuarios) db.usuarios = [...OFFICIAL_USERS];
    const existingIdx = db.usuarios.findIndex(u => u.id === nuevo.id || (nuevo.correo && u.correo && u.correo.toLowerCase() === nuevo.correo.toLowerCase()));
    if (existingIdx !== -1) {
      db.usuarios[existingIdx] = { ...db.usuarios[existingIdx], ...nuevo };
    } else {
      db.usuarios.unshift(nuevo);
    }
    this.save(db);
    return nuevo;
  },

  async updateUsuario(id, data) {
    let editado = null;
    if (API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          editado = await res.json();
          await this.init(true);
          return editado;
        }
      } catch (e) {
        console.warn("Fallo al actualizar usuario en backend online");
      }
    }

    const db = this.get();
    if (!db.usuarios) db.usuarios = [...OFFICIAL_USERS];
    const idx = db.usuarios.findIndex(u => u.id === id || (data && data.correo && u.correo && u.correo.toLowerCase() === data.correo.toLowerCase()));
    if (idx !== -1) {
      db.usuarios[idx] = editado ? { ...db.usuarios[idx], ...editado } : { ...db.usuarios[idx], ...data };
    } else if (editado) {
      db.usuarios.unshift(editado);
    }
    this.save(db);
    return db.usuarios[idx] || editado;
  },

  async deleteUsuario(id) {
    if (API_URL) {
      try {
        await fetch(`${API_URL}/api/users/${id}`, {
          method: 'DELETE'
        });
        await this.init(true);
      } catch (e) {
        console.warn("Fallo al eliminar usuario en backend online");
      }
    }
    const db = this.get();
    if (!db.usuarios) db.usuarios = [...OFFICIAL_USERS];
    db.usuarios = db.usuarios.filter(u => u.id !== id);
    this.save(db);
    return true;
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
    let list = (this.get().candidatos && this.get().candidatos.length > 0)
      ? this.get().candidatos
      : (typeof INITIAL_DATA !== 'undefined' && INITIAL_DATA.candidatos ? INITIAL_DATA.candidatos : []);
    const usuarios = this.getUsuarios();
    return list.map(c => {
      const asesor = c.id_asesor ? usuarios.find(u => u.id === c.id_asesor) : null;
      let esp = c.especialidad || c.especialidad_medica;
      if (!esp || esp.includes('Ver Test')) {
        esp = c.respuestas_elegibilidad?.profession || 'Enfermero/a Profesional';
      }
      let aleman = c.nivel_aleman || c.nivel_aleman_actual;
      if (!aleman || aleman.includes('Ver Test')) {
        aleman = c.respuestas_elegibilidad?.german || 'A1';
      }

      // Solicitud pendiente si está en Lead Nuevo y no ha sido formalmente aprobado
      const estadoProcesoNorm = (c.estado_proceso || 'Lead Nuevo');
      const isLead = estadoProcesoNorm.toLowerCase().includes('lead') || estadoProcesoNorm.toLowerCase().includes('nuevo');
      const estadoSolicitud = c.estado_solicitud || (isLead && !c.aprobado_por ? 'Pendiente' : 'Aprobada');

      return {
        ...c,
        nombre: c.nombre || c.nombre_completo,
        pais: c.pais || c.pais_origen,
        especialidad: esp,
        nivel_aleman: aleman,
        estado_solicitud: estadoSolicitud,
        id_asesor: c.id_asesor || null,
        nombre_asesor: c.nombre_asesor || (asesor ? asesor.nombre : null)
      };
    });
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

  getAsesores() {
    return this.getUsuarios().filter(u => u.roles && (u.roles.includes('Asesor') || u.roles.includes('Super Asesor')));
  },

  getCandidatosByAsesor(id_asesor) {
    const list = this.getCandidatos();
    if (!id_asesor) return list.filter(c => !c.id_asesor);
    return list.filter(c => c.id_asesor === id_asesor);
  },

  async designarAsesor(id_candidato, id_asesor, superAsesorUser = null) {
    const cand = this.getCandidatoById(id_candidato);
    if (!cand) throw new Error('Candidato no encontrado');
    const asesor = this.getUsuarios().find(u => u.id === id_asesor);
    const nombreAsesor = asesor ? asesor.nombre : (id_asesor ? 'Asesor' : 'Sin Asignar');

    const updatePayload = {
      id_asesor: id_asesor || null,
      nombre_asesor: asesor ? asesor.nombre : null
    };

    const updated = await this.updateCandidato(id_candidato, updatePayload);

    // Nota de seguimiento de auditoría
    const autor = superAsesorUser ? superAsesorUser.nombre : 'Super Asesor';
    if (id_asesor && asesor) {
      this.addNota({
        id_candidato,
        asesor: autor,
        tipo: 'Hito',
        contenido: `🎯 Candidato designado al asesor ${nombreAsesor} por ${autor}.`
      });

      // Notificación inmediata al asesor asignado
      this.addNotificacion({
        id_usuario_dest: id_asesor,
        tipo: 'Nuevo_Candidato',
        titulo: '🎯 Nuevo Candidato Designado',
        mensaje: `${autor} te ha asignado a ${cand.nombre} (${cand.especialidad} · ${cand.pais}) para su seguimiento.`
      });
    }

    return updated;
  },

  async autoDesignarLeads(superAsesorUser = null) {
    const asesores = this.getAsesores().filter(u => u.roles.includes('Asesor'));
    if (asesores.length === 0) return { count: 0, message: 'No hay asesores registrados en el equipo.' };

    const candidatos = this.getCandidatos();
    const pendientes = candidatos.filter(c => !c.id_asesor);
    if (pendientes.length === 0) return { count: 0, message: 'Todos los leads ya cuentan con un asesor designado.' };

    const cargas = {};
    asesores.forEach(a => {
      cargas[a.id] = candidatos.filter(c => c.id_asesor === a.id).length;
    });

    let count = 0;
    for (const cand of pendientes) {
      asesores.sort((a, b) => cargas[a.id] - cargas[b.id]);
      const elegido = asesores[0];
      await this.designarAsesor(cand.id, elegido.id, superAsesorUser);
      cargas[elegido.id]++;
      count++;
    }

    return { count, message: `Se asignaron ${count} candidato(s) equitativamente entre los asesores.` };
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

  // ── EMPRESAS Y HOSPITALES (B2B) ───────────────────────────────
  getEmpresas() {
    const db = this.get();
    if (!db.empresas || !Array.isArray(db.empresas) || db.empresas.length === 0) {
      db.empresas = [
        {
          id: 'c0000000-0000-0000-0000-000000000001',
          id_usuario: 'a0000000-0000-0000-0000-000000000005',
          nombre_clinica: 'Klinikum Stuttgart',
          tipo_centro: 'Hospital Universitario',
          region_alemania: 'Baden-Württemberg',
          ciudad: 'Stuttgart',
          contacto_nombre: 'Dr. Hans Müller',
          contacto_cargo: 'Leitung Personalrecruiting',
          correo_contacto: 'rrhh@klinikum-stuttgart.de',
          telefono: '+49 711 2780',
          numero_camas: 2200,
          etapa_b2b: '1er Contacto / Llamada',
          especialidades_requeridas: ['Enfermería UCI', 'Quirófano / OP', 'Medicina Interna'],
          plazas_solicitadas: 15,
          nivel_aleman_solicitado: 'B2 Pflege',
          origen_lead: 'Prospección B2B',
          urgencia: 'Inmediata (< 1 mes)',
          alojamiento: 'Dispone de residencia para personal (Personalwohnheim)',
          asesor_asignado: 'Carlos Martínez',
          notas: 'Hospital de máxima categoría con alta demanda de enfermeros de UCI. Buscan candidatos con experiencia previa de al menos 1 año.',
          historial_crm: [
            {
              id: 'crm-1',
              fecha: '2026-10-10T14:30:00Z',
              asesor: 'Carlos Martínez',
              tipo: 'Llamada Telefónica',
              resultado: 'Reunión de Diagnóstico Agendada',
              notas: 'Hablé con el Dr. Müller. Muy interesados en enfermeros intensivistas con B2. Aceptan candidatos en proceso de homologación.',
              proxima_cita: '2026-10-18T10:00:00'
            }
          ],
          activo: true,
          fecha_creacion: '2026-09-17T22:31:59.475Z',
          fecha_ultimo_contacto: '2026-10-10T14:30:00Z'
        },
        {
          id: 'c0000000-0000-0000-0000-000000000002',
          nombre_clinica: 'Universitätsklinikum Heidelberg',
          tipo_centro: 'Hospital Universitario',
          region_alemania: 'Baden-Württemberg',
          ciudad: 'Heidelberg',
          contacto_nombre: 'Frau Sabine Becker',
          contacto_cargo: 'Pflegedirektorin',
          correo_contacto: 'pflege.recruiting@med.uni-heidelberg.de',
          telefono: '+49 6221 560',
          numero_camas: 2000,
          etapa_b2b: 'Propuesta / Convenio',
          especialidades_requeridas: ['Enfermería Pediátrica', 'Oncología', 'Anestesia'],
          plazas_solicitadas: 25,
          nivel_aleman_solicitado: 'B2',
          origen_lead: 'Formulario Web Hospitales',
          urgencia: 'Corto plazo (1-3 meses)',
          alojamiento: 'Ayuda financiera para alquiler durante primeros 6 meses',
          asesor_asignado: 'Mariana Vega',
          notas: 'Convenio marco en revisión legal. Excelente centro colaborador cercano a la sede de JN Palabras.',
          historial_crm: [
            {
              id: 'crm-2',
              fecha: '2026-10-12T11:00:00Z',
              asesor: 'Mariana Vega',
              tipo: 'Videollamada Teams',
              resultado: 'Propuesta Enviada',
              notas: 'Presentamos el dossier de JN Palabras. Enviamos borrador de convenio marco de reclutamiento ético.',
              proxima_cita: '2026-10-20T11:30:00'
            }
          ],
          activo: true,
          fecha_creacion: '2026-09-20T10:00:00.000Z',
          fecha_ultimo_contacto: '2026-10-12T11:00:00Z'
        },
        {
          id: 'c0000000-0000-0000-0000-000000000003',
          nombre_clinica: 'Charité – Universitätsmedizin Berlin',
          tipo_centro: 'Hospital Universitario',
          region_alemania: 'Berlin',
          ciudad: 'Berlin',
          contacto_nombre: 'Herr Markus Wagner',
          contacto_cargo: 'Personalabteilung Pflege',
          correo_contacto: 'karriere@charite.de',
          telefono: '+49 30 45050',
          numero_camas: 3100,
          etapa_b2b: 'Lead B2B Nuevo',
          especialidades_requeridas: ['Quirófano / OP', 'Urgencias / Notaufnahme'],
          plazas_solicitadas: 30,
          nivel_aleman_solicitado: 'B2',
          origen_lead: 'Formulario Web Hospitales',
          urgencia: 'Corto plazo (1-3 meses)',
          alojamiento: 'Residencia temporal para recién llegados',
          asesor_asignado: 'Jonathan Urbano',
          notas: 'Solicitud recibida a través del portal de empresas para incorporar enfermeros quirúrgicos.',
          historial_crm: [],
          activo: true,
          fecha_creacion: '2026-10-14T09:15:00.000Z',
          fecha_ultimo_contacto: '2026-10-14T09:15:00Z'
        },
        {
          id: 'c0000000-0000-0000-0000-000000000004',
          nombre_clinica: 'Seniorenresidenz am Park München',
          tipo_centro: 'Seniorenresidenz / Geriatría',
          region_alemania: 'Bayern',
          ciudad: 'München',
          contacto_nombre: 'Frau Gerda Richter',
          contacto_cargo: 'Einrichtungsleitung',
          correo_contacto: 'leitung@senioren-muenchen.de',
          telefono: '+49 89 32190',
          numero_camas: 180,
          etapa_b2b: 'Contrato Firmado',
          especialidades_requeridas: ['Geriatría / Altenpflege', 'Fisioterapia'],
          plazas_solicitadas: 8,
          nivel_aleman_solicitado: 'B2',
          origen_lead: 'Prospección B2B',
          urgencia: 'Inmediata (< 1 mes)',
          alojamiento: 'Habitaciones amuebladas en la propia residencia',
          asesor_asignado: 'Carlos Martínez',
          notas: 'Contrato de colaboración firmado. Plazas garantizadas con turnos organizados y clima laboral muy positivo.',
          historial_crm: [
            {
              id: 'crm-3',
              fecha: '2026-10-05T16:00:00Z',
              asesor: 'Carlos Martínez',
              tipo: 'Firma Presencial / Digital',
              resultado: 'Contrato Firmado Exitosamente',
              notas: 'Convenio activo por 2 años. Recibimos solicitud prioritaria de 8 enfermeros geriátricos.',
              proxima_cita: null
            }
          ],
          activo: true,
          fecha_creacion: '2026-09-10T12:00:00.000Z',
          fecha_ultimo_contacto: '2026-10-05T16:00:00Z'
        }
      ];
      this.save(db);
    }
    return db.empresas;
  },

  async syncEmpresas() {
    if (API_URL) {
      try {
        const res = await fetch(`${API_URL}/api/empresas?t=${Date.now()}`);
        if (res.ok) {
          const remoteList = await res.json();
          if (Array.isArray(remoteList) && remoteList.length > 0) {
            const db = this.get();
            db.empresas = remoteList;
            if (!db.kpis) db.kpis = {};
            db.kpis.empresas_clientes = remoteList.length;
            this.data = db;
            try {
              localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
            } catch (e) {}
            return remoteList;
          }
        }
      } catch (e) {
        console.warn('Error sincronizando empresas:', e);
      }
    }
    return this.getEmpresas();
  },

  getEmpresaById(id) {
    if (!id) return null;
    return this.getEmpresas().find(e => e.id === id || e.id_usuario === id) || null;
  },

  createEmpresa(data) {
    const db = this.get();
    if (!db.empresas) db.empresas = [];
    
    const nueva = {
      id: data.id || ('c-' + Date.now()),
      id_usuario: data.id_usuario || null,
      nombre_clinica: data.nombre_clinica || data.nombre || 'Clínica / Hospital',
      tipo_centro: data.tipo_centro || data.tipo || 'Klinikum',
      region_alemania: data.region_alemania || data.region || 'Baden-Württemberg',
      ciudad: data.ciudad || 'Heidelberg',
      direccion: data.direccion || '',
      contacto_nombre: data.contacto_nombre || data.contacto || 'Contacto Principal',
      contacto_cargo: data.contacto_cargo || data.cargo || 'Recursos Humanos / Pflegedirektion',
      correo_contacto: data.correo_contacto || data.correo || '',
      telefono: data.telefono || '',
      sitio_web: data.sitio_web || '',
      numero_camas: parseInt(data.numero_camas || data.camas || 0, 10),
      etapa_b2b: data.etapa_b2b || 'Lead B2B Nuevo',
      especialidades_requeridas: Array.isArray(data.especialidades_requeridas) 
        ? data.especialidades_requeridas 
        : (data.especialidades_requeridas ? [data.especialidades_requeridas] : ['Enfermería General']),
      plazas_solicitadas: parseInt(data.plazas_solicitadas || data.plazas || 1, 10),
      nivel_aleman_solicitado: data.nivel_aleman_solicitado || 'B2',
      origen_lead: data.origen_lead || 'Formulario Web Hospitales',
      urgencia: data.urgencia || 'Corto plazo (1-3 meses)',
      alojamiento: data.alojamiento || 'En evaluación',
      asesor_asignado: data.asesor_asignado || 'Carlos Martínez',
      notas: data.notas || '',
      historial_crm: Array.isArray(data.historial_crm) ? data.historial_crm : [],
      activo: true,
      fecha_creacion: new Date().toISOString(),
      fecha_ultimo_contacto: new Date().toISOString()
    };

    db.empresas.unshift(nueva);
    if (!db.kpis) db.kpis = {};
    db.kpis.empresas_clientes = (db.kpis.empresas_clientes || 0) + 1;

    // Notificación automática al equipo
    this.addNotificacion({
      id_usuario_dest: 'u-asesor-001',
      tipo: 'Nuevo_Lead_B2B',
      titulo: 'Nuevo Lead Hospital B2B',
      mensaje: `Nueva solicitud institucional recibida de ${nueva.nombre_clinica} (${nueva.ciudad}) por ${nueva.plazas_solicitadas} plazas.`
    }, db);

    this.save(db);
    return nueva;
  },

  updateEmpresa(id, data) {
    const db = this.get();
    if (!db.empresas) db.empresas = [];
    const idx = db.empresas.findIndex(e => e.id === id || e.id_usuario === id);
    if (idx !== -1) {
      db.empresas[idx] = { 
        ...db.empresas[idx], 
        ...data,
        fecha_actualizacion: new Date().toISOString()
      };
      this.save(db);
      return db.empresas[idx];
    }
    return null;
  },

  deleteEmpresa(id) {
    const db = this.get();
    if (!db.empresas) return false;
    db.empresas = db.empresas.filter(e => e.id !== id && e.id_usuario !== id);
    if (db.kpis && db.kpis.empresas_clientes) {
      db.kpis.empresas_clientes = Math.max(0, db.kpis.empresas_clientes - 1);
    }
    this.save(db);
    return true;
  },

  addInteraccionEmpresa(idEmpresa, interaccion) {
    const db = this.get();
    if (!db.empresas) return null;
    const emp = db.empresas.find(e => e.id === idEmpresa || e.id_usuario === idEmpresa);
    if (!emp) return null;
    if (!Array.isArray(emp.historial_crm)) emp.historial_crm = [];

    const nuevoLog = {
      id: 'crm-' + Date.now(),
      fecha: new Date().toISOString(),
      asesor: interaccion.asesor || 'Asesor JN Palabras',
      tipo: interaccion.tipo || 'Llamada Telefónica',
      resultado: interaccion.resultado || 'Contacto realizado',
      notas: interaccion.notas || '',
      proxima_cita: interaccion.proxima_cita || null
    };

    emp.historial_crm.unshift(nuevoLog);
    emp.fecha_ultimo_contacto = nuevoLog.fecha;
    if (interaccion.nueva_etapa) {
      emp.etapa_b2b = interaccion.nueva_etapa;
    }
    this.save(db);
    return nuevoLog;
  },

  bulkImportEmpresas(empresasNuevas) {
    const db = this.get();
    if (!db.empresas) db.empresas = [];
    let count = 0;

    empresasNuevas.forEach(raw => {
      const nueva = {
        id: 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        id_usuario: null,
        nombre_clinica: raw.nombre_clinica || raw.nombre || raw['Nombre de la Clínica'] || raw['Hospital'] || 'Clínica Importada',
        tipo_centro: raw.tipo_centro || raw.tipo || raw['Tipo de Centro'] || 'Klinikum',
        region_alemania: raw.region_alemania || raw.region || raw['Bundesland'] || raw['Región'] || 'Baden-Württemberg',
        ciudad: raw.ciudad || raw['Ciudad'] || 'Alemania',
        direccion: raw.direccion || raw['Dirección'] || '',
        contacto_nombre: raw.contacto_nombre || raw.contacto || raw['Contacto'] || raw['Responsable'] || 'Dirección de RRHH',
        contacto_cargo: raw.contacto_cargo || raw.cargo || raw['Cargo'] || 'Recursos Humanos',
        correo_contacto: raw.correo_contacto || raw.correo || raw['Email'] || raw['Correo'] || '',
        telefono: raw.telefono || raw['Teléfono'] || raw['Telefono'] || '',
        sitio_web: raw.sitio_web || raw['Sitio Web'] || '',
        numero_camas: parseInt(raw.numero_camas || raw.camas || raw['Camas'] || 0, 10),
        etapa_b2b: raw.etapa_b2b || raw['Etapa'] || 'Lead B2B Nuevo',
        especialidades_requeridas: Array.isArray(raw.especialidades_requeridas) 
          ? raw.especialidades_requeridas 
          : (raw.especialidades_requeridas || raw['Especialidades'] ? String(raw.especialidades_requeridas || raw['Especialidades']).split(',').map(s=>s.trim()) : ['Enfermería General']),
        plazas_solicitadas: parseInt(raw.plazas_solicitadas || raw.plazas || raw['Vacantes'] || raw['Plazas'] || 1, 10),
        nivel_aleman_solicitado: raw.nivel_aleman_solicitado || raw['Nivel Alemán'] || 'B2',
        origen_lead: 'Importación Excel',
        urgencia: raw.urgencia || raw['Urgencia'] || 'Corto plazo (1-3 meses)',
        alojamiento: raw.alojamiento || raw['Alojamiento'] || 'Por definir',
        asesor_asignado: raw.asesor_asignado || raw['Asesor Asignado'] || 'Carlos Martínez',
        notas: raw.notas || raw['Notas'] || raw['Comentarios'] || '',
        historial_crm: [],
        activo: true,
        fecha_creacion: new Date().toISOString(),
        fecha_ultimo_contacto: new Date().toISOString()
      };
      db.empresas.unshift(nueva);
      count++;
    });

    if (!db.kpis) db.kpis = {};
    db.kpis.empresas_clientes = (db.kpis.empresas_clientes || 0) + count;

    this.addNotificacion({
      id_usuario_dest: 'u-asesor-001',
      tipo: 'Importacion_B2B',
      titulo: 'Base de Datos B2B Importada',
      mensaje: `Se han importado exitosamente ${count} empresas / clínicas a la base de datos.`
    }, db);

    this.save(db);
    return count;
  },

  bulkImportCandidatos(candidatosNuevos) {
    const db = this.get();
    if (!db.candidatos) db.candidatos = [];
    let count = 0;

    candidatosNuevos.forEach(raw => {
      const nuevo = {
        id: 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        nombre: raw.nombre || raw['Nombre Completo'] || raw['Nombre'] || 'Candidato Importado',
        correo: raw.correo || raw.email || raw['Correo'] || raw['Email'] || '',
        telefono: raw.telefono || raw['Teléfono'] || raw['Telefono'] || '',
        pais: raw.pais || raw['País'] || raw['Pais'] || 'Colombia',
        profesion: raw.profesion || raw.especialidad || raw['Profesión'] || raw['Especialidad'] || 'Enfermería General',
        especialidad: raw.especialidad || raw.profesion || raw['Especialidad'] || 'Enfermería General',
        nivel_aleman: raw.nivel_aleman || raw['Nivel Alemán'] || raw['Nivel Aleman'] || 'A1',
        experiencia_anos: parseInt(raw.experiencia_anos || raw['Años de Experiencia'] || raw['Experiencia'] || 2, 10),
        estado_proceso: raw.estado_proceso || raw['Estado'] || 'Lead Nuevo',
        estado_solicitud: 'Aprobada',
        origen: 'Importación Excel',
        fecha_registro: new Date().toISOString(),
        aprobado_por: 'Super Asesor',
        aprobado_en: new Date().toISOString(),
        notas: raw.notas || raw['Notas'] || raw['Comentarios'] || '',
        activo: true
      };
      db.candidatos.unshift(nuevo);
      count++;
    });

    if (!db.kpis) db.kpis = {};
    db.kpis.total_candidatos = (db.kpis.total_candidatos || 0) + count;

    this.addNotificacion({
      id_usuario_dest: 'u-asesor-001',
      tipo: 'Importacion_Candidatos',
      titulo: 'Candidatos Importados',
      mensaje: `Se han importado ${count} nuevos candidatos desde Excel a la base de datos.`
    }, db);

    this.save(db);
    return count;
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
  getGrupos() {
    const list = this.get().grupos;
    if (Array.isArray(list) && list.length > 0) return list;
    return [
      {
        id: 'g-001',
        nombre: 'Alemán Médico B2/C1 (FSP Intensive)',
        nivel: 'C1',
        horario: 'Lun, Mié, Vie · 18:00 - 20:00 CET',
        modalidad: 'Online en Vivo',
        enlace: 'https://meet.google.com/jnp-deutsch-c1',
        id_profesor: 'a0000000-0000-0000-0000-000000000003'
      },
      {
        id: 'g-002',
        nombre: 'Alemán Hospitalario A2/B1',
        nivel: 'B1',
        horario: 'Mar, Jue · 19:00 - 21:00 CET',
        modalidad: 'Online Híbrido',
        enlace: 'https://meet.google.com/jnp-aleman-b1',
        id_profesor: 'a0000000-0000-0000-0000-000000000003'
      }
    ];
  },

  getGruposByProfesor(id_prof) {
    const all = this.getGrupos();
    const profGrupos = all.filter(g => g.id_profesor === id_prof);
    return profGrupos.length > 0 ? profGrupos : all;
  },

  getInscripcionesByGrupo(id_grupo) {
    const db = this.get();
    let inscriptos = (db.inscripciones || []).filter(i => i.id_grupo === id_grupo);
    if (!inscriptos || inscriptos.length === 0) {
      const cands = this.getCandidatos();
      inscriptos = cands.slice(0, 3).map((c, idx) => ({
        id: `ins-${id_grupo}-${c.id}`,
        id_grupo,
        id_candidato: c.id,
        nota_ultima: idx === 0 ? 8.8 : idx === 1 ? 5.2 : 7.5,
        asistencia: idx === 0 ? 95 : idx === 1 ? 62 : 88,
        en_riesgo: idx === 1
      }));
    }
    return inscriptos.map(i => {
      const cand = this.getCandidatoById(i.id_candidato) || { nombre: 'Dr. Javier Torres', pais: 'Colombia' };
      return { ...i, candidato: cand };
    });
  },

  updateInscripcion(id, data) {
    const db = this.get();
    if (!db.inscripciones) db.inscripciones = [];
    const idx = db.inscripciones.findIndex(i => i.id === id);
    if (idx !== -1) db.inscripciones[idx] = { ...db.inscripciones[idx], ...data };
    else db.inscripciones.push({ id, ...data });
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
  getMateriales(id_grupo) {
    const list = (this.get().materiales || []).filter(m => m.id_grupo === id_grupo);
    if (list.length > 0) return list;
    return [
      { id: 'm-001', id_grupo, titulo: 'Guía Fachsprachenprüfung (FSP) Casos Clínicos', tipo: 'Terminología Médica', fecha: '2026-09-18', url: '#' },
      { id: 'm-002', id_grupo, titulo: 'Simulación Anamnesis Médico-Paciente (Audio + Guión)', tipo: 'Audio', fecha: '2026-09-22', url: '#' },
      { id: 'm-003', id_grupo, titulo: 'Ejercicios Gramática Aplicada al Ámbito Hospitalario', tipo: 'Ejercicio', fecha: '2026-09-25', url: '#' }
    ];
  },

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

  addNota(arg1, arg2) {
    const db = this.get();
    let data = {};
    if (typeof arg1 === 'string' && typeof arg2 === 'object') {
      data = { ...arg2, id_candidato: arg1 };
    } else if (typeof arg1 === 'object') {
      data = { ...arg1 };
    }
    const nueva = {
      id: 'n-' + Date.now(),
      fecha: new Date().toISOString().split('T')[0],
      fecha_hora: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
      ...data
    };
    if (!db.notas) db.notas = [];
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
