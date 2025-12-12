const db = require('./database');

(async () => {
  try {
    const result = await db.query('SELECT id, nombre, descripcion FROM categorias_materiales ORDER BY nombre');
    
    console.log('\n📦 CATEGORÍAS DE INVENTARIO EXISTENTES:\n');
    console.log('='.repeat(60));
    
    result.rows.forEach(cat => {
      console.log(`ID: ${cat.id.toString().padEnd(3)} | ${cat.nombre}`);
      if (cat.descripcion) {
        console.log(`      ${cat.descripcion}`);
      }
    });
    
    console.log('='.repeat(60));
    console.log(`\n✅ Total: ${result.rows.length} categorías\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
