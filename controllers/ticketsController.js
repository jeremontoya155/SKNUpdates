const db = require('../database');

const ticketsController = {
  // Listar tickets
  // SKN: Ve TODOS los tickets de todas las empresas
  // Empresa: Solo ve SUS tickets
  index: async (req, res) => {
    try {
      const user = req.session.user;
      const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

      let query;
      let params = [];

      if (esSKN) {
        // SKN ve todos los tickets con información de empresa
        query = `
          SELECT 
            t.*, 
            e.nombre as empresa_nombre,
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre 
          FROM tickets t 
          JOIN empresas e ON t.empresa_id = e.id
          LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
          LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
          ORDER BY 
            CASE t.estado 
              WHEN 'abierto' THEN 1 
              WHEN 'en_proceso' THEN 2 
              WHEN 'cerrado' THEN 3 
            END,
            t.fecha_creacion DESC
        `;
      } else {
        // Empresa solo ve sus tickets
        query = `
          SELECT 
            t.*, 
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre 
          FROM tickets t 
          LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
          LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
          WHERE t.empresa_id = $1 
          ORDER BY t.fecha_creacion DESC
        `;
        params = [user.empresa_id];
      }

      const result = await db.query(query, params);

      res.render('tickets/index', { 
        title: 'Tickets', 
        tickets: result.rows,
        esSKN,
        user
      });
    } catch (error) {
      console.error('Error al listar tickets:', error);
      res.render('tickets/index', { 
        title: 'Tickets', 
        tickets: [],
        esSKN: false,
        user: req.session.user
      });
    }
  },

  // Mostrar formulario de nuevo ticket
  showNuevo: async (req, res) => {
    try {
      const user = req.session.user;
      const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

      let empresas = [];
      
      if (esSKN) {
        // SKN puede crear tickets para cualquier empresa
        const result = await db.query(
          'SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre'
        );
        empresas = result.rows;
      }

      res.render('tickets/nuevo', { 
        title: 'Nuevo Ticket',
        empresas,
        esSKN,
        user,
        error: null
      });
    } catch (error) {
      console.error('Error al mostrar formulario:', error);
      res.status(500).send('Error al cargar formulario');
    }
  },

  // Crear ticket
  crear: async (req, res) => {
    const { titulo, descripcion, prioridad, empresa_id } = req.body;
    const user = req.session.user;
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

    try {
      let empresaFinal;
      
      if (esSKN) {
        // SKN puede asignar a cualquier empresa
        empresaFinal = empresa_id;
      } else {
        // Empresa solo puede crear tickets para sí misma
        empresaFinal = user.empresa_id;
      }

      await db.query(
        `INSERT INTO tickets (empresa_id, usuario_solicitante, titulo, descripcion, prioridad, estado) 
         VALUES ($1, $2, $3, $4, $5, 'abierto')`,
        [empresaFinal, user.id, titulo, descripcion, prioridad || 'media']
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
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

    try {
      let query;
      let params;

      if (esSKN) {
        // SKN puede ver cualquier ticket
        query = `
          SELECT 
            t.*, 
            e.nombre as empresa_nombre,
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre 
          FROM tickets t 
          JOIN empresas e ON t.empresa_id = e.id
          LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
          LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
          WHERE t.id = $1
        `;
        params = [id];
      } else {
        // Empresa solo ve sus tickets
        query = `
          SELECT 
            t.*, 
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre 
          FROM tickets t 
          LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
          LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
          WHERE t.id = $1 AND t.empresa_id = $2
        `;
        params = [id, user.empresa_id];
      }

      const ticket = await db.query(query, params);

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

      // Obtener usuarios SKN para asignar (solo si es SKN)
      let usuariosSKN = [];
      if (esSKN) {
        const result = await db.query(
          `SELECT id, nombre as nombre_completo 
           FROM usuarios 
           WHERE (rol = 'skn_admin' OR rol = 'skn_user') AND activo = true 
           ORDER BY nombre`
        );
        usuariosSKN = result.rows;
      }

      res.render('tickets/detalle', {
        title: 'Detalle Ticket',
        ticket: ticket.rows[0],
        comentarios: comentarios.rows,
        usuariosSKN,
        esSKN,
        user
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

  // Cambiar estado (SOLO SKN)
  cambiarEstado: async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    const user = req.session.user;
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

    try {
      // Solo SKN puede cambiar estado
      if (!esSKN) {
        return res.status(403).send('Solo usuarios SKN pueden cambiar el estado de tickets');
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

  // Asignar ticket (SOLO SKN)
  asignar: async (req, res) => {
    const { id } = req.params;
    const { usuario_asignado } = req.body;
    const user = req.session.user;
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

    try {
      // Solo SKN puede asignar tickets
      if (!esSKN) {
        return res.status(403).send('Solo usuarios SKN pueden asignar tickets');
      }

      await db.query(
        'UPDATE tickets SET usuario_asignado = $1, estado = $2 WHERE id = $3',
        [usuario_asignado, 'en_proceso', id]
      );

      req.session.message = 'Ticket asignado exitosamente';
      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al asignar ticket:', error);
      req.session.error = 'Error al asignar ticket';
      res.redirect(`/tickets/${id}`);
    }
  },

  // Asignarse un ticket a sí mismo (SOLO SKN)
  asignarme: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

    try {
      // Solo SKN puede asignarse tickets
      if (!esSKN) {
        return res.status(403).send('Solo usuarios SKN pueden asignarse tickets');
      }

      await db.query(
        'UPDATE tickets SET usuario_asignado = $1, estado = $2 WHERE id = $3',
        [user.id, 'en_proceso', id]
      );

      req.session.message = 'Te has asignado el ticket exitosamente';
      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al asignarse ticket:', error);
      req.session.error = 'Error al asignarse ticket';
      res.redirect(`/tickets/${id}`);
    }
  }
};

module.exports = ticketsController;
