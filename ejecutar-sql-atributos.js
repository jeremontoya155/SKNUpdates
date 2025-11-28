const db = require('./database');
const fs = require('fs');

async function ejecutarSQL() {
  try {
    console.log('📋 Ejecutando script SQL para atributos dinámicos...');
    
    const sql = fs.readFileSync('./add-atributos-dinamicos.sql', 'utf8');
    
    await db.query(sql);
    
    console.log('✓ Tablas de atributos dinámicos creadas exitosamente');
    console.log('');
    console.log('Ahora puedes:');
    console.log('1. Crear categorías (ej: Notebooks, Impresoras)');
    console.log('2. Definir atributos para cada categoría');
    console.log('3. Al crear materiales, llenar los atributos específicos');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

ejecutarSQL();
