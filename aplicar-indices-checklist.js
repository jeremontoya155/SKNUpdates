const fs = require('fs');
const db = require('./database');

async function aplicarIndices() {
  try {
    console.log('📊 Aplicando índices para checklist...\n');
    
    const sql = fs.readFileSync('./migrations/add_checklist_indexes.sql', 'utf8');
    await db.query(sql);
    
    console.log('✅ Índices creados exitosamente\n');
    
    const indices = await db.query(
      `SELECT indexname, indexdef 
       FROM pg_indexes 
       WHERE tablename = 'ticket_checklist_materiales'`
    );
    
    console.log('📋 Índices en ticket_checklist_materiales:');
    console.table(indices.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
}

aplicarIndices();
