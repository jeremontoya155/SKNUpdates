const db = require('./database');

(async () => {
  try {
    const result = await db.query('SELECT id, nombre FROM empresas ORDER BY id');
    console.log('\n📋 EMPRESAS EXISTENTES:');
    console.log('=======================');
    result.rows.forEach(e => {
      console.log(`ID: ${e.id} - ${e.nombre}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
