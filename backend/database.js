/**
 * JN PALABRAS - DATABASE SERVICE (PostgreSQL + In-Memory Fallback)
 * Gestiona la persistencia relacional en PostgreSQL y fallback local para desarrollo.
 */

const { isPostgresConfigured, query } = require('./db/pool');
const fs = require('fs');
const path = require('path');

let memoryDB = null;
const dbFilePath = path.join(__dirname, 'db', 'data.json');

const INITIAL_DATA = {
  "usuarios": [
    {
      "id": "u-admin-001",
      "nombre": "Ana García",
      "roles": ["Admin"],
      "correo": "admin@jnpalabras.com",
      "contrasena": "JNPalabrasAdmin2026!",
      "avatar": "AG",
      "activo": true,
      "fecha_creacion": "2024-01-15",
      "ultimo_acceso": "2026-09-16T20:53:40.885Z"
    },
    {
      "id": "u-asesor-001",
      "nombre": "Carlos Martínez",
      "roles": ["Asesor"],
      "correo": "asesor@jnpalabras.com",
      "contrasena": "JNPalabrasAsesor2026!",
      "avatar": "CM",
      "activo": true,
      "fecha_creacion": "2024-02-10"
    },
    {
      "id": "u-prof-001",
      "nombre": "Dra. Elena Weber",
      "roles": ["Profesor"],
      "correo": "profesor@jnpalabras.com",
      "contrasena": "JNPalabrasProfesor2026!",
      "avatar": "EW",
      "activo": true,
      "fecha_creacion": "2024-02-20"
    },
    {
      "id": "u-cand-001",
      "nombre": "Dr. Javier Torres",
      "roles": ["Candidato"],
      "correo": "candidato@jnpalabras.com",
      "contrasena": "JNPalabrasCandidato2026!",
      "avatar": "JT",
      "activo": true,
      "fecha_creacion": "2024-03-05"
    },
    {
      "id": "u-emp-001",
      "nombre": "Klinikum Stuttgart",
      "roles": ["Empresa"],
      "correo": "empresa@jnpalabras.com",
      "contrasena": "JNPalabrasEmpresa2026!",
      "avatar": "KS",
      "activo": true,
      "fecha_creacion": "2024-01-20"
    },
    {
      "id": "u-socio-001",
      "nombre": "Laura Rodríguez (MediLink)",
      "roles": ["Socio"],
      "correo": "socio@jnpalabras.com",
      "contrasena": "JNPalabrasSocio2026!",
      "avatar": "LR",
      "activo": true,
      "fecha_creacion": "2024-03-01"
    }
  ],
  "candidatos": [],
  "kanban_columns": [
    {
      "id": "Lead Nuevo",
      "label": "Lead Nuevo",
      "color": "#64748b",
      "icon": "🆕"
    },
    {
      "id": "Idioma",
      "label": "Idioma",
      "color": "#3b82f6",
      "icon": "🗣️"
    },
    {
      "id": "Homologación",
      "label": "Homologación",
      "color": "#8b5cf6",
      "icon": "📋"
    },
    {
      "id": "Postulación",
      "label": "Postulación",
      "color": "#f59e0b",
      "icon": "📤"
    },
    {
      "id": "Entrevista Agendada",
      "label": "Entrevista",
      "color": "#ec4899",
      "icon": "📅"
    },
    {
      "id": "Trámite Visado",
      "label": "Trámite Visado",
      "color": "#06b6d4",
      "icon": "🛂"
    },
    {
      "id": "Colocado",
      "label": "Colocado 🎉",
      "color": "#10b981",
      "icon": "✅"
    }
  ],
  "documentos": [],
  "doc_categorias": [
    {
      "cat": "Pasaporte",
      "icono": "🛂",
      "requerido": true
    },
    {
      "cat": "Título Universitario",
      "icono": "🎓",
      "requerido": true
    },
    {
      "cat": "Notas Académicas",
      "icono": "📊",
      "requerido": true
    },
    {
      "cat": "Certificado de Idioma",
      "icono": "🗣️",
      "requerido": true
    },
    {
      "cat": "Antecedentes Penales",
      "icono": "📋",
      "requerido": true
    },
    {
      "cat": "Certificado Nacimiento",
      "icono": "📜",
      "requerido": true
    },
    {
      "cat": "Foto Carnet",
      "icono": "📷",
      "requerido": false
    },
    {
      "cat": "Especialidad",
      "icono": "🏥",
      "requerido": false
    }
  ],
  "empresas": [],
  "vacantes": [],
  "grupos": [],
  "inscripciones": [],
  "calificaciones": [],
  "materiales": [],
  "matchings": [],
  "entrevistas": [],
  "socios": [],
  "comisiones": [],
  "notas": [],
  "notificaciones": [],
  "kpis": {
    "totalCandidatos": 0,
    "colocados": 0,
    "vacantesActivas": 0,
    "ingresosEstimados": 0,
    "tasaExito": 0
  },
  "session": null
};

// ── API DEL MOCK DB ──────────────────────────────────────────────
const DB = {
  // Inicializar o cargar desde localStorage
  init() {
    if (!memoryDB) {
      try {
        if (fs.existsSync(dbFilePath)) {
          memoryDB = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
        } else {
          memoryDB = JSON.parse(JSON.stringify(INITIAL_DATA));
          fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
          fs.writeFileSync(dbFilePath, JSON.stringify(memoryDB, null, 2));
        }
      } catch (err) {
        memoryDB = JSON.parse(JSON.stringify(INITIAL_DATA));
      }
    }
  },

  // Leer todo
  get() {
    this.init();
    return memoryDB;
  },

  async getAsync() {
    if (isPostgresConfigured()) {
      try {
        const usersRes = await query('SELECT id, nombre, correo, roles, avatar_url AS avatar, activo, fecha_creacion FROM usuarios;');
        const candRes = await query('SELECT * FROM candidatos;');
        const empRes = await query('SELECT * FROM empresas;');
        const vacRes = await query('SELECT * FROM vacantes;');
        
        const db = this.get();
        return {
          ...db,
          usuarios: usersRes.rows.length ? usersRes.rows : db.usuarios,
          candidatos: candRes.rows.length ? candRes.rows : db.candidatos,
          empresas: empRes.rows.length ? empRes.rows : db.empresas,
          vacantes: vacRes.rows.length ? vacRes.rows : db.vacantes
        };
      } catch (err) {
        console.warn('⚠️ Fallback a in-memory por error consultando PostgreSQL:', err.message);
        return this.get();
      }
    }
    return this.get();
  },

  // Guardar todo
  save(data) {
    memoryDB = data;
    try {
      fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
      fs.writeFileSync(dbFilePath, JSON.stringify(memoryDB, null, 2));
    } catch (err) {}
  },

  async saveAsync(data) {
    this.save(data);
  },

  // Reset a datos iniciales
  reset() {
    memoryDB = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save(memoryDB);
  },

  async resetAsync() {
    this.reset();
  },

  // ── USUARIOS ──────────────────────────────────────────────────
  async getAllUsuariosAsync() {
    if (isPostgresConfigured()) {
      try {
        const res = await query(`
          SELECT 
            u.id, u.nombre, u.correo, u.roles, u.avatar_url AS avatar, u.activo, u.fecha_creacion,
            (SELECT row_to_json(e) FROM empresas e WHERE e.id_usuario = u.id LIMIT 1) as empresa_data,
            (SELECT row_to_json(s) FROM socios s WHERE s.id_usuario = u.id LIMIT 1) as socio_data
          FROM usuarios u 
          ORDER BY u.fecha_creacion DESC;
        `);
        return res.rows;
      } catch (err) {
        console.warn('⚠️ Query error en PostgreSQL getAllUsuariosAsync, usando fallback in-memory:', err.message);
      }
    }
    return this.get().usuarios || [];
  },

  getUsuarios() { return this.get().usuarios; },

  async findUsuario(correo, contrasena) {
    if (isPostgresConfigured()) {
      try {
        const res = await query(`
          SELECT id, nombre, correo, roles, avatar_url AS avatar, activo 
          FROM usuarios 
          WHERE correo = $1 
            AND (contrasena_hash = crypt($2, contrasena_hash) OR contrasena_hash = $2)
          LIMIT 1;
        `, [correo, contrasena]);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
        return null;
      } catch (err) {
        console.warn('⚠️ Query error en PostgreSQL findUsuario, usando fallback in-memory:', err.message);
      }
    }
    return this.getUsuarios().find(u => u.correo === correo && u.contrasena === contrasena);
  },

  async findUsuarioById(id) {
    if (isPostgresConfigured()) {
      try {
        const res = await query('SELECT id, nombre, correo, roles, avatar_url AS avatar, activo FROM usuarios WHERE id = $1 LIMIT 1;', [id]);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err) {
        console.warn('⚠️ Query error en PostgreSQL findUsuarioById, usando fallback in-memory:', err.message);
      }
    }
    return this.getUsuarios().find(u => u.id === id);
  },

  async createUsuarioAsync(data) {
    const fallbackId = 'u-' + Date.now();
    if (isPostgresConfigured()) {
      try {
        const res = await query(`
          INSERT INTO usuarios (nombre, correo, contrasena_hash, roles, avatar_url, activo)
          VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, $5, true)
          RETURNING id, nombre, correo, roles, avatar_url AS avatar, activo, fecha_creacion;
        `, [data.nombre, data.correo, data.contrasena, JSON.stringify(data.roles || ['Candidato']), data.avatar]);
        
        const newUser = res.rows[0];
        
        if (data.empresa_data) {
          await query(`
            INSERT INTO empresas (id_usuario, nombre_clinica, tipo_centro, region_alemania, ciudad, telefono, contacto_nombre, correo_contacto)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            newUser.id, 
            data.empresa_data.nombre_clinica || 'Sin Nombre', 
            data.empresa_data.tipo_centro || null,
            data.empresa_data.region_alemania || null,
            data.empresa_data.ciudad || null,
            data.empresa_data.telefono || null,
            data.empresa_data.contacto_nombre || null,
            data.empresa_data.correo_contacto || null
          ]);
        }
        
        if (data.socio_data) {
          await query(`
            INSERT INTO socios (id_usuario, nombre_agencia, pais_operacion, telefono, porcentaje_comision, contacto_nombre, correo_contacto)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            newUser.id,
            data.socio_data.nombre_agencia || 'Sin Nombre',
            data.socio_data.pais_operacion || null,
            data.socio_data.telefono || null,
            data.socio_data.porcentaje_comision || 10,
            data.socio_data.contacto_nombre || null,
            data.socio_data.correo_contacto || null
          ]);
        }
        
        return newUser;
      } catch (err) {
        console.error('⚠️ Error insertando en PostgreSQL createUsuarioAsync:', err.message);
        throw err;
      }
    }
    // Fallback in-memory
    const db = this.get();
    const nuevo = { ...data, id: fallbackId, fecha_creacion: new Date().toISOString(), activo: true };
    db.usuarios.push(nuevo);
    this.save(db);
    return nuevo;
  },

  createUsuario(data) {
    const db = this.get();
    const nuevo = { ...data, id: 'u-' + Date.now(), fecha_creacion: new Date().toISOString(), activo: true };
    db.usuarios.push(nuevo);
    this.save(db);
    return nuevo;
  },

  async updateUsuarioAsync(id, data) {
    if (isPostgresConfigured()) {
      try {
        const res = await query(`
          UPDATE usuarios 
          SET nombre = COALESCE($1, nombre),
              correo = COALESCE($2, correo),
              roles = COALESCE($3, roles),
              avatar_url = COALESCE($4, avatar_url),
              activo = COALESCE($5, activo),
              fecha_actualizacion = NOW()
          WHERE id = $6
          RETURNING id, nombre, correo, roles, avatar_url AS avatar, activo, fecha_creacion;
        `, [data.nombre, data.correo, JSON.stringify(data.roles), data.avatar, data.activo, id]);
        
        const updatedUser = res.rows[0];
        
        if (data.empresa_data) {
          const empRes = await query('SELECT id FROM empresas WHERE id_usuario = $1 LIMIT 1', [id]);
          if (empRes.rows.length > 0) {
            await query(`
              UPDATE empresas 
              SET nombre_clinica = $1, tipo_centro = $2, region_alemania = $3, ciudad = $4, telefono = $5
              WHERE id_usuario = $6
            `, [
              data.empresa_data.nombre_clinica || 'Sin Nombre',
              data.empresa_data.tipo_centro || null,
              data.empresa_data.region_alemania || null,
              data.empresa_data.ciudad || null,
              data.empresa_data.telefono || null,
              id
            ]);
          } else {
            await query(`
              INSERT INTO empresas (id_usuario, nombre_clinica, tipo_centro, region_alemania, ciudad, telefono, contacto_nombre, correo_contacto)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              id,
              data.empresa_data.nombre_clinica || 'Sin Nombre',
              data.empresa_data.tipo_centro || null,
              data.empresa_data.region_alemania || null,
              data.empresa_data.ciudad || null,
              data.empresa_data.telefono || null,
              data.empresa_data.contacto_nombre || null,
              data.empresa_data.correo_contacto || null
            ]);
          }
        }
        
        if (data.socio_data) {
          const socRes = await query('SELECT id FROM socios WHERE id_usuario = $1 LIMIT 1', [id]);
          if (socRes.rows.length > 0) {
            await query(`
              UPDATE socios
              SET nombre_agencia = $1, pais_operacion = $2, telefono = $3, porcentaje_comision = $4
              WHERE id_usuario = $5
            `, [
              data.socio_data.nombre_agencia || 'Sin Nombre',
              data.socio_data.pais_operacion || null,
              data.socio_data.telefono || null,
              data.socio_data.porcentaje_comision || 10,
              id
            ]);
          } else {
            await query(`
              INSERT INTO socios (id_usuario, nombre_agencia, pais_operacion, telefono, porcentaje_comision, contacto_nombre, correo_contacto)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              id,
              data.socio_data.nombre_agencia || 'Sin Nombre',
              data.socio_data.pais_operacion || null,
              data.socio_data.telefono || null,
              data.socio_data.porcentaje_comision || 10,
              data.socio_data.contacto_nombre || null,
              data.socio_data.correo_contacto || null
            ]);
          }
        }
        
        return updatedUser;
      } catch (err) {
        console.error('⚠️ Error actualizando en PostgreSQL updateUsuarioAsync:', err.message);
        throw err;
      }
    }
    // Fallback in-memory
    const db = this.get();
    const idx = db.usuarios.findIndex(u => u.id === id);
    if (idx !== -1) {
      db.usuarios[idx] = { ...db.usuarios[idx], ...data };
      this.save(db);
      return db.usuarios[idx];
    }
    return null;
  },

  updateUsuario(id, data) {
    const db = this.get();
    const idx = db.usuarios.findIndex(u => u.id === id);
    if (idx !== -1) db.usuarios[idx] = { ...db.usuarios[idx], ...data };
    this.save(db);
  },

  async deleteUsuarioAsync(id) {
    if (isPostgresConfigured()) {
      try {
        await query('DELETE FROM usuarios WHERE id = $1;', [id]);
        return true;
      } catch (err) {
        console.error('⚠️ Error borrando en PostgreSQL deleteUsuarioAsync:', err.message);
        throw err;
      }
    }
    // Fallback in-memory
    const db = this.get();
    db.usuarios = db.usuarios.filter(u => u.id !== id);
    this.save(db);
    return true;
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
  async getCandidatosAsync() {
    if (isPostgresConfigured()) {
      try {
        const res = await query(`
          SELECT 
            id, id_usuario, nombre_completo AS nombre, pais_origen AS pais, 
            especialidad_medica AS especialidad, nivel_aleman_actual AS nivel_aleman,
            estado_proceso, estado_homologacion, id_socio_referidor AS id_socio,
            foto_url AS foto, anos_experiencia AS anos_exp,
            consentimiento_gdpr, fecha_creacion AS fecha_alta
          FROM candidatos 
          ORDER BY fecha_creacion DESC;
        `);
        return res.rows;
      } catch (err) {
        console.warn('⚠️ Query error en PostgreSQL getCandidatosAsync, usando fallback in-memory:', err.message);
      }
    }
    return this.get().candidatos || [];
  },

  getCandidatos() { return this.get().candidatos; },

  async getCandidatoByIdAsync(id) {
    if (isPostgresConfigured()) {
      try {
        const res = await query('SELECT * FROM candidatos WHERE id = $1 LIMIT 1;', [id]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        console.warn('⚠️ Query error en PostgreSQL getCandidatoByIdAsync:', err.message);
      }
    }
    return this.getCandidatoById(id);
  },

  getCandidatoById(id) { return this.get().candidatos.find(c => c.id === id); },

  async getCandidatosByEstadoAsync(estado) {
    if (isPostgresConfigured()) {
      try {
        const res = await query('SELECT * FROM candidatos WHERE estado_proceso = $1;', [estado]);
        return res.rows;
      } catch (err) {
        console.warn('⚠️ Query error en PostgreSQL getCandidatosByEstadoAsync:', err.message);
      }
    }
    return this.getCandidatosByEstado(estado);
  },

  getCandidatosByEstado(estado) { return this.get().candidatos.filter(c => c.estado_proceso === estado); },

  async getCandidatosBySocioAsync(id_socio) {
    if (isPostgresConfigured()) {
      try {
        const res = await query('SELECT * FROM candidatos WHERE id_socio = $1;', [id_socio]);
        return res.rows;
      } catch (err) {
        console.warn('⚠️ Query error en PostgreSQL getCandidatosBySocioAsync:', err.message);
      }
    }
    return this.getCandidatosBySocio(id_socio);
  },

  getCandidatosBySocio(id_socio) { return this.get().candidatos.filter(c => c.id_socio === id_socio); },

  async updateCandidatoAsync(id, data) {
    if (isPostgresConfigured()) {
      try {
        const res = await query(`
          UPDATE candidatos 
          SET nombre_completo = COALESCE($1, nombre_completo),
              correo = COALESCE($2, correo),
              telefono = COALESCE($3, telefono),
              pais_origen = COALESCE($4, pais_origen),
              especialidad_medica = COALESCE($5, especialidad_medica),
              nivel_aleman_actual = COALESCE($6, nivel_aleman_actual),
              estado_proceso = COALESCE($7, estado_proceso),
              id_asesor = COALESCE($8, id_asesor),
              id_socio_referidor = COALESCE($9, id_socio_referidor),
              notas_internas = COALESCE($10, notas_internas),
              foto_url = COALESCE($11, foto_url),
              edad = COALESCE($12, edad),
              puntaje_elegibilidad = COALESCE($13, puntaje_elegibilidad),
              respuestas_elegibilidad = COALESCE($14, respuestas_elegibilidad)
          WHERE id = $15
          RETURNING *;
        `, [
          data.nombre, data.correo, data.telefono, data.pais, 
          data.especialidad, data.nivel_aleman, data.estado_proceso, 
          data.id_asesor, data.id_socio, data.comentarios_asesor || data.notas_internas, 
          data.foto, data.edad, data.puntaje_elegibilidad, 
          data.respuestas_elegibilidad ? JSON.stringify(data.respuestas_elegibilidad) : null, id
        ]);
        return res.rows[0];
      } catch (err) {
        console.error('⚠️ Error actualizando en PostgreSQL updateCandidatoAsync:', err.message);
        throw err;
      }
    }
    // Fallback in-memory
    this.updateCandidato(id, data);
    return this.getCandidatoById(id);
  },

  updateCandidato(id, data) {
    const db = this.get();
    const idx = db.candidatos.findIndex(c => c.id === id);
    if (idx !== -1) db.candidatos[idx] = { ...db.candidatos[idx], ...data };
    this.save(db);
  },

  getCV(id_candidato) {
    const cand = this.getCandidatoById(id_candidato);
    if (!cand) return null;
    if (cand.cv_data) return cand.cv_data;

    // Fallback estructura inicial
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

      // Asegurar documento en la bóveda
      const existingDocIdx = db.documentos.findIndex(doc => doc.id_candidato === id_candidato && doc.categoria === 'Curriculum Vitae');
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

  async createCandidatoAsync(data) {
    if (isPostgresConfigured()) {
      try {
        const res = await query(`
          INSERT INTO candidatos (
            id_usuario, nombre_completo, correo, telefono, pais_origen, 
            especialidad_medica, nivel_aleman_actual, estado_proceso,
            edad, puntaje_elegibilidad, respuestas_elegibilidad,
            notas_internas, id_asesor, id_socio_referidor
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *;
        `, [
          data.id_usuario || null, data.nombre, data.correo || null, data.telefono || null, data.pais,
          data.especialidad, data.nivel_aleman, data.estado_proceso || 'Lead_Nuevo',
          data.edad ? parseInt(data.edad, 10) : null, data.puntaje_elegibilidad || null, data.respuestas_elegibilidad ? JSON.stringify(data.respuestas_elegibilidad) : null,
          data.notas_internas || null, data.id_asesor || null, data.id_socio || null
        ]);
        
        // Actualizar KPIs si es posible (en PostgreSQL sería una consulta aparte o se calcula)
        
        // Notificación al asesor
        this.addNotificacion({
          id_usuario_dest: data.id_asesor || 'u-asesor-001',
          tipo: 'Nuevo_Candidato',
          titulo: 'Nuevo candidato registrado',
          mensaje: `${data.nombre} (${data.pais}, ${data.especialidad}) se ha registrado como nuevo lead.`
        });
        
        return res.rows[0];
      } catch (err) {
        console.error('⚠️ Error insertando en PostgreSQL createCandidatoAsync:', err.message);
        throw err;
      }
    }
    return this.createCandidato(data);
  },

  createCandidato(data) {
    const db = this.get();
    const nuevo = { ...data, id: 'c-' + Date.now(), fecha_alta: new Date().toISOString().split('T')[0], consentimiento_gdpr: true };
    db.candidatos.push(nuevo);
    db.kpis.totalCandidatos = (db.kpis.totalCandidatos || 0) + 1;
    // db.kpis.candidatos_activos doesn't exist in data.json, ignoring
    // db.kpis.nuevos_este_mes doesn't exist either
    this.save(db);
    // Notificación al asesor
    this.addNotificacion({
      id_usuario_dest: 'u-asesor-001',
      tipo: 'Nuevo_Candidato',
      titulo: 'Nuevo candidato registrado',
      mensaje: `${data.nombre} (${data.pais}, ${data.especialidad}) se ha registrado como nuevo lead.`
    });
    return nuevo;
  },
  
  async deleteCandidatoAsync(id) {
    if (isPostgresConfigured()) {
      try {
        await query('DELETE FROM candidatos WHERE id = $1;', [id]);
        return true;
      } catch (err) {
        console.error('⚠️ Error borrando en PostgreSQL deleteCandidatoAsync:', err.message);
        throw err;
      }
    }
    const db = this.get();
    db.candidatos = db.candidatos.filter(c => c.id !== id);
    this.save(db);
    return true;
  },

  // ── DOCUMENTOS ────────────────────────────────────────────────
  getDocumentos(id_candidato) {
    return this.get().documentos.filter(d => d.id_candidato === id_candidato);
  },

  updateDocumento(id, data) {
    const db = this.get();
    const idx = db.documentos.findIndex(d => d.id === id);
    if (idx !== -1) {
      db.documentos[idx] = { ...db.documentos[idx], ...data };
      // Notificación al candidato
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
    // Notificación al asesor
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
  getVacantes() { return this.get().vacantes; },

  getVacantesByEmpresa(id_empresa) { return this.get().vacantes.filter(v => v.id_empresa === id_empresa); },

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
    return this.get().notificaciones
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
  getGrupos() { return this.get().grupos; },

  getGruposByProfesor(id_prof) { return this.get().grupos.filter(g => g.id_profesor === id_prof); },

  getInscripcionesByGrupo(id_grupo) {
    const db = this.get();
    return db.inscripciones
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
  getMateriales(id_grupo) { return this.get().materiales.filter(m => m.id_grupo === id_grupo); },

  addMaterial(data) {
    const db = this.get();
    const nuevo = { ...data, id: 'm-' + Date.now(), fecha: new Date().toISOString().split('T')[0] };
    db.materiales.push(nuevo);
    this.save(db);
    return nuevo;
  },

  // ── MATCHINGS ─────────────────────────────────────────────────
  getMatchings() { return this.get().matchings; },

  crearMatching(id_candidato, id_vacante) {
    const db = this.get();
    const cand = db.candidatos.find(c => c.id === id_candidato);
    const vac = db.vacantes.find(v => v.id === id_vacante);
    // Score simple basado en nivel de alemán y especialidad
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
  getSocios() { return this.get().socios; },
  getSocioByUsuario(id_usuario) { return this.get().socios.find(s => s.id_usuario === id_usuario); },
  getComisionesBySocio(id_socio) { return this.get().comisiones.filter(c => c.id_socio === id_socio); },

  // ── NOTAS ─────────────────────────────────────────────────────
  getNotas(id_candidato) { return this.get().notas.filter(n => n.id_candidato === id_candidato).sort((a,b) => new Date(b.fecha)-new Date(a.fecha)); },

  addNota(data) {
    const db = this.get();
    const nueva = { ...data, id: 'n-' + Date.now(), fecha: new Date().toISOString().split('T')[0] };
    db.notas.push(nueva);
    this.save(db);
    return nueva;
  },

  // ── ENTREVISTAS ───────────────────────────────────────────────
  getEntrevistas() { return this.get().entrevistas; },

  addEntrevista(data) {
    const db = this.get();
    const nueva = { ...data, id: 'ent-' + Date.now() };
    db.entrevistas.push(nueva);
    // Notificaciones cruzadas
    this.addNotificacion({ id_usuario_dest: 'u-cand-001', tipo: 'Entrevista_Agendada', titulo: 'Entrevista agendada', mensaje: `Tienes una entrevista agendada con ${data.empresa} para el ${new Date(data.fecha_propuesta).toLocaleDateString('es-ES')}.` }, db);
    this.addNotificacion({ id_usuario_dest: 'u-emp-001', tipo: 'Entrevista_Agendada', titulo: 'Entrevista confirmada', mensaje: `Entrevista con candidato confirmada para el ${new Date(data.fecha_propuesta).toLocaleDateString('es-ES')}.` }, db);
    this.save(db);
    return nueva;
  },

  // ── KPIs ──────────────────────────────────────────────────────
  getKpis() { return this.get().kpis; }
};

module.exports = DB;
