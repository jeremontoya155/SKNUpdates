const db = require('./database');
const bcrypt = require('bcrypt');

async function crearUsuarioAdmin() {
  try {
    console.log('🔧 Creando empresa SKN...');
    
    // Crear empresa SKN
    const empresaResult = await db.query(
      `INSERT INTO empresas (nombre, direccion, telefono, email, activo) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['SKN', 'Dirección SKN', '123456789', 'contacto@skn.com', true]
    );

    let empresaId;
    
    if (empresaResult.rows.length > 0) {
      empresaId = empresaResult.rows[0].id;
      console.log('✓ Empresa SKN creada con ID:', empresaId);
    } else {
      // Si ya existe, obtener el ID
      const existente = await db.query('SELECT id FROM empresas WHERE nombre = $1', ['SKN']);
      empresaId = existente.rows[0].id;
      console.log('✓ Empresa SKN ya existe con ID:', empresaId);
    }

    // Verificar si ya existe el usuario admin
    const usuarioExistente = await db.query(
      'SELECT id FROM usuarios WHERE email = $1',
      ['admin@skn.com']
    );

    if (usuarioExistente.rows.length > 0) {
      console.log('⚠ El usuario admin@skn.com ya existe');
      process.exit(0);
    }

    console.log('🔧 Creando usuario administrador...');
    
    // Crear usuario admin con contraseña hasheada
    const password = 'admin123'; // Contraseña por defecto
    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, empresa_id, rol, activo, fecha_aprobacion) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      ['Administrador SKN', 'admin@skn.com', passwordHash, empresaId, 'admin', true]
    );

    console.log('✓ Usuario administrador creado exitosamente');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email: admin@skn.com');
    console.log('🔑 Contraseña: admin123');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('⚠ IMPORTANTE: Cambia la contraseña después del primer login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

crearUsuarioAdmin();
