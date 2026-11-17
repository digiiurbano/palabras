/**
 * JN PALABRAS – SISTEMA MULTI-IDIOMA (i18n)
 * Soporte para Español (es), Alemán (de) e Inglés (en).
 */

const I18N_TRANSLATIONS = {
  es: {
    // Brand & Header
    brand_sub: 'Heidelberg · Deutschland',
    brand_title: 'Liderar entre culturas',
    brand_tagline: 'Leading Across Cultures',

    // Navigation
    nav_home: 'Inicio',
    nav_services: 'Servicios',
    nav_pillars: 'Con J&N Palabras',
    nav_about: 'Quiénes Somos',
    nav_process: 'Nuestro Proceso',
    nav_contact: 'Contacto',
    nav_b2b: '🏥 Para Clínicas (B2B)',
    nav_candidates: '💼 Candidatos',
    nav_login: 'Iniciar Sesión',
    nav_strategic_call: 'Reunión Estratégica',
    nav_for_professionals: 'Para Profesionales',
    nav_for_companies: 'Para Empresas',
    nav_apply_now: 'Aplicar Ahora',
    nav_prof_process: 'Proceso y Homologación (§ 81a)',
    nav_prof_stellenportal: 'Bolsa de Empleo (Stellenportal)',
    nav_prof_pillars: 'Acompañamiento 360°',
    nav_prof_about: 'Quiénes Somos',
    nav_prof_test: 'Test de Elegibilidad',
    nav_emp_services: 'Servicios y Soluciones',
    nav_emp_request: 'Solicitar Personal (B2B)',
    nav_emp_meeting: 'Reunión Estratégica',
    nav_emp_contact: 'Contacto Directo',

    // Stellenportal Section
    stellenportal_badge: 'STELLENPORTAL · BOLSA DE EMPLEO SANITARIO',
    stellenportal_title: 'Puestos Profesionales Disponibles en Alemania',
    stellenportal_subtitle: 'Finde Deinen Job, der am besten zu Dir passt. Posiciones oficiales con hospitales, clínicas y residencias verificadas.',
    stellenportal_search_ph: 'Buscar por puesto, especialidad, clínica o ciudad...',
    stellenportal_filter_all: 'Todas las Vacantes',
    stellenportal_filter_med: 'Medicina',
    stellenportal_filter_nurse: 'Enfermería',
    stellenportal_filter_ota: 'Quirófano / OTA',
    stellenportal_filter_assist: 'Asistenciales',
    stellenportal_btn_details: 'Ver Detalles',
    stellenportal_btn_apply: 'Postular Ahora',

    // Hero Section
    hero_badge: 'PALABRAS ONBOARDING · HEIDELBERG, ALEMANIA',
    hero_title_pre: 'PALABRAS A BORDO para la ',
    hero_title_gold: 'contratación e integración sostenible',
    hero_title_post: ' de mano de obra cualificada',
    hero_desc: 'Facilitamos la conexión entre hospitales, clínicas y empresas alemanas con especialistas cualificados de todo el mundo. Acompañamiento 360° en Visados, Idioma, Interculturalidad y Vida en Alemania.',
    hero_btn_strategic: 'Reunión Estratégica Gratuita',
    hero_btn_candidate: 'Test de Elegibilidad Candidatos',
    hero_btn_hospital: '🏥 Solicitar Personal para Hospitales',
    hero_stat_retention: '98% de Retención',
    hero_stat_retention_sub: 'Integración en el 1er año',
    hero_stat_visa: '§ 81a AufenthG',
    hero_stat_visa_sub: 'Procedimiento Acelerado',
    hero_stat_location: 'Heidelberg',
    hero_stat_location_sub: 'Baden-Württemberg, Alemania',

    // Core Services Section
    services_tag: 'NUESTRAS SOLUCIONES',
    services_title_pre: 'Con nuestra experiencia ',
    services_title_gold: 'ofrecemos soluciones para su empresa',
    services_desc: 'Cubrimos el ciclo completo: desde la selección y capacitación lingüística hasta la integración laboral y humana duradera en Alemania.',
    srv1_tag: 'RECLUTAMIENTO ÉTICO',
    srv1_title: 'Reclutamiento y Selección Especializada',
    srv1_desc: 'Identificamos, evaluamos y seleccionamos médicos, enfermeros y profesionales cualificados de todo el mundo, garantizando un encaje vocacional y cultural óptimo.',
    srv1_f1: 'Candidatos verificados y con titulación homologable',
    srv1_f2: 'Acompañamiento en todo el proceso de entrevistas',
    srv1_f3: 'Alineación de expectativas entre clínica y especialista',
    srv1_btn: 'Más información',
    srv2_tag: 'CAPACITACIÓN LINGÜÍSTICA',
    srv2_title: 'Formación Lingüística (Alemán)',
    srv2_desc: 'Aprenda alemán con formadores nativos y experimentados. Cursos desde A1 hasta B2/C1, alemán médico técnico y preparación intensiva para la Fachsprachenprüfung (FSP).',
    srv2_f1: 'Cursos adaptados a turnos y horarios laborales',
    srv2_f2: 'Alemán técnico hospitalario y preparación para FSP',
    srv2_f3: 'Seguimiento lingüístico tras el primer día laboral',
    srv2_btn: 'Más información',
    srv3_tag: 'INTEGRACIÓN SOSTENIBLE',
    srv3_title: 'Onboarding e Incorporación Intercultural',
    srv3_desc: 'Promovemos un entorno integrador. Nuestro programa dota a empleados y equipos de herramientas de comunicación para superar barreras culturales y crear relaciones duraderas.',
    srv3_f1: 'Sensibilización cultural y desarrollo de equipos',
    srv3_f2: 'Mentoría cercana durante los primeros meses en Alemania',
    srv3_f3: 'Prevención activa de malentendidos cotidianos',
    srv3_btn: 'Más información',

    // 4 Pillars (Con J&N Palabras)
    pillars_tag: 'FILOSOFÍA JN PALABRAS',
    pillars_title_pre: 'Con ',
    pillars_title_gold: 'J&N Palabras',
    pillars_desc: 'Nuestros cuatro pilares fundamentales para liderar entre culturas y garantizar una integración plena.',
    p1_title: 'Visados y Migración',
    p1_desc: 'Nos ocupamos de todos los trámites burocráticos por usted: homologación (Anerkennung), procedimiento acelerado (§ 81a AufenthG) y gestión consular completa.',
    p2_title: 'Idioma',
    p2_desc: 'El idioma es la puerta de entrada a una vida laboral de éxito. Nos aseguramos de que nuestros trabajadores cualificados no solo estén preparados lingüísticamente antes de su llegada, sino que también les acompañamos tras su primer día de trabajo si es necesario, para optimizar su lenguaje cotidiano y técnico.',
    p3_title: 'Incorporación Intercultural',
    p3_desc: 'Para los trabajadores cualificados procedentes del extranjero es esencial comprender la cultura y los valores. Por eso les apoyamos durante todo el proceso de migración y también actuamos como mentores durante los primeros meses después de empezar a trabajar. Esto permite a cada especialista asentarse e integrarse en su nuevo entorno de la mejor manera posible.',
    p4_title: 'Nuestra Promesa',
    p4_desc: 'Estamos ahí para ayudarle antes y durante todo el proceso y más allá. Póngase en contacto con nosotros y haremos todo lo posible -en la medida en que el marco burocrático lo permita- para encontrar la mejor solución para todas las partes implicadas.',
    pillars_cta: 'Consulta Estratégica Gratuita',

    // About & Founders Section
    about_tag: 'SOBRE NOSOTROS',
    about_title_pre: 'Liderar entre culturas: ',
    about_title_gold: 'su aliado estratégico en Alemania',
    about_highlight: '"Una integración con éxito y el desarrollo profesional y personal de especialistas altamente cualificados es nuestra prioridad."',
    about_desc: 'Nuestros candidatos deben alcanzar calidad de vida sin perder su identidad. Al mismo tiempo, tendemos un puente sólido entre empleador y empleado para evitar malentendidos interculturales y establecer relaciones laborales duraderas. Nos consideramos mediadores entre personas, países, lenguas y culturas.',
    about_quote: '98% de nuestros candidatos se integran exitosamente en el sistema de salud alemán durante su primer año.',
    founders_title_pre: 'Equipo ',
    founders_title_gold: 'Directivo en Heidelberg',
    founders_subtitle: 'Profesionales comprometidos con la conexión humana y el rigor técnico en Alemania.',
    founder1_name: 'José Wiechens',
    founder1_role: 'Cofundador · Dirección de Relaciones Internacionales y Candidatos',
    founder1_desc: 'Lidera la captación global, el asesoramiento personalizado y el acompañamiento humano a médicos y enfermeros en homologaciones sanitarias y adaptación consular.',
    founder1_btn: 'Concierte una cita con José',
    founder2_name: 'Niels Matthiessen',
    founder2_role: 'Cofundador · Dirección de Alianzas Corporativas y Relaciones B2B',
    founder2_desc: 'Lidera los convenios institucionales con hospitales, clínicas y entidades públicas en Alemania, coordinando los programas de onboarding y retención laboral.',
    founder2_btn: 'Concierte una cita con Niels',

    // Process Section (4 Steps)
    process_title_pre: 'Nuestro Programa de ',
    process_title_span: '4 Pasos',
    process_desc: 'Un acompañamiento integral diseñado específicamente para médicos y enfermeros internacionales.',
    step1_title: 'Visa y Migración',
    step1_desc: 'Gestionamos la homologación de tu título (Anerkennung), trámites consulares y el visado de trabajo.',
    step2_title: 'Idioma Alemán',
    step2_desc: 'Capacitación intensiva orientada al sector salud, preparándote para la Fachsprachenprüfung (FSP).',
    step3_title: 'Interculturalidad',
    step3_desc: 'Coaching de adaptación para que tu integración al equipo de trabajo alemán sea natural.',
    step4_title: 'Vida en Alemania',
    step4_desc: 'Acompañamiento en la búsqueda de vivienda, empadronamiento, seguros y cuentas bancarias.',

    // Dual Paths
    dual_tag: 'PERSPECTIVAS MUTUAS',
    dual_title_pre: 'Creamos perspectivas ',
    dual_title_gold: 'juntos',
    dual_b2b_tag: 'PARA EMPRESAS Y HOSPITALES',
    dual_b2b_title: '¿Busca incorporar personal sanitario cualificado?',
    dual_b2b_desc: 'Optimice sus procesos de contratación internacional con soporte integral en visados acelerados, idiomas y acompañamiento intercultural in situ.',
    dual_b2b_btn: '🏥 Solicitar Personal B2B',
    dual_cand_tag: 'PARA ESPECIALISTAS Y PROFESIONALES',
    dual_cand_title: '¿Deseas ejercer tu profesión médica en Alemania?',
    dual_cand_desc: 'Te acompañamos con un plan individualizado: homologación de título, aprendizaje del idioma alemán, contrato laboral indefinido y mentoría en Alemania.',
    dual_cand_btn: '💼 Realizar Test de Elegibilidad (3 min)',

    // CTA Banner
    cta_title: 'Empiece hoy mismo: elaboraremos un plan juntos',
    cta_desc: 'Descubra cómo podemos apoyar a su institución o impulsar su carrera en Alemania.',
    cta_btn: 'Agendar Consulta Estratégica Gratuita',

    // Contact Section
    contact_title_pre: 'Póngase en contacto con ',
    contact_title_span: 'nosotros',
    contact_desc: 'Nuestro equipo en Heidelberg está listo para resolver sus dudas. También puede utilizar nuestro formulario o reservar una cita directa.',
    contact_hq_title: 'Sede Principal',
    contact_hq_val: 'Heidelberg, Baden-Württemberg, Alemania',
    contact_email_title: 'Correo Electrónico',
    contact_tel_title: 'Teléfono',
    contact_meeting_title: 'Reunión Estratégica',
    contact_meeting_val: 'Videollamada con nuestros directores',
    form_name_label: 'Nombre Completo',
    form_name_ph: 'Ej. Dra. María Pérez',
    form_email_label: 'Correo Electrónico',
    form_email_ph: 'correo@ejemplo.com',
    form_subject_label: 'Motivo de Consulta',
    form_opt_candidate: 'Soy candidato (Quiero trabajar en Alemania)',
    form_opt_hospital: 'Soy empresa / Hospital buscando talento',
    form_opt_other: 'Otra consulta o alianza',
    form_msg_label: 'Mensaje o Pregunta',
    form_msg_ph: 'Cuéntenos sobre su situación, especialidad o necesidad de personal...',
    form_btn_submit: 'Enviar Mensaje',

    // Footer
    footer_desc: 'JN PALABRAS Consulting – Liderar a través de las culturas. Su aliado estratégico para la captación, homologación e integración socio-laboral en Alemania.',
    footer_cand_title: 'Candidatos',
    footer_test: 'Test de Elegibilidad',
    footer_process: 'Nuestro Proceso',
    footer_portal: 'Portal de Candidato',
    footer_emp_title: 'Empresas & Clínicas',
    footer_b2b_funnel: 'Solicitar Personal (B2B)',
    footer_about: 'Sobre Nosotros',
    footer_contact: 'Contacto',
    footer_privacy: 'Normativa sobre protección de datos',
    footer_impressum: 'Pie de imprenta (Impressum)',
    footer_agb: 'GTC / Términos',
    footer_rights: '2020 – 2026 | JN PALABRAS Consulting · Heidelberg, Alemania. Todos los derechos reservados.',
    footer_cookies: 'Cookies',

    // Login Screen
    login_brand_subtitle: 'Heidelberg · Alemania',
    login_brand_title: 'Gestión de Talento',
    login_title: 'Bienvenido a la Plataforma',
    login_email: 'Correo electrónico',
    login_email_ph: 'correo@ejemplo.com',
    login_pass: 'Contraseña',
    login_btn: 'Iniciar Sesión',
    login_new_cand: '¿Eres candidato nuevo?',
    login_test_link: 'Realiza el test de elegibilidad',

    // GDPR Banner
    gdpr_text: '🍪 Utilizamos cookies y datos de sesión para gestionar tu experiencia en la plataforma. Tus datos médicos se almacenan en servidores seguros dentro de la UE y son tratados conforme al RGPD / DSGVO. JN Palabras – Heidelberg, Alemania.',
    gdpr_btn_necessary: 'Solo necesarias',
    gdpr_btn_all: 'Aceptar todo',

    // Toast & Alerts
    lang_changed: 'Idioma cambiado a Español'
  },

  de: {
    // Brand & Header
    brand_sub: 'Heidelberg · Deutschland',
    brand_title: 'Leading Across Cultures',
    brand_tagline: 'Leading Across Cultures',

    // Navigation
    nav_home: 'Home',
    nav_services: 'Leistungen',
    nav_pillars: 'Mit J&N Palabras',
    nav_about: 'Über uns',
    nav_process: 'Unser Prozess',
    nav_contact: 'Kontakt',
    nav_b2b: '🏥 Für Kliniken (B2B)',
    nav_candidates: '💼 Für Fachkräfte',
    nav_login: 'Anmelden',
    nav_strategic_call: 'Strategiegespräch',
    nav_for_professionals: 'Für Fachkräfte',
    nav_for_companies: 'Für Unternehmen',
    nav_apply_now: 'Jetzt Bewerben',
    nav_prof_process: 'Ablauf & Anerkennung (§ 81a)',
    nav_prof_stellenportal: 'Stellenportal (Jobportal)',
    nav_prof_pillars: '360° Begleitung',
    nav_prof_about: 'Über uns',
    nav_prof_test: 'Eignungstest',
    nav_emp_services: 'Lösungen & Leistungen',
    nav_emp_request: 'Personal anfragen (B2B)',
    nav_emp_meeting: 'Strategiegespräch',
    nav_emp_contact: 'Direktkontakt',

    // Stellenportal Section
    stellenportal_badge: 'STELLENPORTAL · MEDIZINISCHE JOBS IN DEUTSCHLAND',
    stellenportal_title: 'Offene Stellenangebote in Deutschland',
    stellenportal_subtitle: 'Finde Deinen Job, der am besten zu Dir passt. Offizielle Positionen in Kliniken, Krankenhäusern und Pflegeeinrichtungen.',
    stellenportal_search_ph: 'Nach Position, Fachbereich, Klinik oder Ort suchen...',
    stellenportal_filter_all: 'Alle Stellen',
    stellenportal_filter_med: 'Medizin / Ärzte',
    stellenportal_filter_nurse: 'Pflegekräfte',
    stellenportal_filter_ota: 'OP / OTA',
    stellenportal_filter_assist: 'Pflegeassistenz',
    stellenportal_btn_details: 'Mehr Informationen',
    stellenportal_btn_apply: 'Jetzt bewerben',

    // Hero Section
    hero_badge: 'PALABRAS ONBOARDING · HEIDELBERG, DEUTSCHLAND',
    hero_title_pre: 'PALABRAS ONBOARDING für eine ',
    hero_title_gold: 'nachhaltige Gewinnung und Integration',
    hero_title_post: ' von Fachkräften',
    hero_desc: 'Wir erleichtern die Verbindung zwischen Unternehmen, Kliniken und qualifizierten Fachkräften aus der ganzen Welt, um den geschäftlichen und persönlichen Erfolg voranzutreiben.',
    hero_btn_strategic: 'Kostenloses Strategiegespräch',
    hero_btn_candidate: 'Eignungstest für Fachkräfte',
    hero_btn_hospital: '🏥 Fachkräfte für Kliniken anfordern',
    hero_stat_retention: '98 % Haltequote',
    hero_stat_retention_sub: 'Erfolgreich im 1. Jahr integriert',
    hero_stat_visa: '§ 81a AufenthG',
    hero_stat_visa_sub: 'Beschleunigtes Verfahren',
    hero_stat_location: 'Heidelberg',
    hero_stat_location_sub: 'Baden-Württemberg, Deutschland',

    // Core Services Section
    services_tag: 'UNSERE LÖSUNGEN',
    services_title_pre: 'Mit unserer Expertise ',
    services_title_gold: 'bieten wir Lösungen für Ihr Unternehmen',
    services_desc: 'Wir decken den gesamten Zyklus ab: von der gezielten Rekrutierung und Sprachausbildung bis zur nachhaltigen betrieblichen und menschlichen Integration in Deutschland.',
    srv1_tag: 'ETHISCHES REKRUTIEREN',
    srv1_title: 'Fachkräfte-Rekrutierung & Vermittlung',
    srv1_desc: 'Wir verbinden deutsche Kliniken und Unternehmen mit internationalen Ärzten, Pflegefachkräften und Experten nach strengsten Qualitäts- und Anerkennungsstandards.',
    srv1_f1: 'Geprüfte Kandidaten mit anerkennungsfähigen Abschlüssen',
    srv1_f2: 'Begleitung des gesamten Interview- und Auswahlprozesses',
    srv1_f3: 'Erwartungsabgleich zwischen Arbeitgeber und Fachkraft',
    srv1_btn: 'Erfahren Sie mehr',
    srv2_tag: 'BERUFSBEZOGENE SPRACHE',
    srv2_title: 'Sprachtraining (Deutsch)',
    srv2_desc: 'Lernen Sie Deutsch mit erfahrenen und qualifizierten Trainern. Kurse A1 bis B2/C1, Fachsprache Medizin und zielgerichtete Vorbereitung auf die Fachsprachenprüfung (FSP).',
    srv2_f1: 'Flexible Kurse angepasst an Dienst- und Arbeitszeiten',
    srv2_f2: 'Medizinische Fachsprache & gezielte FSP-Prüfungsvorbereitung',
    srv2_f3: 'Sprachbegleitung nach Arbeitsbeginn zur Praxissicherung',
    srv2_btn: 'Erfahren Sie mehr',
    srv3_tag: 'NACHHALTIGE INTEGRATION',
    srv3_title: 'Onboarding & Interkulturelle Kommunikation',
    srv3_desc: 'Unser Programm fördert ein integratives Arbeitsumfeld. Wir bereiten Teams und Fachkräfte aufeinander vor und geben ihnen die Werkzeuge für ein harmonisches Miteinander.',
    srv3_f1: 'Interkulturelle Sensibilisierung & Personalentwicklung',
    srv3_f2: 'Persönliche Mentorenbegleitung in den ersten Monaten',
    srv3_f3: 'Aktive Vermeidung interkultureller Missverständnisse',
    srv3_btn: 'Erfahren Sie mehr',

    // 4 Pillars (Con J&N Palabras)
    pillars_tag: 'JN PALABRAS PHILOSOPHIE',
    pillars_title_pre: 'Mit ',
    pillars_title_gold: 'J&N Palabras',
    pillars_desc: 'Unsere vier Säulen für erfolgreiche interkulturelle Zusammenarbeit und langfristige Bindung.',
    p1_title: 'Visum & Migration',
    p1_desc: 'Wir übernehmen sämtliche bürokratische Angelegenheiten für Sie: Anerkennungsverfahren, beschleunigtes Fachkräfteverfahren (§ 81a AufenthG) und konsularische Begleitung.',
    p2_title: 'Sprache',
    p2_desc: 'Sprache ist der Türöffner in einen erfolgreichen Arbeitsalltag. Wir stellen sicher, dass unsere Fachkräfte nicht nur vor der Einreise sprachlich vorbereitet sind, sondern begleiten diese auf Wunsch auch nach Beginn ihres ersten Arbeitstages, um Alltags- und Fachsprache zu optimieren.',
    p3_title: 'Interkulturelles Onboarding',
    p3_desc: 'Für Fachkräfte aus dem Ausland ist es unabdingbar, Kultur und Werte zu verstehen. Daher begleiten wir diese während des gesamten Migrationsprozesses und stehen ihnen auch nach Arbeitsbeginn in den ersten Monaten als Mentoren zur Seite. So kann sich jede einzelne Fachkraft bestmöglich im neuen Umfeld einleben und integrieren.',
    p4_title: 'Unser Versprechen!',
    p4_desc: 'Wir sind vor sowie während des gesamten Prozesses und darüber hinaus für Sie da, um Ihnen zu helfen. Sprechen Sie uns an und wir tun alles -sofern es der bürokratische Rahmen zulässt- um für alle Beteiligte die beste Lösung zu finden.',
    pillars_cta: 'Kostenloses Strategiegespräch',

    // About & Founders Section
    about_tag: 'ÜBER UNS',
    about_title_pre: 'Liderar entre culturas: ',
    about_title_gold: 'Ihr Partner für nachhaltigen Erfolg',
    about_highlight: '"Eine erfolgreiche Integration, die berufliche und persönliche Weiterentwicklung von Fachkräften liegt uns am Herzen."',
    about_desc: 'Unsere Kandidaten sollen Lebensqualität erreichen, ohne ihre Identität zu verleugnen. Gleichzeitig schlagen wir eine Brücke zwischen Arbeitgeber und Arbeitnehmer, um interkulturelle Missverständnisse zu vermeiden und ein langfristiges Beschäftigungsverhältnis aufzubauen. Wir verstehen uns als Vermittler zwischen Menschen, Ländern, Sprachen und Kulturen.',
    about_quote: '98 % unserer Kandidaten integrieren sich im ersten Jahr erfolgreich in das deutsche Gesundheitssystem.',
    founders_title_pre: 'Unser ',
    founders_title_gold: 'Führungsteam in Heidelberg',
    founders_subtitle: 'Gemeinsam schaffen wir Perspektiven mit Menschlichkeit, Professionalität und Verlässlichkeit.',
    founder1_name: 'José Wiechens',
    founder1_role: 'Mitgründer · Internationale Beziehungen & Kandidatenbetreuung',
    founder1_desc: 'Verantwortet die internationale Talentgewinnung, Anerkennungsbegleitung und die individuelle Betreuung ausländischer Mediziner und Pflegekräfte.',
    founder1_btn: 'Termin mit José vereinbaren',
    founder2_name: 'Niels Matthiessen',
    founder2_role: 'Mitgründer · Unternehmenskontakte & B2B-Partnerschaften',
    founder2_desc: 'Verantwortet Kooperationen mit Kliniken, Trägern und Pflegeeinrichtungen in Deutschland sowie die strategische Onboarding- und Integrationsberatung.',
    founder2_btn: 'Termin mit Niels vereinbaren',

    // Process Section (4 Steps)
    process_title_pre: 'Unser Programm in ',
    process_title_span: '4 Schritten',
    process_desc: 'Ganzheitliche Begleitung, speziell für internationale Ärzte und Pflegefachkräfte konzipiert.',
    step1_title: 'Visum & Migration',
    step1_desc: 'Wir koordinieren das Anerkennungsverfahren (Anerkennung), Konsularschritte und das Arbeitsvisum (§ 81a / § 16d).',
    step2_title: 'Deutsche Sprache',
    step2_desc: 'Intensivsprachkurse für den Gesundheitsbereich mit gezielter Vorbereitung auf die Fachsprachenprüfung (FSP).',
    step3_title: 'Interkulturalität',
    step3_desc: 'Integrationscoaching für einen natürlichen und harmonischen Einstieg in deutsche Klinik- und Pflegeteams.',
    step4_title: 'Leben in Deutschland',
    step4_desc: 'Begleitung bei Wohnungssuche, behördlicher Anmeldung, Krankenversicherung und Bankkontoeröffnung.',

    // Dual Paths
    dual_tag: 'GEMEINSAME PERSPEKTIVEN',
    dual_title_pre: 'Zusammen Perspektiven ',
    dual_title_gold: 'schaffen',
    dual_b2b_tag: 'FÜR UNTERNEHMEN & KLINIKEN',
    dual_b2b_title: 'Suchen Sie qualifiziertes medizinisches Personal?',
    dual_b2b_desc: 'Begegnen Sie dem Fachkräftemangel mit verlässlichen Fachkräften, beschleunigten Visaverfahren und einer nachhaltigen Haltequote von über 98 %.',
    dual_b2b_btn: '🏥 Personalbedarf melden (B2B)',
    dual_cand_tag: 'FÜR INTERNATIONALE FACHKRÄFTE',
    dual_cand_title: 'Möchten Sie als Arzt oder Pflegekraft in Deutschland arbeiten?',
    dual_cand_desc: 'Wir begleiten Sie Schritt für Schritt: Approbation/Anerkennung, Sprachförderung, unbefristeter Arbeitsvertrag und persönliches Mentoring vor Ort.',
    dual_cand_btn: '💼 Eignungstest starten (3 Min.)',

    // CTA Banner
    cta_title: 'Starten Sie noch heute: Wir erstellen gemeinsam Ihren Plan',
    cta_desc: 'Erfahren Sie im kostenfreien Gespräch, wie wir Ihre Klinik unterstützen oder Ihren Karrierestart sichern können.',
    cta_btn: 'Kostenfreies Strategiegespräch vereinbaren',

    // Contact Section
    contact_title_pre: 'Sie erreichen uns auch über unser ',
    contact_title_span: 'Kontaktformular',
    contact_desc: 'Unser Team in Heidelberg steht bereit, Ihre Fragen zu beantworten. Sprechen Sie uns an oder buchen Sie direkt ein Kennenlerngespräch.',
    contact_hq_title: 'Hauptsitz',
    contact_hq_val: 'Heidelberg, Baden-Württemberg, Deutschland',
    contact_email_title: 'E-Mail',
    contact_tel_title: 'Telefon',
    contact_meeting_title: 'Strategiegespräch',
    contact_meeting_val: 'Online-Videomeeting mit unserer Leitung',
    form_name_label: 'Vollständiger Name',
    form_name_ph: 'Z. B. Dr. Maria Schmidt',
    form_email_label: 'E-Mail-Adresse',
    form_email_ph: 'name@beispiel.de',
    form_subject_label: 'Anliegen',
    form_opt_candidate: 'Ich möchte in Deutschland arbeiten (Fachkraft)',
    form_opt_hospital: 'Klinik / Unternehmen sucht Fachkräfte',
    form_opt_other: 'Sonstige Anfrage / Kooperation',
    form_msg_label: 'Ihre Nachricht oder Frage',
    form_msg_ph: 'Beschreiben Sie kurz Ihre Situation, Fachrichtung oder Personalbedarf...',
    form_btn_submit: 'Nachricht senden',

    // Footer
    footer_desc: 'JN PALABRAS Consulting – Liderar a través de las culturas. Ihr strategischer Partner für Rekrutierung, Anerkennung und nachhaltige Integration im deutschen Gesundheitswesen.',
    footer_cand_title: 'Kandidaten',
    footer_test: 'Eignungstest',
    footer_process: 'Unser Prozess',
    footer_portal: 'Kandidatenportal',
    footer_emp_title: 'Kliniken & Träger',
    footer_b2b_funnel: 'Personalbedarf melden (B2B)',
    footer_about: 'Über uns',
    footer_contact: 'Kontakt',
    footer_privacy: 'Datenschutzbestimmungen',
    footer_impressum: 'Impressum',
    footer_agb: 'AGB',
    footer_rights: '2020 – 2026 | JN PALABRAS Consulting · Heidelberg, Deutschland. Alle Rechte vorbehalten.',
    footer_cookies: 'Cookies',

    // Login Screen
    login_brand_subtitle: 'Heidelberg · Deutschland',
    login_brand_title: 'Talentmanagement',
    login_title: 'Willkommen auf der Plattform',
    login_email: 'E-Mail-Adresse',
    login_email_ph: 'name@beispiel.de',
    login_pass: 'Passwort',
    login_btn: 'Anmelden',
    login_new_cand: 'Sind Sie neu hier?',
    login_test_link: 'Machen Sie den Eignungstest',

    // GDPR Banner
    gdpr_text: '🍪 Wir verwenden Cookies und Sitzungsdaten, um Ihre Erfahrung zu optimieren. Ihre medizinischen Daten werden sicher auf Servern innerhalb der EU gemäß DSGVO verarbeitet. JN Palabras – Heidelberg, Deutschland.',
    gdpr_btn_necessary: 'Nur notwendige',
    gdpr_btn_all: 'Alle akzeptieren',

    // Toast & Alerts
    lang_changed: 'Sprache geändert auf Deutsch'
  }
};

class I18nManager {
  constructor() {
    this.supportedLanguages = ['es', 'de'];
    this.currentLang = this.detectInitialLanguage();
    this.initEventListeners();
  }

  detectInitialLanguage() {
    try {
      const stored = localStorage.getItem('jnp_lang');
      if (stored && this.supportedLanguages.includes(stored)) {
        return stored;
      }
      const browser = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
      if (this.supportedLanguages.includes(browser)) {
        return browser;
      }
    } catch (e) {}
    return 'es'; // Predeterminado
  }

  t(key, lang = null) {
    const l = lang || this.currentLang || 'es';
    const dict = I18N_TRANSLATIONS[l] || I18N_TRANSLATIONS['es'];
    return dict[key] || I18N_TRANSLATIONS['es'][key] || key;
  }

  setLanguage(lang, silent = false) {
    if (!this.supportedLanguages.includes(lang)) return;
    this.currentLang = lang;
    try {
      localStorage.setItem('jnp_lang', lang);
    } catch (e) {}

    document.documentElement.lang = lang;
    this.applyTranslationsToDOM();
    this.updateLanguageSwitchers();

    if (!silent && typeof showToast === 'function') {
      showToast('🌍 Language / Idioma', this.t('lang_changed'), 'info', 2500);
    }

    // Disparar evento personalizado para componentes dinámicos
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  applyTranslationsToDOM() {
    // Textos directos
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (val) {
        el.innerHTML = val;
      }
    });

    // Placeholders
    const inputs = document.querySelectorAll('[data-i18n-placeholder]');
    inputs.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = this.t(key);
      if (val) {
        el.setAttribute('placeholder', val);
      }
    });
  }

  updateLanguageSwitchers() {
    // 1. Actualizar códigos en triggers del dropdown (ES, DE, EN, PT)
    const codeElements = document.querySelectorAll('.lang-trigger-code');
    codeElements.forEach(el => {
      el.textContent = this.currentLang.toUpperCase();
    });

    // 2. Actualizar ítems activos en los menús desplegables
    const dropdownItems = document.querySelectorAll('.lang-dropdown-item');
    dropdownItems.forEach(item => {
      const lang = item.getAttribute('data-lang');
      if (lang === this.currentLang) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      }
    });

    // 3. Compatibilidad con botones .lang-btn si existen
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      if (lang === this.currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  toggleDropdown(event, targetId = null) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const dropdown = targetId 
      ? document.getElementById(targetId)
      : (event && event.target ? event.target.closest('.lang-dropdown') : document.querySelector('.lang-dropdown'));

    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('open');
    // Cerrar cualquier otro dropdown abierto
    document.querySelectorAll('.lang-dropdown.open').forEach(d => {
      if (d !== dropdown) d.classList.remove('open');
    });

    if (isOpen) {
      dropdown.classList.remove('open');
      const btn = dropdown.querySelector('.lang-dropdown-trigger');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    } else {
      dropdown.classList.add('open');
      const btn = dropdown.querySelector('.lang-dropdown-trigger');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }
  }

  closeDropdown() {
    document.querySelectorAll('.lang-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
      const btn = dropdown.querySelector('.lang-dropdown-trigger');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  initEventListeners() {
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lang-dropdown')) {
        this.closeDropdown();
      }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDropdown();
      }
    });
  }

  renderLanguageSwitcherHTML(extraClass = '') {
    return `
      <div class="lang-dropdown ${extraClass}" role="group" aria-label="Selector de idioma">
        <button type="button" class="lang-dropdown-trigger" onclick="i18n.toggleDropdown(event)" aria-haspopup="true" aria-expanded="false" title="Cambiar idioma">
          <span class="lang-trigger-code">${this.currentLang.toUpperCase()}</span>
          <span class="lang-trigger-arrow">▾</span>
        </button>
        <div class="lang-dropdown-menu" role="menu">
          <button type="button" class="lang-dropdown-item ${this.currentLang==='de'?'active':''}" data-lang="de" onclick="i18n.setLanguage('de'); i18n.closeDropdown();" role="menuitem">
            <span class="lang-item-name">Deutsch</span>
            <span class="lang-item-check">✓</span>
          </button>
          <button type="button" class="lang-dropdown-item ${this.currentLang==='es'?'active':''}" data-lang="es" onclick="i18n.setLanguage('es'); i18n.closeDropdown();" role="menuitem">
            <span class="lang-item-name">Español</span>
            <span class="lang-item-check">✓</span>
          </button>
        </div>
      </div>
    `;
  }
}

// Inicializar instancia global
const i18n = new I18nManager();
window.i18n = i18n;

// Aplicar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  i18n.applyTranslationsToDOM();
  i18n.updateLanguageSwitchers();
});

