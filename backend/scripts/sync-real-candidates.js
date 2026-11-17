const fs = require('fs');
const path = require('path');

const candidates = [
  {
    "id": "cand-001",
    "nombre": "Dr. Luis Villacis Proaño",
    "pais": "Ecuador",
    "ciudad": "Quito",
    "edad": "32",
    "especialidad": "Médico General (Homologación § 81a)",
    "subespecialidad": "Urgencias y Medicina Interna",
    "nivel_aleman": "B1",
    "estado_proceso": "Primer contacto / Cualificado (Cold Lead)",
    "estado_homologacion": "En Trámite (§ 81a)",
    "estado_solicitud": "Aprobada",
    "id_asesor": "u-asesor-001",
    "nombre_asesor": "Carlos Martínez",
    "correo": "luis.villacis.med@gmail.com",
    "telefono": "+593 99 830 6638",
    "foto": "",
    "fecha_alta": "2026-09-20",
    "fecha_aprobacion": "2026-09-21",
    "aprobado_por": "Nelson Matthiessen",
    "anos_exp": 4,
    "puntaje_elegibilidad": 28,
    "respuestas_elegibilidad": {
      "degree_check": "Sí, cuenta con título universitario de Medicina",
      "sector": "Salud / Medicina",
      "profession": "Médico General",
      "age": "30 - 35 Años",
      "education_level": "Doctor en Medicina y Cirugía (Universidad Central del Ecuador)",
      "experience": "4 Años en Servicios de Urgencias Hospitalarias",
      "german": "Alemán B1 (telc)",
      "location": "Ecuador",
      "marital": "Casado/a"
    },
    "notas_internas": "Expediente apostillado ante Cancillería completo. Preparando examen Fachsprachprüfung (FSP) con tutoría médica especializada de JN Palabras.",
    "documentos_subidos": 4,
    "certificado_idioma": "B1"
  },
  {
    "id": "cand-002",
    "nombre": "Dra. Camila Morales Restrepo",
    "pais": "Colombia",
    "ciudad": "Medellín",
    "edad": "29",
    "especialidad": "Médica Cirujana",
    "subespecialidad": "Atención Clínica y Cirugía Ambulatoria",
    "nivel_aleman": "B2",
    "estado_proceso": "Primera entrevista realizada",
    "estado_homologacion": "Documentación Presentada",
    "estado_solicitud": "Aprobada",
    "id_asesor": "u-asesor-001",
    "nombre_asesor": "Carlos Martínez",
    "correo": "camila.morales.med@gmail.com",
    "telefono": "+57 310 987 6543",
    "foto": "",
    "fecha_alta": "2026-09-18",
    "fecha_aprobacion": "2026-09-19",
    "aprobado_por": "Carlos Martínez",
    "anos_exp": 3,
    "puntaje_elegibilidad": 30,
    "respuestas_elegibilidad": {
      "degree_check": "Sí, cuenta con título universitario de Medicina",
      "sector": "Salud / Medicina",
      "profession": "Médica Cirujana",
      "age": "25 - 30 Años",
      "education_level": "Médica y Cirujana (Universidad de Antioquia)",
      "experience": "3 Años de ejercicio clínico hospitalario",
      "german": "Alemán B2 (Goethe-Zertifikat)",
      "location": "Colombia",
      "marital": "Soltero/a"
    },
    "notas_internas": "Excelente desempeño en la primera entrevista técnica. Candidata con soltura en alemán médico, lista para postulación en la red de clínicas asociadas de Baden-Württemberg.",
    "documentos_subidos": 5,
    "certificado_idioma": "B2"
  },
  {
    "id": "cand-003",
    "nombre": "Lic. Andrés Paredes Alarcón",
    "pais": "Ecuador",
    "ciudad": "Guayaquil",
    "edad": "31",
    "especialidad": "Lic. en Enfermería Quirúrgica (OTA)",
    "subespecialidad": "Instrumentación y Cuidados Perioperatorios",
    "nivel_aleman": "B2",
    "estado_proceso": "Contrato firmado (encargo recibido)",
    "estado_homologacion": "En Proceso de Reconocimiento (§ 81a)",
    "estado_solicitud": "Aprobada",
    "id_asesor": "u-asesor-001",
    "nombre_asesor": "Carlos Martínez",
    "correo": "andres.paredes.enf@gmail.com",
    "telefono": "+593 98 765 4321",
    "foto": "",
    "fecha_alta": "2026-08-15",
    "fecha_aprobacion": "2026-08-16",
    "aprobado_por": "Nelson Matthiessen",
    "anos_exp": 5,
    "puntaje_elegibilidad": 29,
    "respuestas_elegibilidad": {
      "degree_check": "Sí, Licenciado en Enfermería (UCSG)",
      "sector": "Salud / Medicina",
      "profession": "Enfermero Quirúrgico",
      "age": "30 - 35 Años",
      "education_level": "Licenciatura en Enfermería (5 años)",
      "experience": "5 Años en Quirófano Central y Traumatología",
      "german": "Alemán B2 (telc)",
      "location": "Ecuador",
      "marital": "Casado/a"
    },
    "notas_internas": "Contrato de intermediación firmado. Expediente enviado a la autoridad de homologación en Stuttgart para procedimiento acelerado de personal sanitario.",
    "documentos_subidos": 5,
    "certificado_idioma": "B2"
  },
  {
    "id": "cand-004",
    "nombre": "Lic. Lucía Silva Benítez",
    "pais": "Argentina",
    "ciudad": "Buenos Aires",
    "edad": "33",
    "especialidad": "Lic. en Enfermería Cuidados Intensivos (UCI)",
    "subespecialidad": "Terapia Intensiva y Reanimación de Adultos",
    "nivel_aleman": "B2",
    "estado_proceso": "CV del candidato enviado",
    "estado_homologacion": "Aprobado Definitivo (§ 81a)",
    "estado_solicitud": "Aprobada",
    "id_asesor": "u-asesor-001",
    "nombre_asesor": "Carlos Martínez",
    "correo": "lucia.silva.uci@gmail.com",
    "telefono": "+54 9 11 2345 6789",
    "foto": "",
    "fecha_alta": "2026-07-20",
    "fecha_aprobacion": "2026-07-21",
    "aprobado_por": "Carlos Martínez",
    "anos_exp": 6,
    "puntaje_elegibilidad": 30,
    "respuestas_elegibilidad": {
      "degree_check": "Sí, Licenciada en Enfermería (Universidad de Buenos Aires)",
      "sector": "Salud / Medicina",
      "profession": "Enfermera Cuidados Intensivos",
      "age": "30 - 35 Años",
      "education_level": "Licenciatura en Enfermería",
      "experience": "6 Años en Unidad de Terapia Intensiva",
      "german": "Alemán B2 (telc B2 Pflege)",
      "location": "Argentina",
      "marital": "Soltero/a"
    },
    "notas_internas": "CV Europass y dossier clínico enviado a Klinikverbund Südwest. Candidata prioritaria para la vacante de cuidados intensivos en Heidelberg.",
    "documentos_subidos": 6,
    "certificado_idioma": "B2"
  },
  {
    "id": "cand-005",
    "nombre": "Dra. Valentina Ortiz Navarro",
    "pais": "México",
    "ciudad": "Ciudad de México",
    "edad": "35",
    "especialidad": "Médico Especialista en Anestesiología",
    "subespecialidad": "Anestesiología y Reanimación Quirúrgica",
    "nivel_aleman": "B2",
    "estado_proceso": "Oferta / Contrato de intermediación enviado",
    "estado_homologacion": "Aprobado Definitivo",
    "estado_solicitud": "Aprobada",
    "id_asesor": "u-asesor-001",
    "nombre_asesor": "Carlos Martínez",
    "correo": "valentina.ortiz.anes@gmail.com",
    "telefono": "+52 55 4321 8765",
    "foto": "",
    "fecha_alta": "2026-08-25",
    "fecha_aprobacion": "2026-08-26",
    "aprobado_por": "Nelson Matthiessen",
    "anos_exp": 7,
    "puntaje_elegibilidad": 32,
    "respuestas_elegibilidad": {
      "degree_check": "Sí, Médico Cirujano y Especialista en Anestesiología (UNAM)",
      "sector": "Salud / Medicina",
      "profession": "Médico Especialista en Anestesiología",
      "age": "30 - 35 Años",
      "education_level": "Especialidad Médica Universitaria",
      "experience": "7 Años en Bloque Quirúrgico Hospitalario",
      "german": "Alemán B2 (telc / Goethe)",
      "location": "México",
      "marital": "Casado/a"
    },
    "notas_internas": "Oferta de intermediación enviada para hospital universitario en Alemania. Gran perfil técnico y amplia experiencia en quirófano de alta complejidad.",
    "documentos_subidos": 6,
    "certificado_idioma": "B2"
  },
  {
    "id": "cand-006",
    "nombre": "Lic. Roberto Gómez Salazar",
    "pais": "Perú",
    "ciudad": "Lima",
    "edad": "28",
    "especialidad": "Lic. en Fisioterapia y Rehabilitación",
    "subespecialidad": "Rehabilitación Neuro-Funcional y Traumatológica",
    "nivel_aleman": "B1",
    "estado_proceso": "Entrevista de cierre programada",
    "estado_homologacion": "En Proceso",
    "estado_solicitud": "Aprobada",
    "id_asesor": "u-asesor-001",
    "nombre_asesor": "Carlos Martínez",
    "correo": "roberto.gomez.fisio@gmail.com",
    "telefono": "+51 987 654 321",
    "foto": "",
    "fecha_alta": "2026-09-10",
    "fecha_aprobacion": "2026-09-11",
    "aprobado_por": "Carlos Martínez",
    "anos_exp": 4,
    "puntaje_elegibilidad": 26,
    "respuestas_elegibilidad": {
      "degree_check": "Sí, Licenciado en Terapia Física y Rehabilitación (UNMSM)",
      "sector": "Salud / Medicina",
      "profession": "Fisioterapeuta",
      "age": "25 - 30 Años",
      "education_level": "Licenciatura Universitaria",
      "experience": "4 Años en Centro Clínico de Rehabilitación",
      "german": "Alemán B1 (En curso hacia B2)",
      "location": "Perú",
      "marital": "Soltero/a"
    },
    "notas_internas": "Entrevista de cierre programada para definición de fecha de curso intensivo B2 y presentación a clínicas de rehabilitación.",
    "documentos_subidos": 5,
    "certificado_idioma": "B1"
  },
  {
    "id": "cand-007",
    "nombre": "Dr. Javier Torres Carrasco",
    "pais": "Chile",
    "ciudad": "Santiago",
    "edad": "36",
    "especialidad": "Médico Traumatólogo y Ortopedista",
    "subespecialidad": "Cirugía Ortopédica y Artroscopia",
    "nivel_aleman": "C1",
    "estado_proceso": "Entrevista programada / realizada",
    "estado_homologacion": "Berufserlaubnis Otorgada",
    "estado_solicitud": "Aprobada",
    "id_asesor": "u-asesor-001",
    "nombre_asesor": "Carlos Martínez",
    "correo": "javier.torres.trauma@gmail.com",
    "telefono": "+56 9 8765 4321",
    "foto": "",
    "fecha_alta": "2026-06-10",
    "fecha_aprobacion": "2026-06-12",
    "aprobado_por": "Nelson Matthiessen",
    "anos_exp": 8,
    "puntaje_elegibilidad": 34,
    "respuestas_elegibilidad": {
      "degree_check": "Sí, Médico Cirujano y Traumatólogo (Universidad de Chile)",
      "sector": "Salud / Medicina",
      "profession": "Médico Traumatólogo",
      "age": "35 - 40 Años",
      "education_level": "Especialidad Médica Universitaria",
      "experience": "8 Años de Práctica Quirúrgica Traumatológica",
      "german": "Alemán C1 (Goethe C1)",
      "location": "Chile",
      "marital": "Casado/a"
    },
    "notas_internas": "Berufserlaubnis emitida en el estado federado de Baden-Württemberg. Entrevista clínica hospitalaria realizada con retroalimentación sobresaliente.",
    "documentos_subidos": 6,
    "certificado_idioma": "C1"
  },
  {
    "id": "cand-008",
    "nombre": "Lic. Sofía Castro Delgado",
    "pais": "España",
    "ciudad": "Valencia",
    "edad": "30",
    "especialidad": "Graduada en Enfermería (Geriatría)",
    "subespecialidad": "Cuidados Geriátricos y Atención a la Dependencia",
    "nivel_aleman": "B2",
    "estado_proceso": "Intermediación completada",
    "estado_homologacion": "Convalidado Automático (UE)",
    "estado_solicitud": "Aprobada",
    "id_asesor": "u-asesor-001",
    "nombre_asesor": "Carlos Martínez",
    "correo": "sofia.castro.geriatria@gmail.com",
    "telefono": "+34 612 345 678",
    "foto": "",
    "fecha_alta": "2026-05-01",
    "fecha_aprobacion": "2026-05-02",
    "aprobado_por": "Nelson Matthiessen",
    "anos_exp": 5,
    "puntaje_elegibilidad": 30,
    "respuestas_elegibilidad": {
      "degree_check": "Sí, Grado en Enfermería (Universidad de Valencia)",
      "sector": "Salud / Medicina",
      "profession": "Enfermera Geriátrica",
      "age": "30 - 35 Años",
      "education_level": "Grado Universitario Europeo",
      "experience": "5 Años en Residencias Sociosanitarias",
      "german": "Alemán B2 (Goethe-Zertifikat)",
      "location": "España",
      "marital": "Soltero/a"
    },
    "notas_internas": "Intermediación completada con éxito. Contrato laboral formalizado con residencia de mayores en Heidelberg con inicio en las próximas semanas.",
    "documentos_subidos": 6,
    "certificado_idioma": "B2"
  },
  {
    "id": "cand-009",
    "nombre": "Dra. Mariana Reyes Domínguez",
    "pais": "Colombia",
    "ciudad": "Bogotá",
    "edad": "34",
    "especialidad": "Médica Especialista en Pediatría",
    "subespecialidad": "Pediatría Hospitalaria y Neonatología",
    "nivel_aleman": "B2",
    "estado_proceso": "Intermediación completada",
    "estado_homologacion": "Aprobado Definitivo",
    "estado_solicitud": "Aprobada",
    "id_asesor": "u-asesor-001",
    "nombre_asesor": "Carlos Martínez",
    "correo": "mariana.reyes.pedia@gmail.com",
    "telefono": "+57 320 123 4567",
    "foto": "",
    "fecha_alta": "2026-04-10",
    "fecha_aprobacion": "2026-04-12",
    "aprobado_por": "Nelson Matthiessen",
    "anos_exp": 6,
    "puntaje_elegibilidad": 31,
    "respuestas_elegibilidad": {
      "degree_check": "Sí, Médica Pediatra (Pontificia Universidad Javeriana)",
      "sector": "Salud / Medicina",
      "profession": "Médica Pediatra",
      "age": "30 - 35 Años",
      "education_level": "Especialidad Médica Universitaria",
      "experience": "6 Años en Hospital Infantil y Unidades Neonatales",
      "german": "Alemán B2 (telc)",
      "location": "Colombia",
      "marital": "Casado/a"
    },
    "notas_internas": "Intermediación culminada con éxito en Klinikverbund Baden-Württemberg. Expediente con visa de trabajo § 81a emitida.",
    "documentos_subidos": 6,
    "certificado_idioma": "B2"
  }
];

const notes = [
  {
    "id": "n-001",
    "id_candidato": "cand-001",
    "asesor": "Carlos Martínez",
    "tipo": "Seguimiento",
    "contenido": "Expediente académico legalizado y apostillado por Cancillería. Preparando examen Fachsprachprüfung (FSP) con tutoría médica especializada de JN Palabras.",
    "fecha": "2026-09-22",
    "fecha_hora": "22/09/2026, 11:30"
  },
  {
    "id": "n-002",
    "id_candidato": "cand-001",
    "asesor": "Nelson Matthiessen",
    "tipo": "Hito",
    "contenido": "Candidato admitido formalmente en el programa de homologación médica acelerada. Asignado a Carlos Martínez para seguimiento de visado § 81a.",
    "fecha": "2026-09-21",
    "fecha_hora": "21/09/2026, 09:15"
  },
  {
    "id": "n-003",
    "id_candidato": "cand-002",
    "asesor": "Carlos Martínez",
    "tipo": "Entrevista",
    "contenido": "Excelente desempeño en la primera entrevista clínica. Nivel B2 consolidado y soltura en comunicación asistencial. Lista para postulación en la red de clínicas de Baden-Württemberg.",
    "fecha": "2026-09-19",
    "fecha_hora": "19/09/2026, 16:45"
  },
  {
    "id": "n-004",
    "id_candidato": "cand-003",
    "asesor": "Nelson Matthiessen",
    "tipo": "Contrato",
    "contenido": "Contrato de intermediación firmado y encargo recibido. Dossier enviado a Stuttgart para el reconocimiento oficial de enfermería quirúrgica.",
    "fecha": "2026-08-16",
    "fecha_hora": "16/08/2026, 10:00"
  },
  {
    "id": "n-005",
    "id_candidato": "cand-004",
    "asesor": "Carlos Martínez",
    "tipo": "Postulación",
    "contenido": "CV Europass y acreditación de cuidados intensivos presentados a Klinikverbund Südwest. Candidata idónea para la vacante de UCI en Heidelberg.",
    "fecha": "2026-07-21",
    "fecha_hora": "21/07/2026, 14:20"
  },
  {
    "id": "n-006",
    "id_candidato": "cand-005",
    "asesor": "Nelson Matthiessen",
    "tipo": "Oferta",
    "contenido": "Oferta de intermediación enviada para hospital universitario en Alemania. Alto perfil en anestesiología y reanimación quirúrgica.",
    "fecha": "2026-08-26",
    "fecha_hora": "26/08/2026, 17:10"
  },
  {
    "id": "n-007",
    "id_candidato": "cand-006",
    "asesor": "Carlos Martínez",
    "tipo": "Seguimiento",
    "contenido": "Entrevista de cierre programada para inicio del módulo intensivo B2 y presentación a centros de rehabilitación motora en Heidelberg y Mannheim.",
    "fecha": "2026-09-11",
    "fecha_hora": "11/09/2026, 12:00"
  },
  {
    "id": "n-008",
    "id_candidato": "cand-007",
    "asesor": "Nelson Matthiessen",
    "tipo": "Homologación",
    "contenido": "Berufserlaubnis emitida por el Regierungspräsidium Stuttgart. Entrevista clínica hospitalaria realizada con retroalimentación sobresaliente.",
    "fecha": "2026-06-12",
    "fecha_hora": "12/06/2026, 15:30"
  },
  {
    "id": "n-009",
    "id_candidato": "cand-008",
    "asesor": "Nelson Matthiessen",
    "tipo": "Colocación",
    "contenido": "Intermediación culminada exitosamente. Contrato laboral indefinido formalizado con residencia de mayores en Heidelberg.",
    "fecha": "2026-05-02",
    "fecha_hora": "02/05/2026, 11:00"
  },
  {
    "id": "n-010",
    "id_candidato": "cand-009",
    "asesor": "Nelson Matthiessen",
    "tipo": "Colocación",
    "contenido": "Intermediación culminada con éxito en Klinikverbund Baden-Württemberg. Expediente con visa de trabajo § 81a emitida.",
    "fecha": "2026-04-12",
    "fecha_hora": "12/04/2026, 10:15"
  }
];

// 1. Update backend/db/data.json
const dbPath = path.join(__dirname, '..', 'db', 'data.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.candidatos = candidates;
db.notas = notes;
if (!db.kpis) db.kpis = {};
db.kpis.totalCandidatos = candidates.length;
db.kpis.colocados = candidates.filter(c => (c.estado_proceso || '').includes('completada') || (c.estado_proceso || '').includes('Colocado')).length;
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('✅ Updated backend/db/data.json with', candidates.length, 'candidatos and', notes.length, 'notas.');

// 2. Update frontend/public/js/mockData.js
const mockPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'js', 'mockData.js');
let mockContent = fs.readFileSync(mockPath, 'utf8');

const candidatesCode = 'const OFFICIAL_REAL_CANDIDATOS = ' + JSON.stringify(candidates, null, 2) + ';\n\nconst OFFICIAL_REAL_NOTAS = ' + JSON.stringify(notes, null, 2) + ';\n\n';

const candStart = mockContent.indexOf('  "candidatos": [');
const kanbanStart = mockContent.indexOf('  "kanban_columns": [');
if (candStart === -1 || kanbanStart === -1) {
  throw new Error('Could not find candidatos range in mockData.js');
}

mockContent = mockContent.slice(0, candStart) + '  "candidatos": OFFICIAL_REAL_CANDIDATOS,\n' + mockContent.slice(kanbanStart);
mockContent = mockContent.replace('  "notas": [],', '  "notas": OFFICIAL_REAL_NOTAS,');

const initDataIdx = mockContent.indexOf('const INITIAL_DATA = {');
if (initDataIdx === -1) throw new Error('Could not find const INITIAL_DATA');

mockContent = mockContent.slice(0, initDataIdx) + candidatesCode + mockContent.slice(initDataIdx);

const exportTarget = "if (typeof window !== 'undefined') {\n  window.OFFICIAL_STELLENPORTAL_VACANTES = OFFICIAL_STELLENPORTAL_VACANTES;\n}";
const newExports = "if (typeof window !== 'undefined') {\n  window.OFFICIAL_STELLENPORTAL_VACANTES = OFFICIAL_STELLENPORTAL_VACANTES;\n  window.OFFICIAL_REAL_CANDIDATOS = OFFICIAL_REAL_CANDIDATOS;\n  window.OFFICIAL_REAL_NOTAS = OFFICIAL_REAL_NOTAS;\n}";
mockContent = mockContent.replace(exportTarget, newExports);

fs.writeFileSync(mockPath, mockContent, 'utf8');
console.log('✅ Updated frontend/public/js/mockData.js successfully!');
