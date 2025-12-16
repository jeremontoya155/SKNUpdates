const db = require('./database');
const bcrypt = require('bcrypt');

async function actualizarBelu() {
  try {
    console.log('🔧 Actualizando credenciales de Belu...\n');
    
    // Cambiar email y contraseña
    console.log('📝 Cambiando email a belu@skn.com y contraseña a belu123...');
    const nuevaPassword = await bcrypt.hash('belu123', 10);
    
    await db.query(
      'UPDATE usuarios SET email = $1, password_hash = $2 WHERE nombre = $3',
      ['belu@skn.com', nuevaPassword, 'Belu SubAdmin']
    );
    console.log('✅ Email y contraseña actualizados');
    
    // Mostrar usuarios finales
    console.log('\n📋 Usuarios SKN actuales:');
    const result = await db.query(`
      SELECT id, nombre, email, rol 
      FROM usuarios 
      WHERE rol LIKE 'skn_%' 
      ORDER BY 
        CASE rol 
          WHEN 'skn_admin' THEN 1 
          WHEN 'skn_subadmin' THEN 2 
          WHEN 'skn_user' THEN 3 
        END, 
        nombre
    `);
    console.table(result.rows);
    
    console.log('\n✨ Actualización completada!\n');
    console.log('📝 CREDENCIALES FINALES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 ADMIN:');
    console.log('   Email: admin@skn.com');
    console.log('   Pass: Pirineos25*');
    console.log('');
    console.log('⭐ SUBADMIN:');
    console.log('   Email: belu@skn.com - Pass: belu123');
    console.log('   Nombre: Belu SubAdmin');
    console.log('');
    console.log('👤 TÉCNICOS:');
    console.log('   Email: carlos@skn.com - Pass: carlos123');
    console.log('   Email: maria@skn.com - Pass: maria123');
    console.log('   Email: juan@skn.com - Pass: juan123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

actualizarBelu();
