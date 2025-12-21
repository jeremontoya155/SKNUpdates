const fs = require('fs');
const db = require('./database');

async function aplicarMigracionAutorizacion() {
  try {
    console.log('📋 Aplicando migración de autorización...\n');
    
    const sql = fs.readFileSync('./migrations/add_autorizacion_tickets.sql', 'utf8');
    await db.query(sql);
    
    console.log('✅ Migración aplicada exitosamente');
    console.log('✅ Campos agregados a la tabla tickets:');
    console.log('   - requiere_autorizacion (BOOLEAN)');
    console.log('   - autorizado_por (INTEGER)');
    console.log('   - fecha_autorizacion (TIMESTAMP)');
    console.log('   - estado_autorizacion (VARCHAR)\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

aplicarMigracionAutorizacion();
