const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cambiarEmailAdmin() {
  console.log('\n🔄 ACTUALIZANDO EMAIL DEL ADMINISTRADOR\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar admin actual
    console.log('\n1️⃣ Usuario actual:');
    const adminActual = await pool.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE email = $1',
      ['fnalbandian@gmail.com']
    );

    if (adminActual.rows.length > 0) {
      const admin = adminActual.rows[0];
      console.log(`   ID: ${admin.id}`);
      console.log(`   Nombre: ${admin.nombre}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Rol: ${admin.rol}`);
    } else {
      console.log('   ⚠️  No existe fnalbandian@gmail.com');
      await pool.end();
      return;
    }

    // 2. Verificar que no exista el nuevo email
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      ['fnalbandian@gmail.com']
    );

    if (existe.rows.length > 0) {
      console.log('\n   ❌ Ya existe un usuario con fnalbandian@gmail.com');
      console.log(`   ID: ${existe.rows[0].id}`);
      console.log('\n   Eliminando usuario duplicado...');
      await pool.query(
        'DELETE FROM usuarios WHERE email = $1',
        ['fnalbandian@gmail.com']
      );
      console.log('   ✅ Usuario duplicado eliminado');
    }

    // 3. Actualizar email y nombre
    console.log('\n2️⃣ Actualizando datos...');
    await pool.query(
      `UPDATE usuarios 
       SET email = $1,
           nombre = $2
       WHERE email = $3`,
      ['fnalbandian@gmail.com', 'Fernando Albandian', 'fnalbandian@gmail.com']
    );

    console.log('   ✅ Datos actualizados');

    // 4. Opcional: Actualizar contraseña
    console.log('\n3️⃣ Actualizando contraseña...');
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE email = $2',
      [hashedPassword, 'fnalbandian@gmail.com']
    );

    console.log('   ✅ Contraseña actualizada');

    // 5. Verificar cambios
    console.log('\n4️⃣ Verificando cambios...');
    const nuevoAdmin = await pool.query(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE email = $1',
      ['fnalbandian@gmail.com']
    );

    if (nuevoAdmin.rows.length > 0) {
      const admin = nuevoAdmin.rows[0];
      console.log('\n   ✅ ADMINISTRADOR ACTUALIZADO:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Nombre: ${admin.nombre}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Rol: ${admin.rol}`);
      console.log(`   Activo: ${admin.activo ? 'Sí' : 'No'}`);
    }

    // 6. Información de acceso
    console.log('\n' + '='.repeat(60));
    console.log('\n🔐 NUEVAS CREDENCIALES DE ACCESO:\n');
    console.log('   📧 Email: fnalbandian@gmail.com');
    console.log('   🔑 Password: admin123');
    console.log('\n   💡 Cambia la contraseña después del primer login');
    console.log('\n   🌐 Login Local: http://localhost:3000/auth/login');
    console.log('   🌐 Producción: https://sknupdates-production.up.railway.app/auth/login');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

cambiarEmailAdmin();
