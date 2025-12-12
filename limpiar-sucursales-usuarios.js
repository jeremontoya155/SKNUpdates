// Limpiar sucursales y usuarios que NO están en el Excel
const db = require('./database');

async function limpiarDatos() {
  try {
    console.log('🧹 Iniciando limpieza de sucursales y usuarios...\n');

    // ============================================
    // PASO 1: Identificar sucursales a mantener
    // ============================================
    
    const sucursalesAMantener = [
      // Donadio (empresa_id = 9)
      'Logística', 'Ventas', 'Impuestos', 'Tesorería', 'Créditos', 
      'Supervisión Ventas', 'Caja', 'RRHH', 'Planta', 'Garita',
      
      // ADLS (empresa_id = 13)
      'Oficina Técnica', 'Mantenimiento', 'Acindar Fondo',
      
      // Corsider (empresa_id = 12)
      'Sucursal R20 - Ventas', 'Sucursal R20 - Atrás PB', 'Sucursal R20 - Venta Directa',
      'Sucursal R20 - Compras', 'Sucursal R20 - Mostrador PB', 'Sucursal R20 - Sistemas Construcción',
      'Sucursal R20 - Pasillo', 'Sucursal R20 - Gestión Ventas',
      'Sucursal Argandoña - Mostrador', 'Sucursal Argandoña - Despacho', 'Sucursal Argandoña - Caja',
      'Sucursal Pringles - Mostrador', 'Sucursal Pringles - Caja',
      'Sucursal Arias - Mostrador', 'Sucursal Arias - Caja'
    ];

    // ============================================
    // PASO 2: Obtener sucursales actuales
    // ============================================
    
    const sucursalesActuales = await db.query(`
      SELECT s.id, s.nombre, s.empresa_id, e.nombre as empresa_nombre
      FROM sucursales s
      JOIN empresas e ON s.empresa_id = e.id
      WHERE s.empresa_id IN (9, 12, 13)
      ORDER BY e.nombre, s.nombre
    `);

    console.log(`📊 Total sucursales actuales: ${sucursalesActuales.rows.length}`);
    
    // Identificar sucursales a eliminar
    const sucursalesAEliminar = sucursalesActuales.rows.filter(s => 
      !sucursalesAMantener.includes(s.nombre)
    );

    console.log(`❌ Sucursales a eliminar: ${sucursalesAEliminar.length}`);
    
    if (sucursalesAEliminar.length > 0) {
      console.log('\n🗑️  SUCURSALES A ELIMINAR:');
      console.log('=' .repeat(80));
      sucursalesAEliminar.forEach(s => {
        console.log(`  • ID: ${s.id.toString().padEnd(4)} | ${s.empresa_nombre.padEnd(25)} | ${s.nombre}`);
      });
    }

    // ============================================
    // PASO 3: Verificar si hay equipos en esas sucursales
    // ============================================
    
    const idsAEliminar = sucursalesAEliminar.map(s => s.id);
    
    if (idsAEliminar.length > 0) {
      const equiposEnSucursales = await db.query(`
        SELECT COUNT(*) as total
        FROM materiales
        WHERE sucursal_id = ANY($1)
      `, [idsAEliminar]);

      console.log(`\n� Equipos en sucursales a eliminar: ${equiposEnSucursales.rows[0].total}`);
      
      if (equiposEnSucursales.rows[0].total > 0) {
        console.log('⚠️  ADVERTENCIA: Hay equipos asignados a estas sucursales!');
        console.log('   Se reasignarán a NULL antes de eliminar las sucursales.\n');
        
        // Desasignar equipos de las sucursales
        await db.query(`
          UPDATE materiales 
          SET sucursal_id = NULL 
          WHERE sucursal_id = ANY($1)
        `, [idsAEliminar]);
        
        console.log(`✅ ${equiposEnSucursales.rows[0].total} equipos desasignados`);
      }

      // ============================================
      // PASO 4: Confirmación antes de eliminar
      // ============================================
      
      console.log('\n' + '='.repeat(80));
      console.log('⚠️  RESUMEN DE ELIMINACIÓN:');
      console.log(`   • ${sucursalesAEliminar.length} sucursales serán eliminadas`);
      console.log(`   • Los usuarios se mantienen (están asociados a empresa, no a sucursal)`);
      console.log('='.repeat(80));
      
      // Dar 2 segundos para revisar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\n🔨 Procediendo con la eliminación...\n');

      // ============================================
      // PASO 5: Eliminar sucursales
      // ============================================
      
      const deleteSucursales = await db.query(`
        DELETE FROM sucursales 
        WHERE id = ANY($1)
        RETURNING id, nombre
      `, [idsAEliminar]);
      
      console.log(`✅ ${deleteSucursales.rows.length} sucursales eliminadas`);

    } else {
      console.log('\n✅ No hay sucursales para eliminar. Todo está correcto!');
    }

    // ============================================
    // PASO 7: Verificar resultado final
    // ============================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTADO FINAL:');
    console.log('='.repeat(80));
    
    const resumenFinal = await db.query(`
      SELECT e.nombre as empresa, COUNT(s.id) as total_sucursales
      FROM empresas e
      LEFT JOIN sucursales s ON e.id = s.empresa_id
      WHERE e.id IN (9, 12, 13)
      GROUP BY e.nombre
      ORDER BY e.nombre
    `);

    resumenFinal.rows.forEach(r => {
      console.log(`  • ${r.empresa.padEnd(30)}: ${r.total_sucursales} sucursales`);
    });

    const totalUsuarios = await db.query(`
      SELECT COUNT(*) as total
      FROM usuarios
      WHERE empresa_id IN (9, 12, 13)
    `);

    console.log(`\n  • Total usuarios en estas empresas: ${totalUsuarios.rows[0].total}`);
    console.log('\n✅ Limpieza completada exitosamente!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la limpieza:', error.message);
    console.error(error);
    process.exit(1);
  }
}

limpiarDatos();
