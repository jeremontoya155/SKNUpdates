const db = require('./database');

async function verAtributosNotebooks() {
  try {
    console.log('🔍 Consultando atributos de categoría Notebooks...\n');
    
    // Ver atributos de Notebooks
    const result = await db.query(`
      SELECT ac.*, cm.nombre as categoria_nombre 
      FROM atributos_categoria ac 
      JOIN categorias_materiales cm ON ac.categoria_id = cm.id 
      WHERE cm.nombre ILIKE '%notebook%' OR cm.nombre ILIKE '%pc%'
      ORDER BY cm.nombre, ac.orden, ac.nombre
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ NO HAY ATRIBUTOS DEFINIDOS PARA NOTEBOOKS/PCs\n');
      console.log('⚠️  Las categorías existen pero NO tienen campos personalizados configurados.');
      console.log('📌 Esto significa que solo se usan los campos básicos de la tabla "materiales":\n');
      console.log('   - nombre');
      console.log('   - marca');
      console.log('   - modelo');
      console.log('   - descripcion');
      console.log('   - codigo');
      console.log('   - stock_actual');
      console.log('   - stock_minimo');
      console.log('   - precio_unitario');
      console.log('   - unidad_medida');
      console.log('   - sucursal_id\n');
    } else {
      console.log('✅ ATRIBUTOS CONFIGURADOS:\n');
      let categoriaActual = '';
      result.rows.forEach(a => {
        if (a.categoria_nombre !== categoriaActual) {
          console.log(`\n📦 ${a.categoria_nombre}:`);
          categoriaActual = a.categoria_nombre;
        }
        console.log(`  ✓ ${a.nombre.padEnd(25)} | ${a.tipo_dato.padEnd(10)} | ${a.requerido ? 'REQUERIDO' : 'Opcional'.padEnd(9)} | ${a.opciones || '-'}`);
      });
    }
    
    console.log('\n\n📊 COMPARACIÓN CON DATOS DE equipos.py:\n');
    console.log('equipos.py RECOPILA:                    | INVENTARIO SKN TIENE:');
    console.log('─'.repeat(80));
    console.log('✓ Procesador (nombre, cores, threads)  | ❓ Atributo "Procesador"?');
    console.log('✓ RAM (total GB, módulos, velocidad)   | ❓ Atributo "RAM"?');
    console.log('✓ Disco (modelo, tamaño GB, tipo)      | ❓ Atributo "Disco" / "Almacenamiento"?');
    console.log('✓ GPU (nombre, RAM, driver)            | ❓ Atributo "GPU" / "Tarjeta Gráfica"?');
    console.log('✓ BIOS (fabricante, versión)           | ❓ Atributo "BIOS"?');
    console.log('✓ Placa Base (fabricante, modelo)      | ❓ Atributo "Motherboard"?');
    console.log('✓ Sistema Operativo (OS, versión)      | ❓ Atributo "Sistema Operativo"?');
    console.log('✓ Hostname / IP Local                  | ✓ Campo "nombre" / nuevo atributo "IP"?');
    console.log('✓ UUID Máquina                         | ❓ Atributo "Serial" / "UUID"?');
    console.log('✓ Adaptadores Red (MAC, velocidad)     | ❓ Atributo "MAC Address"?');
    console.log('✓ Batería (si laptop)                  | ❓ Atributo "Batería"?');
    console.log('✓ Pantalla (resolución)                | ❓ Atributo "Pantalla"?');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verAtributosNotebooks();
