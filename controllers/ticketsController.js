const db = require('../database');

const ticketsController = {
  // Listar tickets
  index: async (req, res) => {
    try {
      const user = req.session.user;
      const result = await db.query(
        `SELECT t.*, u.nombre as solicitante_nombre, ua.nombre as asignado_nombre 
         FROM tickets t 
         LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
         LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
         WHERE t.empresa_id = $1 
         ORDER BY t.fecha_creacion DESC`,
        [user.empresa_id]
      );

      res.render('tickets/index', { title: 'Tickets', tickets: result.rows });
    } catch (error) {
      console.error('Error al listar tickets:', error);
      res.render('tickets/index', { title: 'Tickets', tickets: [] });
    }
  },

  // Mostrar formulario de nuevo ticket
  showNuevo: (req, res) => {
    res.render('tickets/nuevo', { title: 'Nuevo Ticket' });
  },

  // Crear ticket
  crear: async (req, res) => {
    const { titulo, descripcion, prioridad } = req.body;
    const user = req.session.user;

    try {
      await db.query(
        `INSERT INTO tickets (empresa_id, usuario_solicitante, titulo, descripcion, prioridad) 
         VALUES ($1, $2, $3, $4, $5)`,
        [user.empresa_id, user.id, titulo, descripcion, prioridad || 'media']
      );

      req.session.message = 'Ticket creado exitosamente';
      res.redirect('/tickets');
    } catch (error) {
      console.error('Error al crear ticket:', error);
      req.session.error = 'Error al crear ticket';
      res.redirect('/tickets/nuevo');
    }
  },

  // Ver detalle de ticket
  detalle: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      // Obtener ticket
      const ticket = await db.query(
        `SELECT t.*, u.nombre as solicitante_nombre, ua.nombre as asignado_nombre 
         FROM tickets t 
         LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
         LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
         WHERE t.id = $1 AND t.empresa_id = $2`,
        [id, user.empresa_id]
      );

      if (ticket.rows.length === 0) {
        return res.status(404).send('Ticket no encontrado');
      }

      // Obtener comentarios
      const comentarios = await db.query(
        `SELECT c.*, u.nombre as usuario_nombre 
         FROM comentarios_tickets c 
         LEFT JOIN usuarios u ON c.usuario_id = u.id 
         WHERE c.ticket_id = $1 
         ORDER BY c.fecha_comentario ASC`,
        [id]
      );

      // Obtener usuarios de la empresa para asignar
      const usuarios = await db.query(
        'SELECT id, nombre FROM usuarios WHERE empresa_id = $1 AND activo = true ORDER BY nombre',
        [user.empresa_id]
      );

      res.render('tickets/detalle', {
        title: 'Detalle Ticket',
        ticket: ticket.rows[0],
        comentarios: comentarios.rows,
        usuarios: usuarios.rows
      });
    } catch (error) {
      console.error('Error al ver detalle:', error);
      res.redirect('/tickets');
    }
  },

  // Agregar comentario
  agregarComentario: async (req, res) => {
    const { ticket_id, comentario } = req.body;
    const user = req.session.user;

    try {
      await db.query(
        'INSERT INTO comentarios_tickets (ticket_id, usuario_id, comentario) VALUES ($1, $2, $3)',
        [ticket_id, user.id, comentario]
      );

      req.session.message = 'Comentario agregado';
      res.redirect(`/tickets/${ticket_id}`);
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      req.session.error = 'Error al agregar comentario';
      res.redirect(`/tickets/${ticket_id}`);
    }
  },

  // Cambiar estado
  cambiarEstado: async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const user = req.session.user;

    try {
      // Verificar que el ticket pertenece a la empresa
      const ticket = await db.query('SELECT empresa_id FROM tickets WHERE id = $1', [id]);
      if (ticket.rows.length === 0 || ticket.rows[0].empresa_id !== user.empresa_id) {
        return res.status(403).send('No tienes permisos');
      }

      // Si el estado es cerrado, actualizar fecha de cierre
      if (estado === 'cerrado') {
        await db.query(
          'UPDATE tickets SET estado = $1, fecha_cierre = NOW() WHERE id = $2',
          [estado, id]
        );
      } else {
        await db.query(
          'UPDATE tickets SET estado = $1, fecha_cierre = NULL WHERE id = $2',
          [estado, id]
        );
      }

      req.session.message = 'Estado actualizado';
      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      req.session.error = 'Error al cambiar estado';
      res.redirect(`/tickets/${id}`);
    }
  },

  // Asignar ticket
  asignar: async (req, res) => {
    const { id } = req.params;
    const { usuario_asignado } = req.body;
    const user = req.session.user;

    try {
      // Verificar que el ticket pertenece a la empresa
      const ticket = await db.query('SELECT empresa_id FROM tickets WHERE id = $1', [id]);
      if (ticket.rows.length === 0 || ticket.rows[0].empresa_id !== user.empresa_id) {
        return res.status(403).send('No tienes permisos');
      }

      await db.query(
        'UPDATE tickets SET usuario_asignado = $1, estado = $2 WHERE id = $3',
        [usuario_asignado, 'en_proceso', id]
      );

      req.session.message = 'Ticket asignado';
      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al asignar ticket:', error);
      req.session.error = 'Error al asignar ticket';
      res.redirect(`/tickets/${id}`);
    }
  }
};

module.exports = ticketsController;
