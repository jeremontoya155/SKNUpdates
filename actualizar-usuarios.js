const db = require('./database');

async function actualizarUsuarios() {
  try {
    console.log('🔧 Actualizando usuarios SKN...\n');
    
    // Actualizar Ana a Belu
    console.log('📝 Cambiando Ana a Belu...');
    await db.query(
      'UPDATE usuarios SET nombre = $1 WHERE email = $2',
      ['Belu SubAdmin', 'ana@skn.com']
    );
    console.log('✅ Ana actualizada a Belu SubAdmin');
    
    // Eliminar Pedro
    console.log('\n📝 Eliminando a Pedro...');
    await db.query(
      'DELETE FROM usuarios WHERE email = $1',
      ['pedro@skn.com']
    );
    console.log('✅ Pedro eliminado');
    
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
    console.log('📝 CREDENCIALES ACTUALIZADAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 ADMIN:');
    console.log('   Email: admin@skn.com');
    console.log('   Pass: Pirineos25*');
    console.log('');
    console.log('⭐ SUBADMIN:');
    console.log('   Email: ana@skn.com - Pass: ana123');
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

actualizarUsuarios();
