const db = require('./database');

(async () => {
  try {
    console.log('\n📋 SUCURSALES CREADAS PARA EQUIPOS:\n');
    console.log('=' .repeat(80));

    const empresas = [
      { id: 9, nombre: 'Donadio' },
      { id: 13, nombre: 'Arma de las Sierras (ADLS)' },
      { id: 12, nombre: 'Corsider' }
    ];

    for (const empresa of empresas) {
      const result = await db.query(`
        SELECT id, nombre, direccion
        FROM sucursales
        WHERE empresa_id = $1
        ORDER BY nombre
      `, [empresa.id]);

      console.log(`\n🏢 ${empresa.nombre.toUpperCase()} (${result.rows.length} sucursales):`);
      console.log('-'.repeat(80));
      result.rows.forEach(suc => {
        console.log(`  • ID: ${suc.id.toString().padEnd(3)} | ${suc.nombre}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Total de sucursales listas para asignar equipos\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
