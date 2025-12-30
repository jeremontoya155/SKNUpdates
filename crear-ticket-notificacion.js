const { Pool } = require('pg');
require('dotenv').config();
const { enviarNotificacionPush } = require('./controllers/apiController');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function crearYAsignarTicket() {
  console.log('\n🎫 CREANDO Y ASIGNANDO NUEVO TICKET\n');
  console.log('='.repeat(60));

  try {
    // 1. Crear un nuevo ticket
    console.log('\n1️⃣ Creando ticket nuevo...');
    
    const nuevoTicket = await pool.query(
      `INSERT INTO tickets 
       (titulo, descripcion, estado, prioridad, empresa_id, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, TIMEZONE('America/Argentina/Buenos_Aires', NOW()))
       RETURNING id, titulo`,
      [
        'Problema de conectividad',
        'El cliente reporta problemas intermitentes de conexión a internet. Verificar router y cableado.',
        'abierto',
        'media',
        1 // ID de empresa (ajusta según tu DB)
      ]
    );

    const ticketId = nuevoTicket.rows[0].id;
    const ticketTitulo = nuevoTicket.rows[0].titulo;

    console.log(`   ✅ Ticket creado exitosamente`);
    console.log(`   🆔 ID: ${ticketId}`);
    console.log(`   📝 Título: ${ticketTitulo}`);
    console.log(`   📊 Estado: abierto`);
    console.log(`   ⚡ Prioridad: media`);

    // 2. Asignar al técnico de prueba (usuario 85)
    console.log('\n2️⃣ Asignando al técnico...');
    
    await pool.query(
      `INSERT INTO tickets_tecnicos (ticket_id, usuario_id, activo)
       VALUES ($1, $2, true)
       ON CONFLICT (ticket_id, usuario_id) DO UPDATE SET activo = true`,
      [ticketId, 85]
    );

    console.log(`   ✅ Ticket asignado al usuario 85 (prueba1@gmail.com)`);

    // 3. Verificar la asignación
    console.log('\n3️⃣ Verificando asignación...');
    
    const verificacion = await pool.query(
      `SELECT 
        t.id,
        t.titulo,
        t.estado,
        t.prioridad,
        u.nombre as tecnico_nombre,
        u.email as tecnico_email
       FROM tickets t
       INNER JOIN tickets_tecnicos tt ON t.id = tt.ticket_id
       INNER JOIN usuarios u ON tt.usuario_id = u.id
       WHERE t.id = $1 AND tt.activo = true`,
      [ticketId]
    );

    if (verificacion.rows.length > 0) {
      const ticket = verificacion.rows[0];
      console.log('   ✅ Asignación confirmada:');
      console.log(`   👤 Técnico: ${ticket.tecnico_nombre}`);
      console.log(`   📧 Email: ${ticket.tecnico_email}`);
    }

    // 4. Listar todos los tickets activos del técnico
    console.log('\n4️⃣ Tickets activos del técnico:');
    
    const ticketsActivos = await pool.query(
      `SELECT 
        t.id,
        t.titulo,
        t.estado,
        t.prioridad,
        t.fecha_creacion
       FROM tickets t
       INNER JOIN tickets_tecnicos tt ON t.id = tt.ticket_id
       WHERE tt.usuario_id = 85 
         AND tt.activo = true
         AND t.estado NOT IN ('cerrado', 'finalizado')
       ORDER BY 
         CASE t.prioridad
           WHEN 'alta' THEN 1
           WHEN 'media' THEN 2
           WHEN 'baja' THEN 3
         END,
         t.fecha_creacion DESC`
    );

    console.log(`   📊 Total: ${ticketsActivos.rows.length} ticket(s)\n`);
    
    ticketsActivos.rows.forEach((t, i) => {
      const prioridadIcon = t.prioridad === 'alta' ? '🔴' : t.prioridad === 'media' ? '🟡' : '🟢';
      console.log(`   ${i + 1}. ${prioridadIcon} Ticket #${t.id}`);
      console.log(`      📝 ${t.titulo}`);
      console.log(`      📊 Estado: ${t.estado}`);
      console.log(`      ⚡ Prioridad: ${t.prioridad}`);
      console.log('');
    });

    // 5. Enviar notificación push
    console.log('='.repeat(60));
    console.log('\n� ENVIANDO NOTIFICACIÓN PUSH...\n');
    
    const notifResult = await enviarNotificacionPush(
      85, // userId del técnico
      '🎫 Nuevo Ticket Asignado',
      `Se te ha asignado el ticket #${ticketId}: ${ticketTitulo}`,
      { 
        ticketId: ticketId,
        type: 'nuevo_ticket'
      }
    );

    if (notifResult.success) {
      console.log('   ✅ Notificación enviada exitosamente');
      console.log(`   � Dispositivos notificados: ${notifResult.tickets?.length || 0}`);
    } else {
      console.log(`   ⚠️  ${notifResult.message || 'No se pudo enviar la notificación'}`);
      console.log('   💡 Asegúrate de que el técnico tenga la app instalada');
      console.log('      y haya dado permisos de notificaciones');
    }

    // 6. Información para testing
    console.log('\n' + '='.repeat(60));
    console.log('\n📱 INFORMACIÓN PARA LA APP MÓVIL:\n');
    console.log(`   🔐 Email: prueba1@gmail.com`);
    console.log(`   🔑 Password: 123456`);
    console.log(`   🆔 User ID: 85`);
    console.log(`   🎫 Nuevo Ticket ID: ${ticketId}`);

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

crearYAsignarTicket();
