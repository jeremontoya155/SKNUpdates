const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function asignarTicketPrueba() {
  console.log('\n🎫 ASIGNANDO TICKET DE PRUEBA AL USUARIO 85\n');
  console.log('='.repeat(60));

  try {
    // 1. Buscar un ticket abierto o en proceso
    const ticketDisponible = await pool.query(
      `SELECT id, titulo, estado 
       FROM tickets 
       WHERE estado IN ('abierto', 'en_proceso') 
       LIMIT 1`
    );

    if (ticketDisponible.rows.length === 0) {
      console.log('⚠️  No hay tickets disponibles. Creando uno nuevo...\n');
      
      // Crear un ticket de prueba
      const nuevoTicket = await pool.query(
        `INSERT INTO tickets 
         (titulo, descripcion, estado, prioridad, empresa_id, fecha_creacion)
         VALUES ($1, $2, $3, $4, $5, TIMEZONE('America/Argentina/Buenos_Aires', NOW()))
         RETURNING id`,
        ['Ticket de prueba - App móvil', 'Este es un ticket de prueba para la app móvil', 'abierto', 'baja', 1]
      );

      const ticketId = nuevoTicket.rows[0].id;
      console.log(`✅ Ticket creado: #${ticketId}`);

      // Asignar al usuario 85
      await pool.query(
        `INSERT INTO tickets_tecnicos (ticket_id, usuario_id, activo)
         VALUES ($1, $2, true)
         ON CONFLICT (ticket_id, usuario_id) DO UPDATE SET activo = true`,
        [ticketId, 85]
      );

      console.log(`✅ Ticket #${ticketId} asignado al usuario 85 (prueba1@gmail.com)`);

    } else {
      const ticket = ticketDisponible.rows[0];
      console.log(`✅ Ticket encontrado: #${ticket.id} - ${ticket.titulo}`);
      console.log(`   Estado: ${ticket.estado}\n`);

      // Asignar al usuario 85
      await pool.query(
        `INSERT INTO tickets_tecnicos (ticket_id, usuario_id, activo)
         VALUES ($1, $2, true)
         ON CONFLICT (ticket_id, usuario_id) DO UPDATE SET activo = true`,
        [ticket.id, 85]
      );

      console.log(`✅ Ticket #${ticket.id} asignado al usuario 85 (prueba1@gmail.com)`);
    }

    // Verificar asignación
    console.log('\n📋 Tickets asignados al usuario 85:');
    const asignados = await pool.query(
      `SELECT t.id, t.titulo, t.estado 
       FROM tickets t
       INNER JOIN tickets_tecnicos tt ON t.id = tt.ticket_id
       WHERE tt.usuario_id = 85 AND tt.activo = true`
    );

    asignados.rows.forEach((t, i) => {
      console.log(`   ${i + 1}. Ticket #${t.id} - ${t.titulo} (${t.estado})`);
    });

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

asignarTicketPrueba();
