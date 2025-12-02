const pool = require('./database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('📝 Ejecutando migraciones...\n');
    
    // Migración 1: Sucursales
    console.log('1️⃣ Migración de sucursales...');
    const migrationPath1 = path.join(__dirname, 'migrations', 'add_sucursales.sql');
    const sql1 = fs.readFileSync(migrationPath1, 'utf8');
    await pool.query(sql1);
    console.log('✅ Tabla "sucursales" lista\n');
    
    // Migración 2: Evaluaciones Internas
    console.log('2️⃣ Migración de evaluaciones internas...');
    const migrationPath2 = path.join(__dirname, 'migrations', 'add_evaluaciones_internas.sql');
    const sql2 = fs.readFileSync(migrationPath2, 'utf8');
    await pool.query(sql2);
    console.log('✅ Tabla "evaluaciones_internas" lista\n');
    
    // Migración 3: Sucursal en Inventario
    console.log('3️⃣ Migración de sucursal en inventario...');
    const migrationPath3 = path.join(__dirname, 'migrations', 'add_sucursal_to_inventario.sql');
    const sql3 = fs.readFileSync(migrationPath3, 'utf8');
    await pool.query(sql3);
    console.log('✅ Columna "sucursal_id" agregada a inventario\n');
    
    console.log('✅ Todas las migraciones ejecutadas exitosamente!');
    console.log('\nTablas creadas/actualizadas:');
    console.log('  - ✓ sucursales (con direcciones completas)');
    console.log('  - ✓ evaluaciones_internas (solo admin SKN)');
    console.log('  - ✓ empresas (nuevas columnas: cuit, telefono, etc.)');
    console.log('  - ✓ inventario (columna sucursal_id)');
    
    // Verificar tablas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sucursales', 'evaluaciones_internas', 'inventario')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tablas confirmadas en la base de datos:');
    tables.rows.forEach(t => {
      console.log(`  ✓ ${t.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    process.exit(1);
  }
}

runMigration();
