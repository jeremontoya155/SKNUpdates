const pool = require('./database');

async function testSucursales() {
  try {
    console.log('🧪 Probando funcionalidad de sucursales...\n');
    
    // Verificar tabla empresas
    const empresas = await pool.query('SELECT id, nombre FROM empresas LIMIT 5');
    console.log('📊 Empresas disponibles:');
    empresas.rows.forEach(e => console.log(`  - ${e.id}: ${e.nombre}`));
    
    // Verificar tabla sucursales
    const sucursales = await pool.query(`
      SELECT s.*, e.nombre as empresa_nombre 
      FROM sucursales s 
      JOIN empresas e ON s.empresa_id = e.id
      ORDER BY s.fecha_creacion DESC
      LIMIT 5
    `);
    
    console.log('\n🏪 Sucursales existentes:');
    if (sucursales.rows.length === 0) {
      console.log('  (ninguna todavía)');
    } else {
      sucursales.rows.forEach(s => {
        console.log(`  - ${s.nombre} (${s.empresa_nombre})`);
        console.log(`    📍 ${s.direccion}, ${s.ciudad}, ${s.provincia}`);
        console.log(`    ${s.es_principal ? '⭐ Principal' : ''}`);
      });
    }
    
    // Verificar nuevas columnas en empresas
    const empresaDetalle = await pool.query(`
      SELECT nombre, cuit, telefono, ciudad, provincia, codigo_postal, sitio_web 
      FROM empresas 
      WHERE id = $1
    `, [empresas.rows[0].id]);
    
    console.log(`\n📋 Detalle de empresa "${empresaDetalle.rows[0].nombre}":`);
    console.log(`  CUIT: ${empresaDetalle.rows[0].cuit || 'N/A'}`);
    console.log(`  Teléfono: ${empresaDetalle.rows[0].telefono || 'N/A'}`);
    console.log(`  Ciudad: ${empresaDetalle.rows[0].ciudad || 'N/A'}`);
    console.log(`  Provincia: ${empresaDetalle.rows[0].provincia || 'N/A'}`);
    console.log(`  C.P.: ${empresaDetalle.rows[0].codigo_postal || 'N/A'}`);
    console.log(`  Sitio Web: ${empresaDetalle.rows[0].sitio_web || 'N/A'}`);
    
    console.log('\n✅ Todo funcionando correctamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSucursales();
