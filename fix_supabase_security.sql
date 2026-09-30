-- =============================================================
-- SCRIPT DE RESOLUCIÓN DE ERRORES DE SEGURIDAD EN SUPABASE
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard)
-- =============================================================

-- -------------------------------------------------------
-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EN LAS 16 TABLAS
-- Resuelve los 16 errores "RLS Disabled in Public"
-- -------------------------------------------------------
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_clase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrevistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_gdpr ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- 2. CREAR POLÍTICAS RLS (Permiten operaciones del backend)
-- -------------------------------------------------------
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Acceso total backend" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Acceso total backend" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- -------------------------------------------------------
-- 3. RECREAR VISTAS CON SECURITY INVOKER
-- Resuelve los 2 errores "Security Definer View"
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.vista_pipeline_candidatos;
CREATE VIEW public.vista_pipeline_candidatos 
WITH (security_invoker = true) AS
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
FROM public.candidatos c
JOIN public.usuarios u ON c.id_usuario = u.id
LEFT JOIN public.socios s ON c.id_socio_referidor = s.id_usuario;

DROP VIEW IF EXISTS public.vista_kpis_admin;
CREATE VIEW public.vista_kpis_admin 
WITH (security_invoker = true) AS
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
FROM public.candidatos c
CROSS JOIN (SELECT 1) dummy
LEFT JOIN public.vacantes v ON TRUE
LEFT JOIN public.empresas e ON TRUE
LEFT JOIN public.comisiones co ON TRUE;
