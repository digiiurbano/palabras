-- =============================================================
-- JN PALABRAS MVP - ESQUEMA DE BASE DE DATOS RELACIONAL
-- Heidelberg, Alemania | Consultora Internacional de Salud
-- Cumplimiento GDPR/DSGVO - Datos médicos sensibles
-- =============================================================

-- -------------------------------------------------------
-- EXTENSIONES Y CONFIGURACIÓN
-- -------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Para hashing de contraseñas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Para UUIDs

-- -------------------------------------------------------
-- TABLA: USUARIOS (Control de acceso basado en roles)
-- -------------------------------------------------------
CREATE TABLE usuarios (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre            VARCHAR(150)  NOT NULL,
    correo            VARCHAR(255)  NOT NULL UNIQUE,
    contrasena_hash   TEXT          NOT NULL, -- bcrypt hash, nunca texto plano
    roles             JSONB         NOT NULL DEFAULT '[]'::jsonb, -- Arreglo de roles ej: ["Admin", "Profesor"]
    avatar_url        TEXT,
    activo            BOOLEAN       DEFAULT TRUE,
    ultimo_acceso     TIMESTAMPTZ,
    fecha_creacion    TIMESTAMPTZ   DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  usuarios IS 'Tabla maestra de todos los usuarios del sistema con control de acceso por rol.';
COMMENT ON COLUMN usuarios.contrasena_hash IS 'Hash bcrypt de la contraseña. Nunca almacenar texto plano. Cumplimiento GDPR Art.32.';

-- -------------------------------------------------------
-- TABLA: CANDIDATOS (Perfil Médico Extendido)
-- -------------------------------------------------------
CREATE TABLE candidatos (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario            UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_completo       VARCHAR(200) NOT NULL,
    correo                VARCHAR(255),
    fecha_nacimiento      DATE,
    pais_origen           VARCHAR(100),
    nacionalidad          VARCHAR(100),
    telefono              VARCHAR(30),
    especialidad_medica   VARCHAR(150), -- Ej: Cardiología, Medicina General, Enfermería UCI
    subespecialidad       VARCHAR(150),
    anos_experiencia      INTEGER DEFAULT 0,
    nivel_aleman_actual   VARCHAR(10) CHECK (nivel_aleman_actual IN ('A1','A2','B1','B2','C1','C2','FSP','Ninguno')),
    estado_homologacion   VARCHAR(30) DEFAULT 'Pendiente' CHECK (estado_homologacion IN (
                              'Pendiente','En_Tramite','Reconocimiento_Parcial','Aprobado','Rechazado'
                          )),
    estado_proceso        VARCHAR(40) DEFAULT 'Lead_Nuevo' CHECK (estado_proceso IN (
                              'Lead_Nuevo','Idioma','Homologacion','Postulacion',
                              'Entrevista_Agendada','Tramite_Visado','Colocado','Inactivo'
                          )),
    -- Referencias a archivos (URLs encriptadas / S3 EU)
    cv_url                TEXT, -- Encriptado en tránsito, almacenado servidor UE
    pasaporte_url         TEXT,
    titulo_url            TEXT,
    foto_url              TEXT,
    video_presentacion_url TEXT, -- Video pitch en alemán (anónimo para hospitales)
    -- Agente de origen
    id_socio_referidor    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    -- Consentimiento GDPR
    consentimiento_gdpr   BOOLEAN DEFAULT FALSE,
    fecha_consentimiento  TIMESTAMPTZ,
    -- Metadatos
    notas_internas        TEXT, -- Solo visible para Admin/Asesor
    edad                  INTEGER,
    puntaje_elegibilidad  INTEGER,
    respuestas_elegibilidad JSONB,
    fecha_creacion        TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidatos_estado ON candidatos(estado_proceso);
CREATE INDEX idx_candidatos_especialidad ON candidatos(especialidad_medica);
CREATE INDEX idx_candidatos_nivel_aleman ON candidatos(nivel_aleman_actual);

-- -------------------------------------------------------
-- TABLA: EMPRESAS / HOSPITALES (Clientes B2B)
-- -------------------------------------------------------
CREATE TABLE empresas (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario        UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_clinica    VARCHAR(200) NOT NULL,
    tipo_centro       VARCHAR(50) CHECK (tipo_centro IN ('Hospital_Universitario','Clinica_Privada','Centro_Medico','Residencia','Otro')),
    region_alemania   VARCHAR(100), -- Bayern, Baden-Württemberg, etc.
    ciudad            VARCHAR(100),
    direccion         TEXT,
    contacto_nombre   VARCHAR(150),
    correo_contacto   VARCHAR(255),
    telefono          VARCHAR(30),
    sitio_web         VARCHAR(255),
    numero_camas      INTEGER,
    activo            BOOLEAN DEFAULT TRUE,
    fecha_creacion    TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: VACANTES (Ofertas de Empleo)
-- -------------------------------------------------------
CREATE TABLE vacantes (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_empresa              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    titulo_puesto           VARCHAR(200) NOT NULL,
    especialidad_requerida  VARCHAR(150) NOT NULL,
    descripcion             TEXT,
    vacantes_disponibles    INTEGER DEFAULT 1,
    nivel_aleman_minimo     VARCHAR(10) NOT NULL CHECK (nivel_aleman_minimo IN ('A1','A2','B1','B2','C1','C2','FSP')),
    requiere_fsp            BOOLEAN DEFAULT FALSE,
    sueldo_min              NUMERIC(10,2),
    sueldo_max              NUMERIC(10,2),
    sueldo_moneda           VARCHAR(5) DEFAULT 'EUR',
    tipo_contrato           VARCHAR(30) CHECK (tipo_contrato IN ('Indefinido','Temporal','Practicas','Sustitucion')),
    jornada                 VARCHAR(20) CHECK (jornada IN ('Completa','Parcial','Guardia')),
    fecha_inicio_deseada    DATE,
    estado                  VARCHAR(20) DEFAULT 'Abierta' CHECK (estado IN ('Abierta','Pausada','Cerrada','Cubierta')),
    fecha_creacion          TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vacantes_especialidad ON vacantes(especialidad_requerida);
CREATE INDEX idx_vacantes_estado ON vacantes(estado);

-- -------------------------------------------------------
-- TABLA: MATCHING (Candidato <-> Vacante)
-- -------------------------------------------------------
CREATE TABLE matchings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_candidato    UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
    id_vacante      UUID NOT NULL REFERENCES vacantes(id) ON DELETE CASCADE,
    id_asesor       UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    estado          VARCHAR(30) DEFAULT 'Sugerido' CHECK (estado IN (
                        'Sugerido','Enviado_Empresa','Entrevista_Solicitada',
                        'Entrevista_Realizada','Oferta_Extendida','Contratado','Descartado'
                    )),
    puntuacion_match INTEGER, -- 0-100 score del algoritmo de matching
    fecha_creacion  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_candidato, id_vacante)
);

-- -------------------------------------------------------
-- TABLA: DOCUMENTOS (Expediente Digital con GDPR)
-- -------------------------------------------------------
CREATE TABLE documentos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_candidato        UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
    nombre_archivo      VARCHAR(255) NOT NULL,
    categoria           VARCHAR(30) NOT NULL CHECK (categoria IN (
                            'Pasaporte','Titulo_Universitario','Notas_Academicas',
                            'Certificado_Idioma','Certificado_Especialidad',
                            'Certificado_Nacimiento','Antecedentes_Penales',
                            'Foto_Carnet','Video_Presentacion','Otro'
                        )),
    url_archivo         TEXT NOT NULL, -- URL encriptada / CDN UE (Frankfurt)
    tamano_bytes        BIGINT,
    tipo_mime           VARCHAR(100),
    estado_aprobacion   VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado_aprobacion IN (
                            'Pendiente','En_Revision','Aprobado','Rechazado','Caducado'
                        )),
    comentario_asesor   TEXT, -- Motivo de rechazo o instrucciones de corrección
    id_asesor_revisor   UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_subida        TIMESTAMPTZ DEFAULT NOW(),
    fecha_revision      TIMESTAMPTZ,
    -- Cumplimiento GDPR: registro de accesos a datos sensibles
    encriptado          BOOLEAN DEFAULT TRUE,
    region_almacenamiento VARCHAR(50) DEFAULT 'eu-central-1' -- Frankfurt AWS
);

CREATE INDEX idx_documentos_candidato ON documentos(id_candidato);
CREATE INDEX idx_documentos_estado ON documentos(estado_aprobacion);

-- -------------------------------------------------------
-- TABLA: CLASES / GRUPOS DE IDIOMA
-- -------------------------------------------------------
CREATE TABLE grupos_clase (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_profesor     UUID NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    nombre_grupo    VARCHAR(100) NOT NULL,
    nivel_idioma    VARCHAR(10) NOT NULL CHECK (nivel_idioma IN ('A1','A2','B1','B2','C1','FSP')),
    modalidad       VARCHAR(20) DEFAULT 'Online' CHECK (modalidad IN ('Online','Presencial','Hibrido')),
    horario_desc    TEXT, -- Ej: "Lunes y Miércoles 18:00-20:00 CET"
    enlace_reunion  TEXT, -- Zoom / Google Meet / Teams
    max_alumnos     INTEGER DEFAULT 12,
    temario         TEXT,
    activo          BOOLEAN DEFAULT TRUE,
    fecha_inicio    DATE,
    fecha_fin       DATE,
    fecha_creacion  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: INSCRIPCIONES (Candidato <-> Grupo)
-- -------------------------------------------------------
CREATE TABLE inscripciones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_candidato    UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
    id_grupo        UUID NOT NULL REFERENCES grupos_clase(id) ON DELETE CASCADE,
    fecha_inscripcion TIMESTAMPTZ DEFAULT NOW(),
    estado          VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo','Completado','Abandonado')),
    UNIQUE(id_candidato, id_grupo)
);

-- -------------------------------------------------------
-- TABLA: CALIFICACIONES Y ASISTENCIA
-- -------------------------------------------------------
CREATE TABLE calificaciones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_inscripcion  UUID NOT NULL REFERENCES inscripciones(id) ON DELETE CASCADE,
    id_profesor     UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_evaluacion VARCHAR(30) CHECK (tipo_evaluacion IN ('Examen_Simulacro','FSP','Asistencia_Sesion','Tarea','Evaluacion_Oral')),
    fecha_evaluacion DATE NOT NULL,
    calificacion    NUMERIC(5,2), -- 0-10 o porcentaje
    calificacion_max NUMERIC(5,2) DEFAULT 10,
    nivel_evaluado  VARCHAR(10), -- A1, A2, B1, etc.
    aprobado        BOOLEAN,
    en_riesgo       BOOLEAN DEFAULT FALSE, -- Alerta para el asesor
    observaciones   TEXT,
    fecha_registro  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: MATERIALES EDUCATIVOS
-- -------------------------------------------------------
CREATE TABLE materiales (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_grupo        UUID REFERENCES grupos_clase(id) ON DELETE CASCADE,
    id_profesor     UUID NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    titulo          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    tipo            VARCHAR(30) CHECK (tipo IN ('PDF','Video','Audio','Ejercicio','Guia_Cultural','Terminologia_Medica','Otro')),
    url_archivo     TEXT NOT NULL,
    publico         BOOLEAN DEFAULT FALSE, -- Si es accesible en web pública
    fecha_subida    TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: ENTREVISTAS
-- -------------------------------------------------------
CREATE TABLE entrevistas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_matching     UUID NOT NULL REFERENCES matchings(id) ON DELETE CASCADE,
    fecha_propuesta TIMESTAMPTZ NOT NULL,
    fecha_confirmada TIMESTAMPTZ,
    enlace_video    TEXT,
    estado          VARCHAR(20) DEFAULT 'Propuesta' CHECK (estado IN (
                        'Propuesta','Confirmada','Realizada','Cancelada','Reprogramada'
                    )),
    -- Feedback post-entrevista (completado por la empresa)
    calificacion_empresa INTEGER CHECK (calificacion_empresa BETWEEN 1 AND 5),
    feedback_empresa     TEXT,
    decision_empresa     VARCHAR(20) CHECK (decision_empresa IN ('Contratado','Rechazado','Pendiente','Segunda_Entrevista')),
    fecha_creacion  TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: SOCIOS DE CAPTACIÓN (Agencias en Origen)
-- -------------------------------------------------------
CREATE TABLE socios (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario              UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_agencia          VARCHAR(200) NOT NULL,
    pais_operacion          VARCHAR(100),
    contacto_nombre         VARCHAR(150),
    correo_contacto         VARCHAR(255),
    telefono                VARCHAR(30),
    porcentaje_comision     NUMERIC(5,2) DEFAULT 10.00, -- % por candidato colocado
    tipo_acuerdo            VARCHAR(30) CHECK (tipo_acuerdo IN ('Exclusivo','No_Exclusivo','Prueba')),
    activo                  BOOLEAN DEFAULT TRUE,
    candidatos_referidos_count INTEGER DEFAULT 0,
    comisiones_acumuladas   NUMERIC(12,2) DEFAULT 0.00,
    comisiones_cobradas     NUMERIC(12,2) DEFAULT 0.00,
    fecha_creacion          TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: COMISIONES (Desglose por Colocación)
-- -------------------------------------------------------
CREATE TABLE comisiones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_socio            UUID NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    id_candidato        UUID NOT NULL REFERENCES candidatos(id) ON DELETE SET NULL,
    monto               NUMERIC(10,2) NOT NULL,
    moneda              VARCHAR(5) DEFAULT 'EUR',
    estado              VARCHAR(20) DEFAULT 'Devengada' CHECK (estado IN ('Devengada','Aprobada','Pagada','Cancelada')),
    fecha_devengamiento TIMESTAMPTZ DEFAULT NOW(),
    fecha_pago          TIMESTAMPTZ,
    referencia_pago     TEXT,
    notas               TEXT
);

-- -------------------------------------------------------
-- TABLA: NOTAS DE SEGUIMIENTO (Historial del Asesor)
-- -------------------------------------------------------
CREATE TABLE notas_seguimiento (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_candidato    UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
    id_asesor       UUID NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo            VARCHAR(30) CHECK (tipo IN ('Llamada','Email','Reunion_Virtual','Nota_Interna','Alerta','Hito')),
    contenido       TEXT NOT NULL,
    fecha_actividad TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLA: NOTIFICACIONES
-- -------------------------------------------------------
CREATE TABLE notificaciones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario_dest UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo            VARCHAR(40) CHECK (tipo IN (
                        'Documento_Aprobado','Documento_Rechazado','Entrevista_Agendada',
                        'Visado_Aprobado','Nueva_Calificacion','Nuevo_Candidato',
                        'Oferta_Nueva','Comision_Registrada','Alerta_Rendimiento','Sistema'
                    )),
    titulo          VARCHAR(200) NOT NULL,
    mensaje         TEXT NOT NULL,
    leida           BOOLEAN DEFAULT FALSE,
    url_accion      TEXT, -- Deep-link al recurso relacionado
    fecha_creacion  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(id_usuario_dest, leida);

-- -------------------------------------------------------
-- TABLA: LOG DE AUDITORÍA GDPR
-- -------------------------------------------------------
CREATE TABLE auditoria_gdpr (
    id              BIGSERIAL PRIMARY KEY,
    id_usuario      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    accion          VARCHAR(50) NOT NULL, -- READ, CREATE, UPDATE, DELETE, DOWNLOAD
    tabla_afectada  VARCHAR(100),
    registro_id     UUID,
    ip_origen       INET,
    detalles        JSONB,
    fecha           TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- DATOS SEMILLA (SEED DATA) - Para el MVP Demo
-- -------------------------------------------------------

-- Usuarios Oficiales del Sistema
INSERT INTO usuarios (id, nombre, correo, contrasena_hash, roles) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Ana García (Admin)', 'admin@jnpalabras.com', 'JNPalabrasAdmin2026!', '["Admin"]'::jsonb),
    ('a0000000-0000-0000-0000-000000000002', 'Carlos Martínez (Asesor)', 'asesor@jnpalabras.com', 'JNPalabrasAsesor2026!', '["Asesor"]'::jsonb),
    ('a0000000-0000-0000-0000-000000000003', 'Dra. Elena Weber (Profesor)', 'profesor@jnpalabras.com', 'JNPalabrasProfesor2026!', '["Profesor"]'::jsonb),
    ('a0000000-0000-0000-0000-000000000004', 'Dr. Javier Torres (Candidato)', 'candidato@jnpalabras.com', 'JNPalabrasCandidato2026!', '["Candidato"]'::jsonb),
    ('a0000000-0000-0000-0000-000000000005', 'Klinikum Stuttgart', 'empresa@jnpalabras.com', 'JNPalabrasEmpresa2026!', '["Empresa"]'::jsonb),
    ('a0000000-0000-0000-0000-000000000006', 'MediLink Colombia', 'socio@jnpalabras.com', 'JNPalabrasSocio2026!', '["Socio"]'::jsonb);

-- Candidatos de demostración
INSERT INTO candidatos (id, id_usuario, nombre_completo, pais_origen, especialidad_medica, nivel_aleman_actual, estado_proceso, estado_homologacion, consentimiento_gdpr, fecha_consentimiento) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Dr. Javier Torres', 'Colombia', 'Medicina_General', 'B2', 'Idioma', 'En_Tramite', TRUE, NOW()),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'Dra. María López', 'México', 'Cardiologia', 'B1', 'Homologacion', 'Pendiente', TRUE, NOW()),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'Enfermera Rosa Kim', 'Filipinas', 'Enfermeria_UCI', 'A2', 'Idioma', 'En_Tramite', TRUE, NOW()),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Dr. Ahmed Hassan', 'Siria', 'Pediatria', 'B2', 'Postulacion', 'Reconocimiento_Parcial', TRUE, NOW()),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', 'Dra. Ana Souza', 'Brasil', 'Anestesiologia', 'C1', 'Entrevista_Agendada', 'Aprobado', TRUE, NOW());

-- Empresa de demostración
INSERT INTO empresas (id, id_usuario, nombre_clinica, tipo_centro, region_alemania, ciudad, contacto_nombre, correo_contacto, telefono) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Klinikum Stuttgart', 'Hospital_Universitario', 'Baden-Württemberg', 'Stuttgart', 'Dr. Hans Müller', 'rrhh@klinikum-stuttgart.de', '+49711000001');

-- Vacantes de demostración
INSERT INTO vacantes (id_empresa, titulo_puesto, especialidad_requerida, nivel_aleman_minimo, sueldo_min, sueldo_max, estado, requiere_fsp) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Médico de Urgencias', 'Medicina_General', 'B2', 4500, 5800, 'Abierta', TRUE),
    ('c0000000-0000-0000-0000-000000000001', 'Cardiólogo Consultor', 'Cardiologia', 'C1', 6000, 8500, 'Abierta', TRUE),
    ('c0000000-0000-0000-0000-000000000001', 'Enfermero/a UCI', 'Enfermeria_UCI', 'B2', 3200, 4000, 'Abierta', FALSE);

-- Grupo de clase de demostración
INSERT INTO grupos_clase (id_profesor, nombre_grupo, nivel_idioma, horario_desc, enlace_reunion, max_alumnos, fecha_inicio) VALUES
    ('a0000000-0000-0000-0000-000000000003', 'Grupo B2 Medicina - Julio 2025', 'B2', 'Lun/Mié 18:00-20:00 CET', 'https://meet.google.com/jnp-b2-medicina', 10, '2025-07-01');

-- Socio de demostración
INSERT INTO socios (id_usuario, nombre_agencia, pais_operacion, contacto_nombre, porcentaje_comision, candidatos_referidos_count, comisiones_acumuladas) VALUES
    ('a0000000-0000-0000-0000-000000000006', 'MediLink Colombia', 'Colombia', 'Laura Rodríguez', 12.50, 3, 7500.00);

-- -------------------------------------------------------
-- VISTAS ÚTILES
-- -------------------------------------------------------

-- Vista: Estado del pipeline de candidatos
CREATE OR REPLACE VIEW vista_pipeline_candidatos AS
SELECT 
    c.id,
    c.nombre_completo,
    c.especialidad_medica,
    c.nivel_aleman_actual,
    c.estado_proceso,
    c.estado_homologacion,
    c.pais_origen,
    u.correo,
    s.nombre_agencia AS agencia_origen,
    c.fecha_creacion
FROM candidatos c
JOIN usuarios u ON c.id_usuario = u.id
LEFT JOIN socios s ON c.id_socio_referidor = s.id_usuario;

-- Vista: KPIs financieros y operativos para Admin
CREATE OR REPLACE VIEW vista_kpis_admin AS
SELECT 
    COUNT(DISTINCT c.id) AS total_candidatos,
    COUNT(DISTINCT c.id) FILTER (WHERE c.estado_proceso = 'Colocado') AS candidatos_colocados,
    COUNT(DISTINCT v.id) FILTER (WHERE v.estado = 'Abierta') AS vacantes_activas,
    COUNT(DISTINCT e.id) AS total_empresas_clientes,
    ROUND(
        COUNT(DISTINCT c.id) FILTER (WHERE c.estado_proceso = 'Colocado')::DECIMAL / 
        NULLIF(COUNT(DISTINCT c.id), 0) * 100, 1
    ) AS tasa_colocacion_pct,
    COALESCE(SUM(co.monto) FILTER (WHERE co.estado = 'Pagada'), 0) AS ingresos_cobrados_eur,
    COALESCE(SUM(co.monto) FILTER (WHERE co.estado IN ('Devengada','Aprobada')), 0) AS ingresos_proyectados_eur
FROM candidatos c
CROSS JOIN (SELECT 1) dummy
LEFT JOIN vacantes v ON TRUE
LEFT JOIN empresas e ON TRUE
LEFT JOIN comisiones co ON TRUE;
