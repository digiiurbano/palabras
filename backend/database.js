/**
 * JN PALABRAS - MOCK DATABASE (Backend In-Memory)
 * Simula la base de datos relacional para el MVP interactivo.
 */

let memoryDB = null;

const INITIAL_DATA = {
  // ── USUARIOS ──────────────────────────────────────────────────
  usuarios: [
    {
      id: 'u-admin-001', nombre: 'Ana García', rol: 'Admin',
      correo: 'admin@jnpalabras.com', contrasena: 'admin2025',
      avatar: 'AG', activo: true, fecha_creacion: '2024-01-15',
      ultimo_acceso: new Date().toISOString()
    },
    {
      id: 'u-asesor-001', nombre: 'Carlos Martínez', rol: 'Asesor',
      correo: 'asesor@jnpalabras.com', contrasena: 'asesor2025',
      avatar: 'CM', activo: true, fecha_creacion: '2024-02-10'
    },
    {
      id: 'u-prof-001', nombre: 'Dra. Elena Weber', rol: 'Profesor',
      correo: 'profesor@jnpalabras.com', contrasena: 'profesor2025',
      avatar: 'EW', activo: true, fecha_creacion: '2024-02-20'
    },
    {
      id: 'u-cand-001', nombre: 'Dr. Javier Torres', rol: 'Candidato',
      correo: 'candidato@jnpalabras.com', contrasena: 'candidato2025',
      avatar: 'JT', activo: true, fecha_creacion: '2024-03-05'
    },
    {
      id: 'u-emp-001', nombre: 'Tech Solutions GmbH', rol: 'Empresa',
      correo: 'empresa@techsolutions.de', contrasena: 'empresa2025',
      avatar: 'KS', activo: true, fecha_creacion: '2024-01-20'
    },
    {
      id: 'u-socio-001', nombre: 'Laura Rodríguez (MediLink)', rol: 'Socio',
      correo: 'socio@medilink.co', contrasena: 'socio2025',
      avatar: 'LR', activo: true, fecha_creacion: '2024-03-01'
    }
  ],

  // ── CANDIDATOS ────────────────────────────────────────────────
  candidatos: [
    {
      id: 'c-001', id_usuario: 'u-cand-001',
      nombre: 'Dr. Javier Torres', pais: 'Colombia',
      especialidad: 'Medicina General', nivel_aleman: 'B2',
      estado_proceso: 'Idioma', estado_homologacion: 'En Trámite',
      anos_exp: 5, id_socio: 'u-socio-001',
      consentimiento_gdpr: true, video_url: null,
      foto: 'JT', fecha_alta: '2024-03-05'
    },
    {
      id: 'c-002', id_usuario: null,
      nombre: 'Dra. María López', pais: 'México',
      especialidad: 'Cardiología', nivel_aleman: 'B1',
      estado_proceso: 'Homologación', estado_homologacion: 'Pendiente',
      anos_exp: 8, id_socio: null,
      consentimiento_gdpr: true, video_url: null,
      foto: 'ML', fecha_alta: '2024-03-12'
    },
    {
      id: 'c-003', id_usuario: null,
      nombre: 'Ing. Rosa Kim', pais: 'Filipinas',
      especialidad: 'Enfermería UCI', nivel_aleman: 'A2',
      estado_proceso: 'Idioma', estado_homologacion: 'En Trámite',
      anos_exp: 4, id_socio: 'u-socio-001',
      consentimiento_gdpr: true, video_url: null,
      foto: 'RK', fecha_alta: '2024-03-20'
    },
    {
      id: 'c-004', id_usuario: null,
      nombre: 'Dr. Ahmed Hassan', pais: 'Siria',
      especialidad: 'Pediatría', nivel_aleman: 'B2',
      estado_proceso: 'Postulación', estado_homologacion: 'Reconocimiento Parcial',
      anos_exp: 10, id_socio: null,
      consentimiento_gdpr: true, video_url: null,
      foto: 'AH', fecha_alta: '2024-02-28'
    },
    {
      id: 'c-005', id_usuario: null,
      nombre: 'Dra. Ana Souza', pais: 'Brasil',
      especialidad: 'Anestesiología', nivel_aleman: 'C1',
      estado_proceso: 'Entrevista Agendada', estado_homologacion: 'Aprobado',
      anos_exp: 12, id_socio: null,
      consentimiento_gdpr: true, video_url: null,
      foto: 'AS', fecha_alta: '2024-02-10'
    },
    {
      id: 'c-006', id_usuario: null,
      nombre: 'Dr. Carlos Vega', pais: 'Perú',
      especialidad: 'Neurología', nivel_aleman: 'B1',
      estado_proceso: 'Lead Nuevo', estado_homologacion: 'Pendiente',
      anos_exp: 6, id_socio: 'u-socio-001',
      consentimiento_gdpr: true, video_url: null,
      foto: 'CV', fecha_alta: '2024-04-01'
    },
    {
      id: 'c-007', id_usuario: null,
      nombre: 'Dra. Sofia Petrov', pais: 'Ucrania',
      especialidad: 'Medicina General', nivel_aleman: 'B2',
      estado_proceso: 'Trámite Visado', estado_homologacion: 'Aprobado',
      anos_exp: 7, id_socio: null,
      consentimiento_gdpr: true, video_url: null,
      foto: 'SP', fecha_alta: '2024-01-18'
    },
    {
      id: 'c-008', id_usuario: null,
      nombre: 'Dr. Miguel Ramírez', pais: 'Argentina',
      especialidad: 'Cirugía General', nivel_aleman: 'C1',
      estado_proceso: 'Colocado', estado_homologacion: 'Aprobado',
      anos_exp: 15, id_socio: null,
      consentimiento_gdpr: true, video_url: null,
      foto: 'MR', fecha_alta: '2023-11-05'
    }
  ],

  // ── ESTADOS KANBAN (orden del pipeline) ────────────────────
  kanban_columns: [
    { id: 'Lead Nuevo',           label: 'Lead Nuevo',           color: '#64748b', icon: '🆕' },
    { id: 'Idioma',               label: 'Idioma',               color: '#3b82f6', icon: '🗣️' },
    { id: 'Homologación',         label: 'Homologación',         color: '#8b5cf6', icon: '📋' },
    { id: 'Postulación',          label: 'Postulación',          color: '#f59e0b', icon: '📤' },
    { id: 'Entrevista Agendada',  label: 'Entrevista',           color: '#ec4899', icon: '📅' },
    { id: 'Trámite Visado',       label: 'Trámite Visado',       color: '#06b6d4', icon: '🛂' },
    { id: 'Colocado',             label: 'Colocado 🎉',          color: '#10b981', icon: '✅' }
  ],

  // ── DOCUMENTOS ────────────────────────────────────────────────
  documentos: [
    {
      id: 'd-001', id_candidato: 'c-001', nombre: 'Pasaporte_Torres.pdf',
      categoria: 'Pasaporte', estado: 'Aprobado',
      comentario: '', fecha: '2024-03-06', tamano: '2.3 MB'
    },
    {
      id: 'd-002', id_candidato: 'c-001', nombre: 'Titulo_Medicina_Torres.pdf',
      categoria: 'Título Universitario', estado: 'En Revisión',
      comentario: '', fecha: '2024-03-08', tamano: '4.1 MB'
    },
    {
      id: 'd-003', id_candidato: 'c-001', nombre: 'Cert_B2_Goethe.pdf',
      categoria: 'Certificado de Idioma', estado: 'Pendiente',
      comentario: '', fecha: '2024-03-10', tamano: '1.2 MB'
    },
    {
      id: 'd-004', id_candidato: 'c-001', nombre: 'Notas_Academicas.pdf',
      categoria: 'Notas Académicas', estado: 'Rechazado',
      comentario: 'El documento está en inglés. Por favor suba la versión apostillada en alemán o español con traducción oficial.',
      fecha: '2024-03-09', tamano: '3.5 MB'
    },
    {
      id: 'd-005', id_candidato: 'c-001', nombre: 'Antecedentes_Penales.pdf',
      categoria: 'Antecedentes Penales', estado: 'Pendiente',
      comentario: '', fecha: null, tamano: null
    }
  ],

  // ── CATEGORÍAS DE DOCUMENTOS REQUERIDOS ─────────────────────
  doc_categorias: [
    { cat: 'Pasaporte',             icono: '🛂', requerido: true  },
    { cat: 'Título Universitario',  icono: '🎓', requerido: true  },
    { cat: 'Notas Académicas',      icono: '📊', requerido: true  },
    { cat: 'Certificado de Idioma', icono: '🗣️', requerido: true  },
    { cat: 'Antecedentes Penales',  icono: '📋', requerido: true  },
    { cat: 'Certificado Nacimiento',icono: '📜', requerido: true  },
    { cat: 'Foto Carnet',           icono: '📷', requerido: false },
    { cat: 'Especialidad',          icono: '🏥', requerido: false }
  ],

  // ── EMPRESAS ──────────────────────────────────────────────────
  empresas: [
    {
      id: 'e-001', id_usuario: 'u-emp-001',
      nombre: 'Tech Solutions GmbH', tipo: 'Empresa de Tecnología',
      region: 'Baden-Württemberg', plazas: 5,
      contacto: 'Dr. Hans Müller', correo: 'rrhh@techsolutions.de',
      telefono: '+49 711 000 001', camas: 2200, activo: true
    },
    {
      id: 'e-002', id_usuario: null,
      nombre: 'Berlin Innovate', tipo: 'Empresa B2B',
      region: 'Berlin', plazas: 2,
      contacto: 'Frau Schmidt', correo: 'personal@charite.de',
      telefono: '+49 30 000 002', camas: 3500, activo: true
    },
    {
      id: 'e-003', id_usuario: null,
      nombre: 'Bavaria Automotive', tipo: 'Ingeniería',
      region: 'Bayern', plazas: 10,
      contacto: 'Hr. Fischer', correo: 'stellen@bavaria-auto.de',
      telefono: '+49 89 000 003', camas: 1800, activo: true
    }
  ],

  // ── VACANTES ──────────────────────────────────────────────────
  vacantes: [
    {
      id: 'v-001', id_empresa: 'e-001', empresa: 'Tech Solutions GmbH',
      titulo: 'Desarrollador Backend', especialidad: 'Desarrollo de Software',
      nivel_aleman: 'B2', requiere_fsp: true,
      sueldo_min: 4500, sueldo_max: 5800, moneda: 'EUR',
      tipo_contrato: 'Indefinido', jornada: 'Completa',
      vacantes: 2, estado: 'Abierta',
      fecha: '2024-03-01'
    },
    {
      id: 'v-002', id_empresa: 'e-001', empresa: 'Tech Solutions GmbH',
      titulo: 'Ingeniero de Software Senior', especialidad: 'Desarrollo de Software',
      nivel_aleman: 'C1', requiere_fsp: true,
      sueldo_min: 6000, sueldo_max: 8500, moneda: 'EUR',
      tipo_contrato: 'Indefinido', jornada: 'Completa',
      vacantes: 1, estado: 'Abierta',
      fecha: '2024-02-15'
    },
    {
      id: 'v-003', id_empresa: 'e-001', empresa: 'Tech Solutions GmbH',
      titulo: 'Analista de Datos', especialidad: 'IT',
      nivel_aleman: 'B2', requiere_fsp: false,
      sueldo_min: 3200, sueldo_max: 4000, moneda: 'EUR',
      tipo_contrato: 'Indefinido', jornada: 'Guardia',
      vacantes: 3, estado: 'Abierta',
      fecha: '2024-03-10'
    },
    {
      id: 'v-004', id_empresa: 'e-002', empresa: 'Charité Berlin',
      titulo: 'Pediatra', especialidad: 'Pediatría',
      nivel_aleman: 'B2', requiere_fsp: true,
      sueldo_min: 5000, sueldo_max: 6500, moneda: 'EUR',
      tipo_contrato: 'Indefinido', jornada: 'Completa',
      vacantes: 2, estado: 'Abierta',
      fecha: '2024-03-18'
    },
    {
      id: 'v-005', id_empresa: 'e-003', empresa: 'Bavaria Automotive',
      titulo: 'Anestesiólogo Senior', especialidad: 'Anestesiología',
      nivel_aleman: 'C1', requiere_fsp: true,
      sueldo_min: 7000, sueldo_max: 9500, moneda: 'EUR',
      tipo_contrato: 'Indefinido', jornada: 'Completa',
      vacantes: 1, estado: 'Pausada',
      fecha: '2024-02-01'
    }
  ],

  // ── GRUPOS DE CLASE ───────────────────────────────────────────
  grupos: [
    {
      id: 'g-001', id_profesor: 'u-prof-001', profesor: 'Dra. Elena Weber',
      nombre: 'Grupo B2 Medicina – Jul 2025', nivel: 'B2',
      modalidad: 'Online', horario: 'Lun/Mié 18:00–20:00 CET',
      enlace: 'https://meet.google.com/jnp-b2-med', max_alumnos: 10,
      activos: 6, inicio: '2025-07-01', fin: '2025-12-31'
    },
    {
      id: 'g-002', id_profesor: 'u-prof-001', profesor: 'Dra. Elena Weber',
      nombre: 'Grupo A2 Enfermería – Jun 2025', nivel: 'A2',
      modalidad: 'Online', horario: 'Mar/Jue 17:00–19:00 CET',
      enlace: 'https://meet.google.com/jnp-a2-enf', max_alumnos: 12,
      activos: 4, inicio: '2025-06-01', fin: '2025-11-30'
    },
    {
      id: 'g-003', id_profesor: 'u-prof-001', profesor: 'Dra. Elena Weber',
      nombre: 'Grupo FSP Preparación – May 2025', nivel: 'FSP',
      modalidad: 'Online', horario: 'Vie 15:00–18:00 CET',
      enlace: 'https://meet.google.com/jnp-fsp-prep', max_alumnos: 8,
      activos: 5, inicio: '2025-05-01', fin: '2025-07-31'
    }
  ],

  // ── ALUMNOS POR GRUPO ─────────────────────────────────────────
  inscripciones: [
    { id: 'i-001', id_grupo: 'g-001', id_candidato: 'c-001', nota_ultima: 7.8, asistencia: 92, en_riesgo: false },
    { id: 'i-002', id_grupo: 'g-001', id_candidato: 'c-004', nota_ultima: 8.5, asistencia: 88, en_riesgo: false },
    { id: 'i-003', id_grupo: 'g-001', id_candidato: 'c-007', nota_ultima: 5.2, asistencia: 60, en_riesgo: true  },
    { id: 'i-004', id_grupo: 'g-002', id_candidato: 'c-003', nota_ultima: 7.0, asistencia: 95, en_riesgo: false },
    { id: 'i-005', id_grupo: 'g-003', id_candidato: 'c-005', nota_ultima: 9.1, asistencia: 100, en_riesgo: false },
    { id: 'i-006', id_grupo: 'g-003', id_candidato: 'c-002', nota_ultima: 6.5, asistencia: 75, en_riesgo: true  }
  ],

  // ── CALIFICACIONES ────────────────────────────────────────────
  calificaciones: [
    { id: 'cal-001', id_inscripcion: 'i-001', tipo: 'Examen Simulacro', nivel: 'B2', fecha: '2025-06-15', nota: 7.8, max: 10, aprobado: true },
    { id: 'cal-002', id_inscripcion: 'i-002', tipo: 'Examen Simulacro', nivel: 'B2', fecha: '2025-06-15', nota: 8.5, max: 10, aprobado: true },
    { id: 'cal-003', id_inscripcion: 'i-003', tipo: 'Examen Simulacro', nivel: 'B2', fecha: '2025-06-15', nota: 5.2, max: 10, aprobado: false, en_riesgo: true },
    { id: 'cal-004', id_inscripcion: 'i-005', tipo: 'FSP', nivel: 'FSP', fecha: '2025-07-01', nota: 9.1, max: 10, aprobado: true }
  ],

  // ── MATERIALES ────────────────────────────────────────────────
  materiales: [
    { id: 'm-001', id_grupo: 'g-001', titulo: 'Vocabulario Técnico B2', tipo: 'PDF', fecha: '2025-06-10', url: '#' },
    { id: 'm-002', id_grupo: 'g-001', titulo: 'Simulacro Entrevista', tipo: 'Video', fecha: '2025-06-15', url: '#' },
    { id: 'm-003', id_grupo: 'g-001', titulo: 'Guía Cultural: Cultura Corporativa Alemana', tipo: 'Guía Cultural', fecha: '2025-06-20', url: '#' },
    { id: 'm-004', id_grupo: 'g-003', titulo: 'Simulacro FSP Completo', tipo: 'PDF', fecha: '2025-06-25', url: '#' }
  ],

  // ── MATCHINGS ─────────────────────────────────────────────────
  matchings: [
    { id: 'match-001', id_candidato: 'c-005', id_vacante: 'v-005', puntuacion: 94, estado: 'Entrevista Solicitada', fecha: '2024-03-22' },
    { id: 'match-002', id_candidato: 'c-004', id_vacante: 'v-004', puntuacion: 88, estado: 'Sugerido', fecha: '2024-03-20' },
    { id: 'match-003', id_candidato: 'c-008', id_vacante: 'v-001', puntuacion: 79, estado: 'Contratado', fecha: '2024-01-15' }
  ],

  // ── ENTREVISTAS ───────────────────────────────────────────────
  entrevistas: [
    {
      id: 'ent-001', id_matching: 'match-001',
      fecha_propuesta: '2025-07-28T10:00:00',
      fecha_confirmada: '2025-07-28T10:00:00',
      enlace: 'https://meet.google.com/jnp-entrevista-001',
      estado: 'Confirmada',
      empresa: 'Bavaria Automotive',
      candidato: 'Dra. Ana Souza',
      vacante: 'Anestesiólogo Senior'
    }
  ],

  // ── SOCIOS ────────────────────────────────────────────────────
  socios: [
    {
      id: 's-001', id_usuario: 'u-socio-001',
      nombre: 'MediLink Colombia', pais: 'Colombia',
      contacto: 'Laura Rodríguez', porcentaje: 12.5,
      tipo_acuerdo: 'No Exclusivo', activo: true,
      referidos_total: 3, colocados: 1,
      comisiones_acumuladas: 7500, comisiones_cobradas: 2500,
      comisiones_pendientes: 5000
    }
  ],

  // ── COMISIONES ────────────────────────────────────────────────
  comisiones: [
    {
      id: 'com-001', id_socio: 's-001', id_candidato: 'c-008',
      candidato: 'Dr. Miguel Ramírez', empresa: 'Tech Solutions GmbH',
      monto: 2500, moneda: 'EUR', estado: 'Pagada',
      fecha_devengamiento: '2024-01-20', fecha_pago: '2024-02-15'
    },
    {
      id: 'com-002', id_socio: 's-001', id_candidato: 'c-003',
      candidato: 'Ing. Rosa Kim', empresa: '—',
      monto: 2500, moneda: 'EUR', estado: 'Devengada',
      fecha_devengamiento: '2024-04-10', fecha_pago: null
    },
    {
      id: 'com-003', id_socio: 's-001', id_candidato: 'c-006',
      candidato: 'Dr. Carlos Vega', empresa: '—',
      monto: 2500, moneda: 'EUR', estado: 'Devengada',
      fecha_devengamiento: '2024-04-05', fecha_pago: null
    }
  ],

  // ── NOTAS DE SEGUIMIENTO ──────────────────────────────────────
  notas: [
    {
      id: 'n-001', id_candidato: 'c-001', asesor: 'Carlos Martínez',
      tipo: 'Llamada', contenido: 'Llamada de bienvenida. Candidato muy motivado. Comenzará curso B2 el 1 de julio.',
      fecha: '2024-03-06'
    },
    {
      id: 'n-002', id_candidato: 'c-001', asesor: 'Carlos Martínez',
      tipo: 'Nota Interna', contenido: 'Título pendiente de apostilla. Recordar al candidato en próxima sesión.',
      fecha: '2024-03-09'
    }
  ],

  // ── NOTIFICACIONES ────────────────────────────────────────────
  notificaciones: [
    {
      id: 'notif-001', id_usuario_dest: 'u-cand-001',
      tipo: 'Documento_Rechazado', titulo: 'Documento rechazado',
      mensaje: 'Tus Notas Académicas requieren corrección. Por favor revisa los comentarios de tu asesor.',
      leida: false, fecha: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 'notif-002', id_usuario_dest: 'u-asesor-001',
      tipo: 'Nuevo_Candidato', titulo: 'Nuevo candidato registrado',
      mensaje: 'Dr. Carlos Vega (Perú, Neurología) se ha registrado a través del test de elegibilidad.',
      leida: false, fecha: new Date(Date.now() - 5 * 3600000).toISOString()
    },
    {
      id: 'notif-003', id_usuario_dest: 'u-emp-001',
      tipo: 'Entrevista_Agendada', titulo: 'Entrevista confirmada',
      mensaje: 'Entrevista con Dra. Ana Souza (Anestesiología) confirmada para el 28 de julio a las 10:00 CET.',
      leida: false, fecha: new Date(Date.now() - 1 * 3600000).toISOString()
    },
    {
      id: 'notif-004', id_usuario_dest: 'u-admin-001',
      tipo: 'Comision_Registrada', titulo: 'Nueva comisión devengada',
      mensaje: 'MediLink Colombia ha generado una nueva comisión por candidato referido.',
      leida: true, fecha: new Date(Date.now() - 24 * 3600000).toISOString()
    }
  ],

  // ── KPIs (para el Admin) ──────────────────────────────────────
  kpis: {
    total_candidatos: 8,
    candidatos_activos: 7,
    colocados: 1,
    tasa_colocacion: 12.5,
    vacantes_activas: 4,
    empresas_clientes: 3,
    ingresos_proyectados: 42000,
    ingresos_cobrados: 2500,
    comisiones_pagadas: 2500,
    nuevos_este_mes: 3
  },

  // ── SESIÓN ACTIVA ─────────────────────────────────────────────
  session: null
};

// ── API DEL MOCK DB ──────────────────────────────────────────────
const DB = {
  // Inicializar o cargar desde localStorage
  init() {
    if (!memoryDB) {
      memoryDB = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  },

  // Leer todo
  get() {
    if (!memoryDB) {
      memoryDB = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    return memoryDB;
  },

  // Guardar todo
  save(data) {
    memoryDB = data;
  },

  // Reset a datos iniciales
  reset() {
    memoryDB = JSON.parse(JSON.stringify(INITIAL_DATA));
  },

  // ── USUARIOS ──────────────────────────────────────────────────
  getUsuarios() { return this.get().usuarios; },

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
  getCandidatos() { return this.get().candidatos; },

  getCandidatoById(id) { return this.get().candidatos.find(c => c.id === id); },

  getCandidatosByEstado(estado) { return this.get().candidatos.filter(c => c.estado_proceso === estado); },

  getCandidatosBySocio(id_socio) { return this.get().candidatos.filter(c => c.id_socio === id_socio); },

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
    // Notificación al asesor
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
