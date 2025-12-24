const db = require('./database');
const bcrypt = require('bcrypt');

async function crearUsuarioBelen() {
  try {
    console.log('👤 Creando usuario Belen (SubAdmin)...\n');

    // Verificar si ya existe
    const existing = await db.query(
      `SELECT id, nombre FROM usuarios WHERE LOWER(nombre) LIKE '%belen%' AND rol = 'skn_subadmin'`
    );

    if (existing.rows.length > 0) {
      console.log(`⚠️ Usuario Belen ya existe: ${existing.rows[0].nombre} (ID: ${existing.rows[0].id})`);
      console.log('No se creará un nuevo usuario.\n');
      process.exit(0);
    }

    // Obtener empresa SKN
    const sknEmpresa = await db.query(
      `SELECT id FROM empresas WHERE nombre ILIKE '%skn%' OR id = 1 LIMIT 1`
    );

    if (sknEmpresa.rows.length === 0) {
      console.error('❌ No se encontró la empresa SKN. Crea primero una empresa para SKN.');
      process.exit(1);
    }

    const empresaId = sknEmpresa.rows[0].id;

    // Crear contraseña hasheada
    const password = 'Belen2025'; // Contraseña temporal
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await db.query(
      `INSERT INTO usuarios (empresa_id, nombre, email, password_hash, rol, activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, nombre, email, rol`,
      [empresaId, 'Belen', 'belen@skn.com', hashedPassword, 'skn_subadmin']
    );

    const newUser = result.rows[0];

    console.log('✅ Usuario Belen creado exitosamente!\n');
    console.log('📋 Detalles:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Nombre: ${newUser.nombre}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Rol: ${newUser.rol}`);
    console.log(`   Contraseña temporal: ${password}`);
    console.log('\n⚠️ IMPORTANTE: Cambia la contraseña después del primer inicio de sesión\n');

    console.log('✨ Permisos de Belen:');
    console.log('   - Ver SOLO tickets cerrados (para finalizarlos)');
    console.log('   - Ver tickets asignados a ella');
    console.log('   - ÚNICO usuario que puede marcar tickets como FINALIZADO');
    console.log('   - Gestionar autorización de tickets presenciales\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario Belen:', error);
    process.exit(1);
  }
}

crearUsuarioBelen();
