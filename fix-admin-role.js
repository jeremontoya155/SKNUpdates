require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixAdminRole() {
  try {
    console.log('🔧 Actualizando rol del usuario admin...');
    
    const result = await pool.query(
      "UPDATE usuarios SET rol = 'skn_admin' WHERE email = 'admin@skn.com' RETURNING id, nombre, email, rol"
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Usuario actualizado exitosamente:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Nombre:', result.rows[0].nombre);
      console.log('   Email:', result.rows[0].email);
      console.log('   Rol:', result.rows[0].rol);
    } else {
      console.log('⚠️  No se encontró el usuario admin@skn.com');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixAdminRole();
