const fs = require('fs');
const path = require('path');
const { query, isPostgresConfigured, pool } = require('../db/pool');

async function initializeDatabase() {
  console.log('🚀 Iniciando script de inicialización de Base de Datos PostgreSQL...');

  if (!isPostgresConfigured()) {
    console.error('❌ ERROR: No se ha configurado la conexión a PostgreSQL.');
    console.error('👉 Por favor define la variable DATABASE_URL o PGHOST/PGDATABASE en tu archivo .env');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, '../../schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ ERROR: No se encontró el archivo de esquema en: ${schemaPath}`);
    process.exit(1);
  }

  try {
    console.log(`📄 Leyendo archivo de esquema SQL (${schemaPath})...`);
    const sqlScript = fs.readFileSync(schemaPath, 'utf-8');

    console.log('⚡ Ejecutando esquema SQL en PostgreSQL...');
    await query(sqlScript);
    console.log('✅ Esquema y tablas ejecutadas exitosamente.');

    // Verificar las tablas creadas
    const res = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📊 Tablas activas en la base de datos PostgreSQL:');
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));

    console.log('\n🎉 Base de datos de JN Palabras lista para producción/staging.');
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err.message);
    if (err.detail) console.error('  Detalle:', err.detail);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

initializeDatabase();
