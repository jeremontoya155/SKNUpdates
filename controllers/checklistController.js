const pool = require('../database');

const checklistController = {
  // Ver checklist de un ticket (para técnico asignado)
  verChecklist: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const user = req.session.user;

      // Obtener información del ticket
      const ticket = await pool.query(
        `SELECT 
          t.*,
          e.nombre as empresa_nombre,
          s.nombre as situacion_nombre,
          s.descripcion as situacion_descripcion,
          s.requiere_materiales,
          u.nombre as asignado_nombre
         FROM tickets t
         JOIN empresas e ON t.empresa_id = e.id
         LEFT JOIN situaciones_soporte s ON t.situacion_soporte_id = s.id
         LEFT JOIN usuarios u ON t.usuario_asignado = u.id
         WHERE t.id = $1`,
        [ticketId]
      );

      if (ticket.rows.length === 0) {
        return res.status(404).send('Ticket no encontrado');
      }

      const ticketData = ticket.rows[0];

      // Verificar que el usuario es el técnico asignado o un admin
      const esAdmin = ['skn_admin', 'skn_subadmin'].includes(user.rol);
      const esAsignado = ticketData.usuario_asignado === user.id;

      if (!esAdmin && !esAsignado) {
        return res.status(403).send('No tienes permiso para ver este checklist');
      }

      // Si no tiene situación o no requiere materiales, mostrar mensaje
      if (!ticketData.situacion_soporte_id || !ticketData.requiere_materiales) {
        return res.render('checklist/sin-materiales', {
          title: `Checklist - Ticket #${ticketId}`,
          user: req.session.user,
          ticket: ticketData
        });
      }

      // Obtener materiales del checklist
      const materiales = await pool.query(
        `SELECT 
          cm.*,
          tcm.llevado,
          tcm.cantidad_llevada,
          tcm.notas,
          tcm.fecha_registro
         FROM checklist_materiales cm
         LEFT JOIN ticket_checklist_materiales tcm ON cm.id = tcm.material_id AND tcm.ticket_id = $1
         WHERE cm.situacion_id = $2 AND cm.activo = true
         ORDER BY cm.orden, cm.nombre`,
        [ticketId, ticketData.situacion_soporte_id]
      );

      res.render('checklist/ver', {
        title: `Checklist - Ticket #${ticketId}`,
        user: req.session.user,
        ticket: ticketData,
        materiales: materiales.rows,
        message: req.session.message,
        error: req.session.error
      });

      delete req.session.message;
      delete req.session.error;
    } catch (error) {
      console.error('Error al ver checklist:', error);
      res.status(500).send('Error al cargar checklist');
    }
  },

  // Guardar estado del checklist
  guardarChecklist: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const user = req.session.user;
      const materiales = req.body.materiales || []; // Array de { materialId, llevado, cantidad, notas }

      // Verificar permisos
      const ticket = await pool.query(
        'SELECT usuario_asignado FROM tickets WHERE id = $1',
        [ticketId]
      );

      if (ticket.rows.length === 0) {
        return res.status(404).send('Ticket no encontrado');
      }

      const esAdmin = ['skn_admin', 'skn_subadmin'].includes(user.rol);
      const esAsignado = ticket.rows[0].usuario_asignado === user.id;

      if (!esAdmin && !esAsignado) {
        return res.status(403).send('No tienes permiso para guardar este checklist');
      }

      // Procesar cada material (puede venir del formulario como arrays separados)
      const materialIds = Array.isArray(req.body.material_id) ? req.body.material_id : [req.body.material_id].filter(Boolean);
      const llevados = Array.isArray(req.body.llevado) ? req.body.llevado : [req.body.llevado].filter(Boolean);
      const cantidades = Array.isArray(req.body.cantidad) ? req.body.cantidad : [req.body.cantidad].filter(Boolean);
      const notasArray = Array.isArray(req.body.notas) ? req.body.notas : [req.body.notas].filter(Boolean);

      // Guardar cada material
      for (let i = 0; i < materialIds.length; i++) {
        const materialId = materialIds[i];
        const llevado = llevados.includes(materialId.toString());
        const cantidad = parseInt(cantidades[i]) || 0;
        const notas = notasArray[i] || '';

        await pool.query(
          `INSERT INTO ticket_checklist_materiales 
           (ticket_id, material_id, llevado, cantidad_llevada, notas, registrado_por)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (ticket_id, material_id) 
           DO UPDATE SET 
             llevado = $3,
             cantidad_llevada = $4,
             notas = $5,
             registrado_por = $6,
             fecha_registro = CURRENT_TIMESTAMP`,
          [ticketId, materialId, llevado, cantidad, notas, user.id]
        );
      }

      // Verificar si hay materiales obligatorios sin marcar
      const materialesObligatorios = await pool.query(
        `SELECT cm.id, cm.nombre
         FROM tickets t
         JOIN checklist_materiales cm ON cm.situacion_id = t.situacion_soporte_id
         WHERE t.id = $1 AND cm.obligatorio = true
         AND cm.id NOT IN (
           SELECT material_id 
           FROM ticket_checklist_materiales 
           WHERE ticket_id = $1 AND llevado = true
         )`,
        [ticketId]
      );

      if (materialesObligatorios.rows.length > 0) {
        req.session.error = '⚠️ Debes marcar todos los materiales obligatorios antes de continuar';
        return res.redirect(`/checklist/${ticketId}`);
      }

      // Solo guardar el checklist, NO cambiar el estado automáticamente
      req.session.message = '✅ Checklist guardado. Ahora puedes cambiar el ticket a "En Proceso"';
      res.redirect(`/tickets/${ticketId}`);
    } catch (error) {
      console.error('Error al guardar checklist:', error);
      req.session.error = 'Error al guardar checklist';
      res.redirect(`/tickets/${req.params.ticketId}`);
    }
  }
};

module.exports = checklistController;
