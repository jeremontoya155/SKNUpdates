const db = require('./database');
const fs = require('fs');
const path = require('path');

async function aplicarMigracion() {
  try {
    console.log('🔧 Aplicando migración de atributos de hardware...\n');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_atributos_hardware_completo.sql'),
      'utf8'
    );
    
    await db.query(sql);
    
    console.log('\n✅ Migración aplicada exitosamente!');
    console.log('\n📋 Nuevos atributos disponibles:');
    console.log('   - Serial/UUID (identificador único)');
    console.log('   - MAC Address, IP Local, Hostname');
    console.log('   - BIOS, Placa Base');
    console.log('   - Núcleos CPU, Threads, Frecuencia');
    console.log('   - Detalles de RAM (velocidad, módulos)');
    console.log('   - Detalles de Almacenamiento (tipo, interface)');
    console.log('   - Detalles de GPU (RAM, driver, resolución)');
    console.log('   - Adaptadores de Red');
    console.log('   - Fechas de Registro y Actualización\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

aplicarMigracion();
