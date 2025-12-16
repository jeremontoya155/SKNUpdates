const db = require('./database');

async function actualizarRestriccionRoles() {
  try {
    console.log('🔧 Actualizando restricción de roles en la tabla usuarios...\n');
    
    // Eliminar la restricción antigua
    console.log('📝 Eliminando restricción antigua...');
    await db.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check');
    console.log('✅ Restricción antigua eliminada');
    
    // Crear nueva restricción con todos los roles
    console.log('\n📝 Creando nueva restricción con todos los roles...');
    await db.query(`
      ALTER TABLE usuarios 
      ADD CONSTRAINT usuarios_rol_check 
      CHECK (rol IN ('skn_admin', 'skn_subadmin', 'skn_user', 'empresa_admin', 'empresa_user'))
    `);
    console.log('✅ Nueva restricción creada');
    
    // Verificar la nueva restricción
    console.log('\n📋 Verificando nueva restricción...');
    const result = await db.query(`
      SELECT pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conname = 'usuarios_rol_check'
    `);
    console.log('Restricción actual:');
    console.log(result.rows[0]?.definition);
    
    console.log('\n✨ Restricción actualizada exitosamente!');
    console.log('Roles permitidos: skn_admin, skn_subadmin, skn_user, empresa_admin, empresa_user\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

actualizarRestriccionRoles();
