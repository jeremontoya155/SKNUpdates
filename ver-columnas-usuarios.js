const db = require('./database');

db.query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'usuarios' 
  ORDER BY ordinal_position
`).then(r => {
  console.log('\n📋 COLUMNAS DE LA TABLA USUARIOS:\n');
  r.rows.forEach(c => console.log('  ✓', c.column_name.padEnd(25), '|', c.data_type));
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
