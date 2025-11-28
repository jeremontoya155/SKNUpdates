require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function crearCategoriasEquipos() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Configurando categorías de equipos tecnológicos...\n');
    
    // 1. Crear categorías base para SKN
    console.log('1. Creando categorías de equipos...');
    
    const categorias = [
      { nombre: 'PC de Escritorio', descripcion: 'Computadoras de escritorio completas' },
      { nombre: 'Notebooks', descripcion: 'Computadoras portátiles' },
      { nombre: 'Impresoras', descripcion: 'Impresoras y multifuncionales' },
      { nombre: 'Monitores', descripcion: 'Pantallas y monitores' },
      { nombre: 'Periféricos', descripcion: 'Teclados, mouse, webcams, etc.' },
      { nombre: 'Redes', descripcion: 'Routers, switches, access points' },
      { nombre: 'Servidores', descripcion: 'Equipos servidor' }
    ];
    
    for (const cat of categorias) {
      const existe = await client.query(
        'SELECT id FROM categorias_materiales WHERE nombre = $1 AND empresa_id = 1',
        [cat.nombre]
      );
      
      if (existe.rows.length === 0) {
        await client.query(
          'INSERT INTO categorias_materiales (empresa_id, nombre, descripcion, activo) VALUES (1, $1, $2, true)',
          [cat.nombre, cat.descripcion]
        );
      }
    }
    
    // 2. Agregar campo de modelo a materiales
    console.log('2. Agregando campo de modelo/marca...');
    await client.query(`
      ALTER TABLE materiales 
      ADD COLUMN IF NOT EXISTS marca VARCHAR(100),
      ADD COLUMN IF NOT EXISTS modelo VARCHAR(150)
    `);
    
    // 3. Crear atributos específicos para cada categoría
    console.log('3. Configurando atributos por categoría...\n');
    
    // Obtener IDs de categorías
    const categoriaPC = await client.query(
      "SELECT id FROM categorias_materiales WHERE nombre = 'PC de Escritorio' AND empresa_id = 1"
    );
    const categoriaNotebook = await client.query(
      "SELECT id FROM categorias_materiales WHERE nombre = 'Notebooks' AND empresa_id = 1"
    );
    const categoriaImpresora = await client.query(
      "SELECT id FROM categorias_materiales WHERE nombre = 'Impresoras' AND empresa_id = 1"
    );
    const categoriaMonitor = await client.query(
      "SELECT id FROM categorias_materiales WHERE nombre = 'Monitores' AND empresa_id = 1"
    );
    
    // Atributos para PC de Escritorio
    if (categoriaPC.rows.length > 0) {
      const pcId = categoriaPC.rows[0].id;
      const atributosPC = [
        { nombre: 'Procesador', tipo: 'texto', orden: 1 },
        { nombre: 'RAM', tipo: 'texto', orden: 2 },
        { nombre: 'Almacenamiento', tipo: 'texto', orden: 3 },
        { nombre: 'Tarjeta Gráfica', tipo: 'texto', orden: 4 },
        { nombre: 'Sistema Operativo', tipo: 'texto', orden: 5 }
      ];
      
      for (const attr of atributosPC) {
        const existe = await client.query(
          'SELECT id FROM atributos_categoria WHERE categoria_id = $1 AND nombre = $2',
          [pcId, attr.nombre]
        );
        
        if (existe.rows.length === 0) {
          await client.query(
            'INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, orden, requerido, activo) VALUES ($1, $2, $3, $4, false, true)',
            [pcId, attr.nombre, attr.tipo, attr.orden]
          );
        }
      }
      console.log('   ✓ Atributos de PC de Escritorio configurados');
    }
    
    // Atributos para Notebooks
    if (categoriaNotebook.rows.length > 0) {
      const notebookId = categoriaNotebook.rows[0].id;
      const atributosNotebook = [
        { nombre: 'Procesador', tipo: 'texto', orden: 1 },
        { nombre: 'RAM', tipo: 'texto', orden: 2 },
        { nombre: 'Almacenamiento', tipo: 'texto', orden: 3 },
        { nombre: 'Pantalla', tipo: 'texto', orden: 4 },
        { nombre: 'Tarjeta Gráfica', tipo: 'texto', orden: 5 },
        { nombre: 'Batería', tipo: 'texto', orden: 6 },
        { nombre: 'Sistema Operativo', tipo: 'texto', orden: 7 }
      ];
      
      for (const attr of atributosNotebook) {
        const existe = await client.query(
          'SELECT id FROM atributos_categoria WHERE categoria_id = $1 AND nombre = $2',
          [notebookId, attr.nombre]
        );
        
        if (existe.rows.length === 0) {
          await client.query(
            'INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, orden, requerido, activo) VALUES ($1, $2, $3, $4, false, true)',
            [notebookId, attr.nombre, attr.tipo, attr.orden]
          );
        }
      }
      console.log('   ✓ Atributos de Notebooks configurados');
    }
    
    // Atributos para Impresoras
    if (categoriaImpresora.rows.length > 0) {
      const impresoraId = categoriaImpresora.rows[0].id;
      const atributosImpresora = [
        { nombre: 'Tipo', tipo: 'texto', orden: 1 }, // Láser, Tinta, Multifunción
        { nombre: 'Resolución', tipo: 'texto', orden: 2 },
        { nombre: 'Velocidad', tipo: 'texto', orden: 3 },
        { nombre: 'Conectividad', tipo: 'texto', orden: 4 }, // USB, WiFi, Ethernet
        { nombre: 'Cartuchos/Toners', tipo: 'texto', orden: 5 }
      ];
      
      for (const attr of atributosImpresora) {
        const existe = await client.query(
          'SELECT id FROM atributos_categoria WHERE categoria_id = $1 AND nombre = $2',
          [impresoraId, attr.nombre]
        );
        
        if (existe.rows.length === 0) {
          await client.query(
            'INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, orden, requerido, activo) VALUES ($1, $2, $3, $4, false, true)',
            [impresoraId, attr.nombre, attr.tipo, attr.orden]
          );
        }
      }
      console.log('   ✓ Atributos de Impresoras configurados');
    }
    
    // Atributos para Monitores
    if (categoriaMonitor.rows.length > 0) {
      const monitorId = categoriaMonitor.rows[0].id;
      const atributosMonitor = [
        { nombre: 'Tamaño', tipo: 'texto', orden: 1 },
        { nombre: 'Resolución', tipo: 'texto', orden: 2 },
        { nombre: 'Tipo Panel', tipo: 'texto', orden: 3 }, // LED, IPS, TN
        { nombre: 'Frecuencia', tipo: 'texto', orden: 4 },
        { nombre: 'Conexiones', tipo: 'texto', orden: 5 } // HDMI, DisplayPort, VGA
      ];
      
      for (const attr of atributosMonitor) {
        const existe = await client.query(
          'SELECT id FROM atributos_categoria WHERE categoria_id = $1 AND nombre = $2',
          [monitorId, attr.nombre]
        );
        
        if (existe.rows.length === 0) {
          await client.query(
            'INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, orden, requerido, activo) VALUES ($1, $2, $3, $4, false, true)',
            [monitorId, attr.nombre, attr.tipo, attr.orden]
          );
        }
      }
      console.log('   ✓ Atributos de Monitores configurados');
    }
    
    // 4. Crear algunos equipos de ejemplo
    console.log('\n4. Creando equipos de ejemplo...\n');
    
    if (categoriaImpresora.rows.length > 0) {
      const impresoraId = categoriaImpresora.rows[0].id;
      
      // Impresora Epson L3150
      const existe_epson = await client.query(
        'SELECT id FROM materiales WHERE codigo = $1',
        ['IMP-EPSON-L3150']
      );
      
      if (existe_epson.rows.length === 0) {
        const epson = await client.query(`
          INSERT INTO materiales (
            empresa_id, categoria_id, nombre, marca, modelo, descripcion, 
            codigo, stock_actual, stock_minimo, unidad_medida, activo
          )
          VALUES (1, $1, 'Impresora Multifunción Epson L3150', 'Epson', 'L3150',
            'Impresora multifunción con sistema de tinta continua',
            'IMP-EPSON-L3150', 0, 2, 'unidad', true)
          RETURNING id
        `, [impresoraId]);
        
        const epsonId = epson.rows[0].id;
        const atributos = await client.query(
          'SELECT id, nombre FROM atributos_categoria WHERE categoria_id = $1',
          [impresoraId]
        );
        
        for (const attr of atributos.rows) {
          let valor = '';
          switch(attr.nombre) {
            case 'Tipo': valor = 'Multifunción a color'; break;
            case 'Resolución': valor = '5760 x 1440 dpi'; break;
            case 'Velocidad': valor = '33 ppm negro / 15 ppm color'; break;
            case 'Conectividad': valor = 'USB, WiFi, WiFi Direct'; break;
            case 'Cartuchos/Toners': valor = 'Sistema de tinta continua 664'; break;
          }
          if (valor) {
            await client.query(
              'INSERT INTO valores_atributos_material (material_id, atributo_id, valor) VALUES ($1, $2, $3)',
              [epsonId, attr.id, valor]
            );
          }
        }
        console.log('   ✓ Impresora Epson L3150 creada');
      }
      
      // Impresora HP LaserJet
      const existe_hp = await client.query(
        'SELECT id FROM materiales WHERE codigo = $1',
        ['IMP-HP-M404DN']
      );
      
      if (existe_hp.rows.length === 0) {
        const hp = await client.query(`
          INSERT INTO materiales (
            empresa_id, categoria_id, nombre, marca, modelo, descripcion,
            codigo, stock_actual, stock_minimo, unidad_medida, activo
          )
          VALUES (1, $1, 'Impresora Láser HP LaserJet Pro M404dn', 'HP', 'LaserJet Pro M404dn',
            'Impresora láser monocromática de alta velocidad',
            'IMP-HP-M404DN', 0, 2, 'unidad', true)
          RETURNING id
        `, [impresoraId]);
        
        const hpId = hp.rows[0].id;
        const atributos = await client.query(
          'SELECT id, nombre FROM atributos_categoria WHERE categoria_id = $1',
          [impresoraId]
        );
        
        for (const attr of atributos.rows) {
          let valor = '';
          switch(attr.nombre) {
            case 'Tipo': valor = 'Láser monocromática'; break;
            case 'Resolución': valor = '1200 x 1200 dpi'; break;
            case 'Velocidad': valor = '38 ppm'; break;
            case 'Conectividad': valor = 'USB, Ethernet'; break;
            case 'Cartuchos/Toners': valor = 'Tóner HP 58A'; break;
          }
          if (valor) {
            await client.query(
              'INSERT INTO valores_atributos_material (material_id, atributo_id, valor) VALUES ($1, $2, $3)',
              [hpId, attr.id, valor]
            );
          }
        }
        console.log('   ✓ Impresora HP LaserJet Pro M404dn creada');
      }
    }
    
    // Notebook ejemplo
    if (categoriaNotebook.rows.length > 0) {
      const notebookId = categoriaNotebook.rows[0].id;
      
      const existe_dell = await client.query(
        'SELECT id FROM materiales WHERE codigo = $1',
        ['NB-DELL-LAT3520']
      );
      
      if (existe_dell.rows.length === 0) {
        const dell = await client.query(`
          INSERT INTO materiales (
            empresa_id, categoria_id, nombre, marca, modelo, descripcion,
            codigo, stock_actual, stock_minimo, unidad_medida, activo
          )
          VALUES (1, $1, 'Notebook Dell Latitude 3520', 'Dell', 'Latitude 3520',
            'Notebook empresarial 15.6 pulgadas',
            'NB-DELL-LAT3520', 0, 3, 'unidad', true)
          RETURNING id
        `, [notebookId]);
        
        const dellId = dell.rows[0].id;
        const atributos = await client.query(
          'SELECT id, nombre FROM atributos_categoria WHERE categoria_id = $1',
          [notebookId]
        );
        
        for (const attr of atributos.rows) {
          let valor = '';
          switch(attr.nombre) {
            case 'Procesador': valor = 'Intel Core i5-1135G7'; break;
            case 'RAM': valor = '8GB DDR4'; break;
            case 'Almacenamiento': valor = '256GB SSD NVMe'; break;
            case 'Pantalla': valor = '15.6" Full HD (1920x1080)'; break;
            case 'Tarjeta Gráfica': valor = 'Intel Iris Xe Graphics'; break;
            case 'Batería': valor = '3 celdas, 42WHr'; break;
            case 'Sistema Operativo': valor = 'Windows 11 Pro'; break;
          }
          if (valor) {
            await client.query(
              'INSERT INTO valores_atributos_material (material_id, atributo_id, valor) VALUES ($1, $2, $3)',
              [dellId, attr.id, valor]
            );
          }
        }
        console.log('   ✓ Notebook Dell Latitude 3520 creada');
      }
    }
    
    console.log('\n✅ Configuración de equipos tecnológicos completada!\n');
    console.log('📋 Categorías creadas:');
    console.log('   - PC de Escritorio (con atributos de hardware)');
    console.log('   - Notebooks (con especificaciones completas)');
    console.log('   - Impresoras (con modelos y características)');
    console.log('   - Monitores (con resolución y conexiones)');
    console.log('   - Periféricos, Redes, Servidores\n');
    console.log('📦 Equipos de ejemplo:');
    console.log('   - Epson L3150 (Multifunción)');
    console.log('   - HP LaserJet Pro M404dn (Láser)');
    console.log('   - Dell Latitude 3520 (Notebook)\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

crearCategoriasEquipos().catch(err => {
  console.error(err);
  process.exit(1);
});
