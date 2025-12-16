const db = require('./database');
const bcrypt = require('bcrypt');

async function gestionarUsuariosSKN() {
  try {
    console.log('🔧 Gestión de Usuarios SKN\n');
    
    // 1. Mostrar usuarios SKN actuales
    console.log('📋 Usuarios SKN actuales:');
    const usuariosActuales = await db.query(
      `SELECT id, nombre, email, rol, activo 
       FROM usuarios 
       WHERE rol LIKE 'skn_%' 
       ORDER BY rol, nombre`
    );
    console.table(usuariosActuales.rows);
    
    // 2. Cambiar contraseña del admin SKN
    console.log('\n🔐 Cambiando contraseña del Admin SKN...');
    const nuevaPassword = 'Pirineos25*';
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
    
    await db.query(
      `UPDATE usuarios 
       SET password_hash = $1 
       WHERE rol = 'skn_admin' AND email = 'admin@skn.com'`,
      [hashedPassword]
    );
    console.log('✅ Contraseña del admin SKN actualizada a: Pirineos25*');
    
    // 3. Crear nuevos usuarios SKN
    console.log('\n👥 Creando nuevos usuarios SKN...\n');
    
    const nuevosUsuarios = [
      {
        nombre: 'Carlos Técnico',
        email: 'carlos@skn.com',
        rol: 'skn_user',
        password: 'carlos123'
      },
      {
        nombre: 'María Técnico',
        email: 'maria@skn.com',
        rol: 'skn_user',
        password: 'maria123'
      },
      {
        nombre: 'Juan Técnico',
        email: 'juan@skn.com',
        rol: 'skn_user',
        password: 'juan123'
      },
      {
        nombre: 'Ana SubAdmin',
        email: 'ana@skn.com',
        rol: 'skn_subadmin',
        password: 'ana123'
      },
      {
        nombre: 'Pedro SubAdmin',
        email: 'pedro@skn.com',
        rol: 'skn_subadmin',
        password: 'pedro123'
      }
    ];
    
    for (const usuario of nuevosUsuarios) {
      // Verificar si el email ya existe
      const existe = await db.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [usuario.email]
      );
      
      if (existe.rows.length > 0) {
        console.log(`⚠️  Usuario ${usuario.email} ya existe, saltando...`);
        continue;
      }
      
      const hashedPwd = await bcrypt.hash(usuario.password, 10);
      
      await db.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol, activo) 
         VALUES ($1, $2, $3, $4, true)`,
        [usuario.nombre, usuario.email, hashedPwd, usuario.rol]
      );
      
      console.log(`✅ Creado: ${usuario.nombre} (${usuario.rol}) - Email: ${usuario.email} - Pass: ${usuario.password}`);
    }
    
    // 4. Mostrar todos los usuarios SKN actualizados
    console.log('\n📋 Usuarios SKN finales:');
    const usuariosFinales = await db.query(
      `SELECT id, nombre, email, rol, activo 
       FROM usuarios 
       WHERE rol LIKE 'skn_%' 
       ORDER BY 
         CASE rol 
           WHEN 'skn_admin' THEN 1 
           WHEN 'skn_subadmin' THEN 2 
           WHEN 'skn_user' THEN 3 
         END, 
         nombre`
    );
    console.table(usuariosFinales.rows);
    
    console.log('\n✨ Proceso completado exitosamente!\n');
    console.log('📝 RESUMEN DE CREDENCIALES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 ADMIN:');
    console.log('   Email: admin@skn.com');
    console.log('   Pass: Pirineos25*');
    console.log('');
    console.log('⭐ SUBADMINS:');
    console.log('   Email: ana@skn.com - Pass: ana123');
    console.log('   Email: pedro@skn.com - Pass: pedro123');
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

gestionarUsuariosSKN();
