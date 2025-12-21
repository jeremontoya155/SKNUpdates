const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:IQrhQJONUFJQoMbkFpajUWHJYGODvdwP@autorack.proxy.rlwy.net:16991/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function agregarAtributos() {
  try {
    console.log('🔧 Agregando atributos completos para Notebooks y PCs...\n');
    
    // Obtener IDs de categorías
    const notebooks = await pool.query("SELECT id FROM categorias_materiales WHERE nombre = 'Notebooks'");
    const pcs = await pool.query("SELECT id FROM categorias_materiales WHERE nombre IN ('PC de Escritorio', 'PCs')");
    
    if (notebooks.rows.length === 0) {
      console.log('❌ Categoría Notebooks no encontrada');
      return;
    }
    
    const notebookId = notebooks.rows[0].id;
    const pcIds = pcs.rows.map(p => p.id);
    
    // Atributos nuevos para ambas categorías
    const atributosNuevos = [
      { nombre: 'Serial/UUID', tipo: 'texto', requerido: false, descripcion: 'Identificador único de la máquina' },
      { nombre: 'MAC Address', tipo: 'texto', requerido: false, descripcion: 'Dirección MAC principal' },
      { nombre: 'IP Local', tipo: 'texto', requerido: false, descripcion: 'Dirección IP en la red local' },
      { nombre: 'BIOS', tipo: 'texto', requerido: false, descripcion: 'Fabricante y versión del BIOS' },
      { nombre: 'Placa Base', tipo: 'texto', requerido: false, descripcion: 'Fabricante y modelo de motherboard' },
      { nombre: 'Hostname', tipo: 'texto', requerido: false, descripcion: 'Nombre del equipo en la red' },
      { nombre: 'Núcleos CPU', tipo: 'numero', requerido: false, descripcion: 'Cantidad de núcleos físicos' },
      { nombre: 'Threads CPU', tipo: 'numero', requerido: false, descripcion: 'Cantidad de hilos lógicos' },
      { nombre: 'Frecuencia CPU MHz', tipo: 'numero', requerido: false, descripcion: 'Frecuencia máxima del procesador' },
      { nombre: 'RAM Velocidad MHz', tipo: 'numero', requerido: false, descripcion: 'Velocidad de la memoria RAM' },
      { nombre: 'Módulos RAM', tipo: 'texto', requerido: false, descripcion: 'Cantidad y capacidad de módulos' },
      { nombre: 'Tipo Almacenamiento', tipo: 'texto', requerido: false, descripcion: 'SSD, HDD, NVMe, etc.' },
      { nombre: 'Interface Almacenamiento', tipo: 'texto', requerido: false, descripcion: 'SATA, NVMe, M.2, etc.' },
      { nombre: 'GPU RAM MB', tipo: 'numero', requerido: false, descripcion: 'Memoria de la tarjeta gráfica' },
      { nombre: 'Driver GPU', tipo: 'texto', requerido: false, descripcion: 'Versión del driver de video' },
      { nombre: 'Resolución Pantalla', tipo: 'texto', requerido: false, descripcion: 'Resolución actual (ej: 1920x1080)' },
      { nombre: 'Adaptadores Red', tipo: 'texto', requerido: false, descripcion: 'Lista de interfaces de red' },
      { nombre: 'Fecha Registro', tipo: 'fecha', requerido: false, descripcion: 'Fecha de registro automático' },
      { nombre: 'Última Actualización', tipo: 'fecha', requerido: false, descripcion: 'Última vez que se actualizó' }
    ];
    
    console.log('📦 Agregando a categoría: Notebooks');
    let orden = 100; // Empezar desde orden 100 para no conflictuar
    
    for (const attr of atributosNuevos) {
      try {
        await pool.query(
          `INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, requerido, orden, opciones) 
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [notebookId, attr.nombre, attr.tipo, attr.requerido, orden, attr.descripcion]
        );
        console.log(`  ✓ ${attr.nombre}`);
        orden++;
      } catch (err) {
        console.log(`  ⚠️  ${attr.nombre} (ya existe o error)`);
      }
    }
    
    // Agregar a todas las categorías de PC
    for (const pcId of pcIds) {
      console.log(`\n📦 Agregando a categoría ID: ${pcId}`);
      orden = 100;
      
      for (const attr of atributosNuevos) {
        try {
          await pool.query(
            `INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, requerido, orden, opciones) 
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [pcId, attr.nombre, attr.tipo, attr.requerido, orden, attr.descripcion]
          );
          console.log(`  ✓ ${attr.nombre}`);
          orden++;
        } catch (err) {
          console.log(`  ⚠️  ${attr.nombre} (ya existe o error)`);
        }
      }
    }
    
    console.log('\n✅ Atributos agregados exitosamente!');
    console.log('\n📋 Ahora las categorías Notebooks y PCs tienen:');
    console.log('   - Procesador, RAM, Almacenamiento (ya existían)');
    console.log('   - Serial/UUID, MAC, IP, BIOS, Placa Base (nuevos)');
    console.log('   - Detalles técnicos: Núcleos, Frecuencia, etc. (nuevos)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

agregarAtributos();
