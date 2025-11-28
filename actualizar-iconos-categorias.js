require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function actualizarIconos() {
  const client = await pool.connect();
  
  try {
    console.log('🎨 Actualizando iconos y prefijos de categorías...\n');
    
    await client.query(`UPDATE categorias_materiales SET icono = '💻', codigo_prefijo = 'PC' WHERE nombre = 'PC de Escritorio' AND icono IS NULL`);
    await client.query(`UPDATE categorias_materiales SET icono = '📱', codigo_prefijo = 'NB' WHERE nombre = 'Notebooks' AND icono IS NULL`);
    await client.query(`UPDATE categorias_materiales SET icono = '🖨️', codigo_prefijo = 'IMP' WHERE nombre = 'Impresoras' AND icono IS NULL`);
    await client.query(`UPDATE categorias_materiales SET icono = '🖥️', codigo_prefijo = 'MON' WHERE nombre = 'Monitores' AND icono IS NULL`);
    await client.query(`UPDATE categorias_materiales SET icono = '⌨️', codigo_prefijo = 'PER' WHERE nombre = 'Periféricos' AND icono IS NULL`);
    await client.query(`UPDATE categorias_materiales SET icono = '🌐', codigo_prefijo = 'RED' WHERE nombre = 'Redes' AND icono IS NULL`);
    await client.query(`UPDATE categorias_materiales SET icono = '🖧', codigo_prefijo = 'SRV' WHERE nombre = 'Servidores' AND icono IS NULL`);
    
    console.log('✅ Iconos y prefijos actualizados exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

actualizarIconos();
