require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function ejecutarActualizacion() {
  const client = await pool.connect();
  
  try {
    console.log('Conectando a la base de datos...');
    
    console.log('0. Eliminando constraint de roles antiguo...');
    await client.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check');
    
    console.log('1. Actualizando roles existentes...');
    await client.query("UPDATE usuarios SET rol = 'skn_admin' WHERE rol = 'admin'");
    await client.query("UPDATE usuarios SET rol = 'empresa_user' WHERE rol = 'usuario'");
    await client.query("UPDATE usuarios SET rol = 'skn_user' WHERE rol = 'tecnico'");
    
    console.log('1.1. Agregando nuevo constraint de roles...');
    await client.query(`
      ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
      CHECK (rol IN ('skn_admin', 'skn_user', 'empresa_admin', 'empresa_user'))
    `);
    
    console.log('2. Agregando campos a materiales...');
    await client.query('ALTER TABLE materiales ADD COLUMN IF NOT EXISTS es_plantilla BOOLEAN DEFAULT FALSE');
    await client.query('ALTER TABLE materiales ADD COLUMN IF NOT EXISTS plantilla_nombre VARCHAR(255)');
    
    console.log('3. Creando índices...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_materiales_nombre ON materiales(nombre)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_materiales_codigo ON materiales(codigo)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_materiales_categoria ON materiales(categoria_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_materiales_empresa ON materiales(empresa_id)');
    
    console.log('4. Creando tabla de plantillas copiadas...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS materiales_desde_plantilla (
        id SERIAL PRIMARY KEY,
        material_id INTEGER NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
        plantilla_id INTEGER NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
        fecha_copia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(material_id, plantilla_id)
      )
    `);
    
    console.log('5. Creando materiales plantilla...');
    
    // Obtener categoria de Electrónica
    const catResult = await client.query("SELECT id FROM categorias_materiales WHERE nombre = 'Electrónica' LIMIT 1");
    const categoriaId = catResult.rows[0]?.id;
    
    if (categoriaId) {
      // Notebook
      await client.query(`
        INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
        SELECT 'Notebook Corporativa', 'Plantilla genérica de notebook para uso corporativo', 'PLANTILLA-NB-001', 0, 5, 'unidad', $1, 1, TRUE, 'Notebook Estándar'
        WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-NB-001')
      `, [categoriaId]);
      
      // Impresora
      await client.query(`
        INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
        SELECT 'Impresora Multifunción', 'Plantilla genérica de impresora multifunción', 'PLANTILLA-IMP-001', 0, 2, 'unidad', $1, 1, TRUE, 'Impresora Estándar'
        WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-IMP-001')
      `, [categoriaId]);
      
      // Monitor
      await client.query(`
        INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
        SELECT 'Monitor LED', 'Plantilla genérica de monitor LED', 'PLANTILLA-MON-001', 0, 3, 'unidad', $1, 1, TRUE, 'Monitor Estándar'
        WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-MON-001')
      `, [categoriaId]);
      
      // Teclado Mouse
      await client.query(`
        INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
        SELECT 'Kit Teclado + Mouse', 'Plantilla genérica de kit teclado y mouse', 'PLANTILLA-TM-001', 0, 10, 'unidad', $1, 1, TRUE, 'Teclado Mouse Estándar'
        WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-TM-001')
      `, [categoriaId]);
      
      // Router
      await client.query(`
        INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
        SELECT 'Router Wi-Fi', 'Plantilla genérica de router wifi corporativo', 'PLANTILLA-RTR-001', 0, 2, 'unidad', $1, 1, TRUE, 'Router Estándar'
        WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-RTR-001')
      `, [categoriaId]);
    }
    
    console.log('6. Actualizando usuario admin de SKN...');
    await client.query("UPDATE usuarios SET rol = 'skn_admin' WHERE email = 'admin@skn.com'");
    
    console.log('\n✅ Actualización completada exitosamente');
    console.log('\nNuevos roles disponibles:');
    console.log('- skn_admin: Administrador de SKN (acceso total)');
    console.log('- skn_user: Usuario de SKN (ver todo, crear tickets)');
    console.log('- empresa_admin: Administrador de empresa (gestionar su empresa e inventario)');
    console.log('- empresa_user: Usuario de empresa (ver su empresa, crear tickets)');
    console.log('\nMateriales plantilla creados para SKN');
    
  } catch (error) {
    console.error('❌ Error al ejecutar actualización:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

ejecutarActualizacion().catch(err => {
  console.error(err);
  process.exit(1);
});

