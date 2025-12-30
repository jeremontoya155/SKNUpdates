const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verColumnas() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 COLUMNAS DE LA TABLA usuarios:\n');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name.padEnd(30)} ${col.data_type}`);
    });

    // Ver un usuario de ejemplo
    const ejemplo = await pool.query('SELECT * FROM usuarios LIMIT 1');
    console.log('\n📄 Ejemplo de usuario:\n');
    console.log(ejemplo.rows[0]);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verColumnas();
