const { query, pool } = require('../db/pool');

async function migrate() {
  try {
    console.log('Renaming rol to roles and converting to JSONB...');
    await query(`
      ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
      ALTER TABLE usuarios 
      RENAME COLUMN rol TO roles;
    `);
    
    await query(`
      ALTER TABLE usuarios 
      ALTER COLUMN roles TYPE JSONB 
      USING jsonb_build_array(roles);
    `);
    
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    pool.end();
  }
}

migrate();
