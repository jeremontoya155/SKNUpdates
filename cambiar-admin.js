const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cambiarAdminPrincipal() {
  console.log('\n🔄 CAMBIANDO USUARIO ADMINISTRADOR PRINCIPAL\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar si existe el admin actual
    console.log('\n1️⃣ Verificando usuario actual fnalbandian@gmail.com...');
    const adminActual = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      ['fnalbandian@gmail.com']
    );

    if (adminActual.rows.length > 0) {
      const admin = adminActual.rows[0];
      console.log('   ✅ Usuario encontrado:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Nombre: ${admin.nombre}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Rol: ${admin.rol}`);
    } else {
      console.log('   ⚠️  No se encontró fnalbandian@gmail.com');
    }

    // 2. Verificar si ya existe fnalbandian@gmail.com
    console.log('\n2️⃣ Verificando si existe fnalbandian@gmail.com...');
    const nuevoAdmin = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      ['fnalbandian@gmail.com']
    );

    if (nuevoAdmin.rows.length > 0) {
      console.log('   ✅ Usuario ya existe:');
      console.log(`   ID: ${nuevoAdmin.rows[0].id}`);
      console.log(`   Nombre: ${nuevoAdmin.rows[0].nombre}`);
      console.log(`   Rol actual: ${nuevoAdmin.rows[0].rol}`);
      
      // Actualizar a admin
      console.log('\n3️⃣ Actualizando rol a skn_admin...');
      await pool.query(
        `UPDATE usuarios 
         SET rol = 'skn_admin',
             nombre = 'Fernando Albandian',
             activo = true
         WHERE email = $1`,
        ['fnalbandian@gmail.com']
      );
      console.log('   ✅ Rol actualizado a skn_admin');

    } else {
      console.log('   ⚠️  Usuario no existe, creando nuevo...');
      
      // 3. Crear nuevo usuario admin
      console.log('\n3️⃣ Creando nuevo usuario administrador...');
      
      const password = 'admin123'; // Puedes cambiar esto
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO usuarios (empresa_id, nombre, email, password_hash, rol, activo, fecha_registro, fecha_aprobacion)
         VALUES ($1, $2, $3, $4, $5, $6, TIMEZONE('America/Argentina/Buenos_Aires', NOW()), TIMEZONE('America/Argentina/Buenos_Aires', NOW()))
         RETURNING id, nombre, email, rol`,
        [1, 'Fernando Albandian', 'fnalbandian@gmail.com', hashedPassword, 'skn_admin', true]
      );

      console.log('   ✅ Usuario creado exitosamente:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Nombre: ${result.rows[0].nombre}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Rol: ${result.rows[0].rol}`);
      console.log(`   Password: ${password}`);
    }

    // 4. Opcional: Desactivar o eliminar fnalbandian@gmail.com
    console.log('\n4️⃣ ¿Qué hacer con fnalbandian@gmail.com?');
    console.log('   Opciones:');
    console.log('   a) Desactivar (mantener en DB pero sin acceso)');
    console.log('   b) Eliminar completamente');
    console.log('   c) Cambiar a rol usuario normal');
    console.log('\n   Por seguridad, solo lo desactivaremos...');

    if (adminActual.rows.length > 0) {
      await pool.query(
        'UPDATE usuarios SET activo = false WHERE email = $1',
        ['fnalbandian@gmail.com']
      );
      console.log('   ✅ Usuario fnalbandian@gmail.com desactivado');
    }

    // 5. Verificar resultado final
    console.log('\n5️⃣ Verificando configuración final...');
    const admins = await pool.query(
      `SELECT id, nombre, email, rol, activo 
       FROM usuarios 
       WHERE rol IN ('admin', 'skn_admin')
       ORDER BY activo DESC, id`
    );

    console.log('\n   📋 USUARIOS ADMINISTRADORES:\n');
    admins.rows.forEach((a, i) => {
      const status = a.activo ? '✅ Activo' : '❌ Inactivo';
      console.log(`   ${i + 1}. ${a.nombre}`);
      console.log(`      Email: ${a.email}`);
      console.log(`      Estado: ${status}`);
      console.log('');
    });

    // 6. Información de acceso
    console.log('='.repeat(60));
    console.log('\n🔐 CREDENCIALES DE ACCESO:\n');
    console.log('   📧 Email: fnalbandian@gmail.com');
    console.log('   🔑 Password: admin123');
    console.log('\n   💡 Cambia la contraseña después del primer login');
    console.log('\n   🌐 Login: http://localhost:3000/auth/login');
    console.log('   🌐 Producción: https://sknupdates-production.up.railway.app/auth/login');

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

cambiarAdminPrincipal();
