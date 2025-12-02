const db = require('./database');

async function verificarPermisos() {
  try {
    console.log('\n=== VERIFICACIÓN DE PERMISOS ===\n');
    
    // 1. Ver todas las empresas
    console.log('📊 EMPRESAS REGISTRADAS:');
    const empresas = await db.query('SELECT id, nombre FROM empresas ORDER BY id');
    empresas.rows.forEach(emp => {
      console.log(`  - ID ${emp.id}: ${emp.nombre}`);
    });
    
    // 2. Ver todos los usuarios
    console.log('\n👥 USUARIOS Y SUS EMPRESAS:');
    const usuarios = await db.query(`
      SELECT u.id, u.nombre, u.email, u.rol, u.empresa_id, e.nombre as empresa_nombre
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      ORDER BY u.empresa_id, u.nombre
    `);
    usuarios.rows.forEach(user => {
      console.log(`  - ${user.nombre} (${user.email})`);
      console.log(`    Rol: ${user.rol}`);
      console.log(`    Empresa ID: ${user.empresa_id || 'N/A'} - ${user.empresa_nombre || 'SKN'}`);
    });
    
    // 3. Ver todos los materiales
    console.log('\n📦 MATERIALES POR EMPRESA:');
    const materiales = await db.query(`
      SELECT m.id, m.codigo, m.nombre, m.empresa_id, e.nombre as empresa_nombre, m.stock_actual
      FROM materiales m
      LEFT JOIN empresas e ON m.empresa_id = e.id
      ORDER BY m.empresa_id, m.nombre
    `);
    
    const materialesPorEmpresa = {};
    materiales.rows.forEach(mat => {
      const empresaKey = mat.empresa_id || 'Sin empresa';
      if (!materialesPorEmpresa[empresaKey]) {
        materialesPorEmpresa[empresaKey] = [];
      }
      materialesPorEmpresa[empresaKey].push(mat);
    });
    
    Object.keys(materialesPorEmpresa).forEach(empresaId => {
      const mats = materialesPorEmpresa[empresaId];
      const empresaNombre = mats[0].empresa_nombre || 'Sin empresa';
      console.log(`\n  ${empresaNombre} (ID: ${empresaId}):`);
      mats.forEach(mat => {
        console.log(`    - ${mat.codigo}: ${mat.nombre} (Stock: ${mat.stock_actual})`);
      });
    });
    
    // 4. Ver todos los servidores
    console.log('\n🖥️ SERVIDORES POR EMPRESA:');
    const servidores = await db.query(`
      SELECT s.id, s.nombre, s.empresa_id, e.nombre as empresa_nombre
      FROM servidores s
      LEFT JOIN empresas e ON s.empresa_id = e.id
      ORDER BY s.empresa_id, s.nombre
    `);
    
    const servidoresPorEmpresa = {};
    servidores.rows.forEach(srv => {
      const empresaKey = srv.empresa_id || 'Sin empresa';
      if (!servidoresPorEmpresa[empresaKey]) {
        servidoresPorEmpresa[empresaKey] = [];
      }
      servidoresPorEmpresa[empresaKey].push(srv);
    });
    
    Object.keys(servidoresPorEmpresa).forEach(empresaId => {
      const srvs = servidoresPorEmpresa[empresaId];
      const empresaNombre = srvs[0].empresa_nombre || 'Sin empresa';
      console.log(`\n  ${empresaNombre} (ID: ${empresaId}):`);
      srvs.forEach(srv => {
        console.log(`    - ${srv.nombre}`);
      });
    });
    
    console.log('\n=== FIN DE VERIFICACIÓN ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verificarPermisos();
