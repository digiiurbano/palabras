const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const isPgEnvSet = Boolean(connectionString || process.env.PGHOST || process.env.PGDATABASE);

let pool = null;

if (isPgEnvSet) {
  const useSsl = process.env.PGSSL === 'true' || 
                 Boolean(connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

  const poolConfig = connectionString 
    ? { 
        connectionString, 
        ssl: useSsl ? { rejectUnauthorized: false } : false 
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        database: process.env.PGDATABASE || 'jnpalabras',
        ssl: useSsl ? { rejectUnauthorized: false } : false
      };

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('❌ Error inesperado en el cliente del Pool de PostgreSQL:', err.message);
  });
}

function isPostgresConfigured() {
  return pool !== null;
}

/**
 * Ejecuta una consulta SQL en el pool de PostgreSQL
 * @param {string} text Consulta SQL
 * @param {Array} params Parámetros para la consulta parametrizada
 */
async function query(text, params) {
  if (!pool) {
    throw new Error('PostgreSQL no está configurado (DATABASE_URL no especificada).');
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('SQL Executed', { text, duration, rows: res.rowCount });
  return res;
}

module.exports = {
  pool,
  query,
  isPostgresConfigured
};
