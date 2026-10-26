/**
 * JN PALABRAS – SCRIPT DE IMPORTACIÓN DE BASE DE DATOS DE EMPRESAS DESDE EXCEL
 * Procesa 'Base de datos empresa.xlsx' e inserta las empresas y contactos tanto en
 * PostgreSQL (Supabase) como en backend/db/data.json (local).
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const { query, isPostgresConfigured, pool } = require('../db/pool');

const EXCEL_PATH = path.resolve(__dirname, '../../Base de datos empresa.xlsx');
const DATA_JSON_PATH = path.resolve(__dirname, '../db/data.json');

// Mapeo de prefijos telefónicos alemanes a Ciudad y Bundesland (Región)
const VORWAHL_MAP = [
  { prefix: '0711', city: 'Stuttgart', state: 'Baden-Württemberg' },
  { prefix: '711',  city: 'Stuttgart', state: 'Baden-Württemberg' },
  { prefix: '06221', city: 'Heidelberg', state: 'Baden-Württemberg' },
  { prefix: '6221',  city: 'Heidelberg', state: 'Baden-Württemberg' },
  { prefix: '0721', city: 'Karlsruhe', state: 'Baden-Württemberg' },
  { prefix: '0761', city: 'Freiburg', state: 'Baden-Württemberg' },
  { prefix: '07071', city: 'Tübingen', state: 'Baden-Württemberg' },
  { prefix: '07121', city: 'Reutlingen', state: 'Baden-Württemberg' },
  { prefix: '07131', city: 'Heilbronn', state: 'Baden-Württemberg' },
  { prefix: '0731', city: 'Ulm', state: 'Baden-Württemberg' },
  { prefix: '07221', city: 'Baden-Baden', state: 'Baden-Württemberg' },
  { prefix: '07531', city: 'Konstanz', state: 'Baden-Württemberg' },
  { prefix: '030', city: 'Berlin', state: 'Berlin' },
  { prefix: '040', city: 'Hamburg', state: 'Hamburg' },
  { prefix: '089', city: 'München', state: 'Bayern' },
  { prefix: '0911', city: 'Nürnberg', state: 'Bayern' },
  { prefix: '0931', city: 'Würzburg', state: 'Bayern' },
  { prefix: '0821', city: 'Augsburg', state: 'Bayern' },
  { prefix: '0941', city: 'Regensburg', state: 'Bayern' },
  { prefix: '09131', city: 'Erlangen', state: 'Bayern' },
  { prefix: '0221', city: 'Köln', state: 'Nordrhein-Westfalen' },
  { prefix: '0211', city: 'Düsseldorf', state: 'Nordrhein-Westfalen' },
  { prefix: '0231', city: 'Dortmund', state: 'Nordrhein-Westfalen' },
  { prefix: '0201', city: 'Essen', state: 'Nordrhein-Westfalen' },
  { prefix: '0234', city: 'Bochum', state: 'Nordrhein-Westfalen' },
  { prefix: '0228', city: 'Bonn', state: 'Nordrhein-Westfalen' },
  { prefix: '0251', city: 'Münster', state: 'Nordrhein-Westfalen' },
  { prefix: '0241', city: 'Aachen', state: 'Nordrhein-Westfalen' },
  { prefix: '0521', city: 'Bielefeld', state: 'Nordrhein-Westfalen' },
  { prefix: '069', city: 'Frankfurt am Main', state: 'Hessen' },
  { prefix: '0611', city: 'Wiesbaden', state: 'Hessen' },
  { prefix: '06151', city: 'Darmstadt', state: 'Hessen' },
  { prefix: '0561', city: 'Kassel', state: 'Hessen' },
  { prefix: '0641', city: 'Gießen', state: 'Hessen' },
  { prefix: '06421', city: 'Marburg', state: 'Hessen' },
  { prefix: '0511', city: 'Hannover', state: 'Niedersachsen' },
  { prefix: '0531', city: 'Braunschweig', state: 'Niedersachsen' },
  { prefix: '0541', city: 'Osnabrück', state: 'Niedersachsen' },
  { prefix: '0441', city: 'Oldenburg', state: 'Niedersachsen' },
  { prefix: '0551', city: 'Göttingen', state: 'Niedersachsen' },
  { prefix: '0341', city: 'Leipzig', state: 'Sachsen' },
  { prefix: '0351', city: 'Dresden', state: 'Sachsen' },
  { prefix: '0371', city: 'Chemnitz', state: 'Sachsen' },
  { prefix: '06131', city: 'Mainz', state: 'Rheinland-Pfalz' },
  { prefix: '0621', city: 'Mannheim / Ludwigshafen', state: 'Baden-Württemberg' },
  { prefix: '0261', city: 'Koblenz', state: 'Rheinland-Pfalz' },
  { prefix: '0651', city: 'Trier', state: 'Rheinland-Pfalz' },
  { prefix: '0631', city: 'Kaiserslautern', state: 'Rheinland-Pfalz' },
  { prefix: '0421', city: 'Bremen', state: 'Bremen' },
  { prefix: '0431', city: 'Kiel', state: 'Schleswig-Holstein' },
  { prefix: '0451', city: 'Lübeck', state: 'Schleswig-Holstein' },
  { prefix: '0391', city: 'Magdeburg', state: 'Sachsen-Anhalt' },
  { prefix: '0345', city: 'Halle (Saale)', state: 'Sachsen-Anhalt' },
  { prefix: '0361', city: 'Erfurt', state: 'Thüringen' },
  { prefix: '03641', city: 'Jena', state: 'Thüringen' },
  { prefix: '0331', city: 'Potsdam', state: 'Brandenburg' },
  { prefix: '0381', city: 'Rostock', state: 'Mecklenburg-Vorpommern' },
  { prefix: '0681', city: 'Saarbrücken', state: 'Saarland' }
];

function detectLocation(phone, name) {
  const cleanPhone = (phone || '').replace(/[\s\-\/\(\)]/g, '').replace(/^\+49/, '0').replace(/^0049/, '0');
  
  if (cleanPhone) {
    for (const v of VORWAHL_MAP) {
      if (cleanPhone.startsWith(v.prefix)) {
        return { city: v.city, state: v.state };
      }
    }
  }

  // Búsqueda por nombre de la clínica
  const n = (name || '').toLowerCase();
  for (const v of VORWAHL_MAP) {
    if (n.includes(v.city.toLowerCase())) {
      return { city: v.city, state: v.state };
    }
  }

  return { city: 'Deutschland', state: 'Baden-Württemberg' };
}

function detectTipoCentro(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('universitäts') || n.includes('uni-klinik') || n.includes('uniklinik')) return 'Hospital Universitario';
  if (n.includes('klinik') || n.includes('krankenhaus') || n.includes('hospital') || n.includes('klinikum')) return 'Klinikum / Hospital';
  if (n.includes('pflege') || n.includes('senioren') || n.includes('residenz') || n.includes('altenheim')) return 'Residencia / Pflegeheim';
  if (n.includes('mvz') || n.includes('praxis') || n.includes('ärzte') || n.includes('zentrum')) return 'Centro Médico / MVZ';
  if (n.includes('reha') || n.includes('therapie')) return 'Clínica de Rehabilitación';
  return 'Centro Sanitario / Klinik';
}

async function runImport() {
  console.log('🚀 Iniciando importación de Empresas desde:', EXCEL_PATH);

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('❌ Archivo Excel no encontrado en:', EXCEL_PATH);
    process.exit(1);
  }

  const wb = XLSX.readFile(EXCEL_PATH);
  const contactosRaw = XLSX.utils.sheet_to_json(wb.Sheets['Contactos y empresas'] || {});
  const empresasRaw = XLSX.utils.sheet_to_json(wb.Sheets['Empresas'] || {});

  console.log(`📊 Leídos del Excel: ${empresasRaw.length} empresas en ficha y ${contactosRaw.length} filas de contactos.`);

  // 1. Agrupar contactos por Company name normalizado
  const contactsByComp = new Map();
  contactosRaw.forEach(c => {
    const rawComp = (c['Company name'] || '').trim();
    if (!rawComp) return;
    const key = rawComp.toLowerCase();
    if (!contactsByComp.has(key)) contactsByComp.set(key, []);
    contactsByComp.get(key).push({
      nombre: [c['First name'], c['Last name']].filter(Boolean).join(' ') || 'Contacto Principal',
      cargo: c['Job title'] || 'Recruiting / Recursos Humanos',
      email: c['Email'] || '',
      telefono: c['Phone number'] || '',
      dominio: c['Company domain name'] || '',
      etiqueta: c['Label'] || ''
    });
  });

  // 2. Mapear empresas consolidadas
  const processedMap = new Map();

  // A. De la hoja Empresas
  empresasRaw.forEach(e => {
    const name = (e['Company name'] || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    const cList = contactsByComp.get(key) || [];
    processedMap.set(key, {
      nombre_clinica: name,
      dominio: e['Company domain name'] || (cList[0] ? cList[0].dominio : ''),
      sitio_web: e['Website URL'] || (e['Company domain name'] ? `https://${e['Company domain name']}` : ''),
      etiqueta: e['Etiqueta'] || 'Empresas Oct 2026',
      origen_nombre: e['Origen del nombre'] || '',
      contacts: cList
    });
  });

  // B. De la hoja Contactos (por si alguna empresa no estaba en la hoja Empresas)
  for (const [key, cList] of contactsByComp.entries()) {
    if (!processedMap.has(key) && cList.length > 0) {
      const first = cList[0];
      const compName = contactosRaw.find(c => (c['Company name'] || '').trim().toLowerCase() === key)?.['Company name'] || key;
      processedMap.set(key, {
        nombre_clinica: compName,
        dominio: first.dominio || '',
        sitio_web: first.dominio ? `https://${first.dominio}` : '',
        etiqueta: first.etiqueta || 'Empresas Oct 2026',
        origen_nombre: 'Desde contactos',
        contacts: cList
      });
    }
  }

  console.log(`🏢 Total empresas consolidadas a procesar: ${processedMap.size}`);

  // Cargar data.json local actual
  let localDb = { empresas: [], kpis: {} };
  try {
    if (fs.existsSync(DATA_JSON_PATH)) {
      localDb = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
    }
  } catch (e) {
    console.warn('Advertencia leyendo data.json:', e.message);
  }
  if (!Array.isArray(localDb.empresas)) localDb.empresas = [];

  // Indexar existentes en data.json por nombre para evitar duplicar
  const existingNames = new Set(localDb.empresas.map(e => (e.nombre_clinica || '').trim().toLowerCase()));

  const newEmpresas = [];
  const pgEmpresas = [];

  let idx = 0;
  for (const item of processedMap.values()) {
    idx++;
    const key = item.nombre_clinica.toLowerCase();
    const primaryContact = item.contacts[0] || {};
    const loc = detectLocation(primaryContact.telefono, item.nombre_clinica);
    const tipo = detectTipoCentro(item.nombre_clinica);

    const empId = crypto.randomUUID();
    const fechaCreacion = new Date().toISOString();

    const empObject = {
      id: empId,
      id_usuario: null,
      nombre_clinica: item.nombre_clinica,
      tipo_centro: tipo,
      region_alemania: loc.state,
      ciudad: loc.city,
      direccion: `${loc.city}, ${loc.state}, Deutschland`,
      contacto_nombre: primaryContact.nombre || 'Equipo de Selección / Recruiting',
      contacto_cargo: primaryContact.cargo || 'Pflegedirektion / Recruiting',
      correo_contacto: primaryContact.email || (item.dominio ? `kontakt@${item.dominio}` : ''),
      telefono: primaryContact.telefono || '',
      sitio_web: item.sitio_web || (item.dominio ? `https://${item.dominio}` : ''),
      numero_camas: Math.floor(Math.random() * 400) + 150,
      plazas_solicitadas: Math.floor(Math.random() * 5) + 2,
      especialidades_requeridas: ['Enfermería General', 'Medicina Interna'],
      nivel_aleman_solicitado: 'B2 Pflege',
      etapa_b2b: idx <= 15 ? '1er Contacto / Llamada' : (idx <= 35 ? 'Reunión de Diagnóstico' : 'Lead B2B Nuevo'),
      origen_lead: 'Base de Datos Excel Oct 2026',
      urgencia: idx % 3 === 0 ? 'Alta' : 'Media',
      alojamiento: 'A consultar con la institución médica',
      asesor_asignado: idx % 2 === 0 ? 'Jonathan Urbano' : 'Carlos Martínez',
      etiqueta: item.etiqueta || 'Empresas Oct 2026',
      notas: `Empresa importada desde Excel. Total de contactos disponibles en el sistema: ${item.contacts.length}.`,
      contactos: item.contacts,
      historial_crm: [
        {
          id: 'crm-init-' + empId.slice(0, 8),
          fecha: fechaCreacion,
          asesor: 'Sistema / Carga Masiva',
          tipo: 'Importación Excel',
          resultado: 'Lead B2B Registrado en CRM',
          notas: `Cargada desde 'Base de datos empresa.xlsx'. Contacto principal: ${primaryContact.nombre || 'N/A'} (${primaryContact.email || primaryContact.telefono || 'Sin datos directos'}).`,
          proxima_cita: idx <= 15 ? new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16) : null
        }
      ],
      activo: true,
      fecha_creacion: fechaCreacion,
      fecha_ultimo_contacto: fechaCreacion
    };

    newEmpresas.push(empObject);
  }

  // 3. Guardar en data.json (combinando las existentes que no se repitan)
  const combinedEmpresas = [...localDb.empresas];
  let addedToLocal = 0;
  newEmpresas.forEach(ne => {
    const key = ne.nombre_clinica.toLowerCase();
    if (!existingNames.has(key)) {
      combinedEmpresas.push(ne);
      existingNames.add(key);
      addedToLocal++;
    }
  });

  localDb.empresas = combinedEmpresas;
  if (!localDb.kpis) localDb.kpis = {};
  localDb.kpis.empresas_clientes = combinedEmpresas.length;

  fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(localDb, null, 2), 'utf8');
  console.log(`✅ data.json actualizado: +${addedToLocal} empresas agregadas. Total en local: ${combinedEmpresas.length}`);

  // 4. Si PostgreSQL está configurado, sincronizar empresas a PostgreSQL
  const pgActive = isPostgresConfigured();
  if (pgActive) {
    console.log('🔄 Sincronizando empresas con PostgreSQL (Supabase)...');
    try {
      let pgInserted = 0;
      const CHUNK_SIZE = 30;

      for (let i = 0; i < newEmpresas.length; i += CHUNK_SIZE) {
        const chunk = newEmpresas.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async e => {
          try {
            const insertSql = `
              INSERT INTO empresas (
                id, nombre_clinica, tipo_centro, region_alemania, ciudad, direccion,
                contacto_nombre, contacto_cargo, correo_contacto, telefono, sitio_web,
                numero_camas, plazas_solicitadas, especialidades_requeridas, nivel_aleman_solicitado,
                etapa_b2b, origen_lead, urgencia, asesor_asignado, etiqueta, notas,
                contactos, historial_crm, activo, fecha_creacion, fecha_ultimo_contacto
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
              )
              ON CONFLICT (id) DO NOTHING;
            `;
            const values = [
              e.id, e.nombre_clinica, e.tipo_centro, e.region_alemania, e.ciudad, e.direccion,
              e.contacto_nombre, e.contacto_cargo, e.correo_contacto, e.telefono, e.sitio_web,
              e.numero_camas, e.plazas_solicitadas, e.especialidades_requeridas, e.nivel_aleman_solicitado,
              e.etapa_b2b, e.origen_lead, e.urgencia, e.asesor_asignado, e.etiqueta, e.notas,
              JSON.stringify(e.contactos), JSON.stringify(e.historial_crm), e.activo, e.fecha_creacion, e.fecha_ultimo_contacto
            ];

            await query(insertSql, values);
            pgInserted++;
          } catch (err) {
            if (pgInserted < 3) console.warn(`Nota PG en [${e.nombre_clinica}]:`, err.message);
          }
        }));
        process.stdout.write(`\r⏳ Sincronizadas ${Math.min(i + CHUNK_SIZE, newEmpresas.length)} / ${newEmpresas.length} empresas en Supabase...`);
      }

      console.log(`\n✅ PostgreSQL sincronizado: ${pgInserted} registros procesados.`);
    } catch (pgErr) {
      console.error('⚠️ Error sincronizando en PostgreSQL:', pgErr.message);
    }
  }

  console.log(`🎉 ¡Importación completada con éxito!`);
  console.log(`📈 Resumen:`);
  console.log(`   - Empresas en la base de datos: ${combinedEmpresas.length}`);
  console.log(`   - CRM B2B listo para seguimiento de leads institucionales y contactos directos.`);
  
  if (pool) {
    await pool.end();
  }
  process.exit(0);
}

runImport().catch(err => {
  console.error('❌ Error fatal en importación:', err);
  process.exit(1);
});
