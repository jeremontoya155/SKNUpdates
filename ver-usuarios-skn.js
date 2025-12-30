const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verificarUsuariosSKN() {
  console.log('\n🔍 VERIFICANDO USUARIOS SKN EN BASE DE DATOS\n');
  console.log('='.repeat(60));

  try {
    const result = await pool.query(`
      SELECT 
        id,
        nombre,
        email,
        rol,
        activo
      FROM usuarios
      WHERE rol LIKE 'skn_%'
      ORDER BY id
    `);

    console.log(`\n✅ Usuarios SKN encontrados: ${result.rows.length}\n`);

    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. Usuario:`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   👤 Nombre: ${user.nombre}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Rol: ${user.rol}`);
      console.log(`   ${user.activo ? '✅' : '❌'} Estado: ${user.activo ? 'Activo' : 'Inactivo'}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n💡 SUGERENCIA:');
    console.log('   Usa uno de estos emails para el test de la app móvil\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verificarUsuariosSKN();
