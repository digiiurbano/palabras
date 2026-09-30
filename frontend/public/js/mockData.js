const INITIAL_DATA = {
  "usuarios": [
    {
      "id": "a0000000-0000-0000-0000-000000000001",
      "nombre": "Admin JN Palabras",
      "roles": ["Admin"],
      "correo": "admin@jnpalabras.com",
      "contrasena": "JNPalabrasAdmin2026!",
      "avatar": "AJ",
      "activo": true,
      "fecha_creacion": "2024-01-15",
      "ultimo_acceso": "2026-09-16T20:53:40.885Z"
    },
    {
      "id": "d973ef09-e8ea-4181-9919-5e9393c221e7",
      "nombre": "Jonathan Urbano",
      "roles": ["Super Asesor", "Asesor", "Profesor"],
      "correo": "jonathanpk97@gmail.com",
      "contrasena": "JNPalabrasSuper2026!",
      "avatar": "JU",
      "activo": true,
      "fecha_creacion": "2026-09-28"
    },
    {
      "id": "u-super-001",
      "nombre": "Mariana Vega (Super Asesora)",
      "roles": ["Super Asesor"],
      "correo": "superasesor@jnpalabras.com",
      "contrasena": "JNPalabrasSuper2026!",
      "avatar": "MV",
      "activo": true,
      "fecha_creacion": "2024-02-01"
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
    }
  ],
  "candidatos": [
    {
      "id": "cand-001",
      "nombre": "Luis Villacis",
      "pais": "Ecuador",
      "especialidad": "Lic. Enfermería",
      "nivel_aleman": "A1",
      "estado_proceso": "Lead Nuevo",
      "estado_homologacion": "Pendiente",
      "id_asesor": "u-asesor-001",
      "nombre_asesor": "Carlos Martínez",
      "correo": "luis.villacis@email.com",
      "telefono": "+593 99 123 4567",
      "foto": "",
      "fecha_alta": "2026-09-20",
      "documentos_subidos": 2,
      "certificado_idioma": null
    },
    {
      "id": "cand-002",
      "nombre": "Dra. Camila Morales",
      "pais": "Colombia",
      "especialidad": "Medicina General",
      "nivel_aleman": "A2",
      "estado_proceso": "1er Contacto / Reclutamiento",
      "estado_homologacion": "En Proceso",
      "id_asesor": "u-asesor-001",
      "nombre_asesor": "Carlos Martínez",
      "correo": "camila.morales@email.com",
      "telefono": "+57 310 987 6543",
      "foto": "",
      "fecha_alta": "2026-09-18",
      "documentos_subidos": 4,
      "certificado_idioma": "A2"
    },
    {
      "id": "cand-003",
      "nombre": "Lic. Roberto Gómez",
      "pais": "Perú",
      "especialidad": "Fisioterapia",
      "nivel_aleman": "B1",
      "estado_proceso": "Suficiencia de Idioma (A1-B2)",
      "estado_homologacion": "En Proceso",
      "id_asesor": "u-asesor-001",
      "nombre_asesor": "Carlos Martínez",
      "correo": "roberto.gomez@email.com",
      "telefono": "+51 987 654 321",
      "foto": "",
      "fecha_alta": "2026-09-10",
      "documentos_subidos": 5,
      "certificado_idioma": "B1"
    },
    {
      "id": "cand-004",
      "nombre": "Dra. Valentina Ortiz",
      "pais": "México",
      "especialidad": "Anestesiología",
      "nivel_aleman": "B2",
      "estado_proceso": "Entrevista y Contrato",
      "estado_homologacion": "Aprobado",
      "id_asesor": "u-asesor-001",
      "nombre_asesor": "Carlos Martínez",
      "correo": "valentina.ortiz@email.com",
      "telefono": "+52 55 4321 8765",
      "foto": "",
      "fecha_alta": "2026-08-25",
      "documentos_subidos": 6,
      "certificado_idioma": "B2"
    },
    {
      "id": "cand-005",
      "nombre": "Lic. Andrés Paredes",
      "pais": "Ecuador",
      "especialidad": "Instrumentación Quirúrgica",
      "nivel_aleman": "B2",
      "estado_proceso": "Procesamiento de Visa",
      "estado_homologacion": "Aprobado",
      "id_asesor": "u-asesor-001",
      "nombre_asesor": "Carlos Martínez",
      "correo": "andres.paredes@email.com",
      "telefono": "+593 98 765 4321",
      "foto": "",
      "fecha_alta": "2026-08-15",
      "documentos_subidos": 6,
      "certificado_idioma": "B2"
    },
    {
      "id": "cand-006",
      "nombre": "Lic. Lucía Silva",
      "pais": "Argentina",
      "especialidad": "Cuidados Intensivos",
      "nivel_aleman": "B2",
      "estado_proceso": "Fase Pre-viaje",
      "estado_homologacion": "Aprobado",
      "id_asesor": "u-asesor-001",
      "nombre_asesor": "Carlos Martínez",
      "correo": "lucia.silva@email.com",
      "telefono": "+54 9 11 2345 6789",
      "foto": "",
      "fecha_alta": "2026-07-20",
      "documentos_subidos": 6,
      "certificado_idioma": "B2"
    },
    {
      "id": "cand-007",
      "nombre": "Dr. Javier Torres",
      "pais": "Chile",
      "especialidad": "Traumatología",
      "nivel_aleman": "C1",
      "estado_proceso": "En Destino",
      "estado_homologacion": "Aprobado",
      "id_asesor": "u-asesor-001",
      "nombre_asesor": "Carlos Martínez",
      "correo": "javier.torres@email.com",
      "telefono": "+56 9 8765 4321",
      "foto": "",
      "fecha_alta": "2026-06-10",
      "documentos_subidos": 6,
      "certificado_idioma": "C1"
    },
    {
      "id": "cand-008",
      "nombre": "Dra. Mariana Reyes",
      "pais": "Colombia",
      "especialidad": "Pediatría",
      "nivel_aleman": "C1",
      "estado_proceso": "Inserción Exitosa",
      "estado_homologacion": "Aprobado",
      "id_asesor": "u-asesor-001",
      "nombre_asesor": "Carlos Martínez",
      "correo": "mariana.reyes@email.com",
      "telefono": "+57 320 123 4567",
      "foto": "",
      "fecha_alta": "2026-05-01",
      "documentos_subidos": 6,
      "certificado_idioma": "C1"
    }
  ],
  "kanban_columns": [
    {
      "id": "Lead Nuevo",
      "label": "Lead Nuevo",
      "color": "#64748b",
      "icon": "🆕"
    },
    {
      "id": "1er Contacto / Reclutamiento",
      "label": "1er Contacto / Reclutamiento",
      "color": "#3b82f6",
      "icon": "📞"
    },
    {
      "id": "Suficiencia de Idioma (A1-B2)",
      "label": "Suficiencia de Idioma (A1-B2)",
      "color": "#8b5cf6",
      "icon": "🗣️"
    },
    {
      "id": "Entrevista y Contrato",
      "label": "Entrevista y Contrato",
      "color": "#ec4899",
      "icon": "🤝"
    },
    {
      "id": "Procesamiento de Visa",
      "label": "Procesamiento de Visa",
      "color": "#f59e0b",
      "icon": "🛂"
    },
    {
      "id": "Fase Pre-viaje",
      "label": "Fase Pre-viaje",
      "color": "#14b8a6",
      "icon": "✈️"
    },
    {
      "id": "En Destino",
      "label": "En Destino",
      "color": "#eab308",
      "icon": "📍"
    },
    {
      "id": "Inserción Exitosa",
      "label": "Inserción Exitosa",
      "color": "#10b981",
      "icon": "🎉"
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
