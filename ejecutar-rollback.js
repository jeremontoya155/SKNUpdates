const db = require('./database');
const fs = require('fs');

async function rollback() {
  try {
    console.log('⏮️  Haciendo rollback de atributos dinámicos...');
    
    const sql = fs.readFileSync('./rollback-atributos.sql', 'utf8');
    
    await db.query(sql);
    
    console.log('✓ Rollback completado exitosamente');
    console.log('✓ Las tablas de atributos dinámicos han sido eliminadas');
    console.log('✓ El sistema ha vuelto a su estructura original');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

rollback();
