const pool = require('../database');

const situacionesController = {
  // Listar todas las situaciones (SOLO SKN ADMIN)
  index: async (req, res) => {
    try {
      const { rol } = req.session.user;
      
      if (rol !== 'skn_admin') {
        return res.status(403).send('Solo administradores de SKN pueden gestionar situaciones');
      }

      const { tipo } = req.query;
      
      let query = `
        SELECT 
          s.*,
          u.nombre as creador_nombre,
          COUNT(DISTINCT c.id) as total_materiales,
          COUNT(DISTINCT t.id) as total_tickets
        FROM situaciones_soporte s
        LEFT JOIN usuarios u ON s.creado_por = u.id
        LEFT JOIN checklist_materiales c ON s.id = c.situacion_id
        LEFT JOIN tickets t ON s.id = t.situacion_soporte_id
      `;
      
      const params = [];
      if (tipo && (tipo === 'presencial' || tipo === 'remoto')) {
        query += ` WHERE s.tipo_soporte = $1`;
        params.push(tipo);
      }
      
      query += ` GROUP BY s.id, u.nombre ORDER BY s.tipo_soporte, s.orden, s.nombre`;

      const result = await pool.query(query, params);

      res.render('situaciones/index', {
        title: 'Gestión de Situaciones de Soporte',
        user: req.session.user,
        situaciones: result.rows,
        filtro: tipo || 'todas',
        message: req.session.message,
        error: req.session.error
      });

      delete req.session.message;
      delete req.session.error;
    } catch (error) {
      console.error('Error al listar situaciones:', error);
      res.status(500).send('Error al cargar situaciones');
    }
  },

  // Mostrar formulario de nueva situación
  showNueva: (req, res) => {
    const { rol } = req.session.user;
    
    if (rol !== 'skn_admin') {
      return res.status(403).send('Solo administradores de SKN pueden crear situaciones');
    }

    res.render('situaciones/nueva', {
      title: 'Nueva Situación de Soporte',
      user: req.session.user,
      error: null
    });
  },

  // Crear nueva situación
  crear: async (req, res) => {
    try {
      const { rol, id: userId } = req.session.user;
      
      if (rol !== 'skn_admin') {
        return res.status(403).send('Solo administradores de SKN pueden crear situaciones');
      }

      const { 
        nombre, 
        descripcion, 
        tipo_soporte, 
        requiere_materiales, 
        color, 
        orden 
      } = req.body;

      // Validar que tipo_soporte sea válido
      if (!['presencial', 'remoto'].includes(tipo_soporte)) {
        return res.render('situaciones/nueva', {
          title: 'Nueva Situación de Soporte',
          user: req.session.user,
          error: 'Tipo de soporte inválido'
        });
      }

      // Si es remoto, no puede requerir materiales
      const requiereMateriales = tipo_soporte === 'presencial' && requiere_materiales === 'on';

      const result = await pool.query(
        `INSERT INTO situaciones_soporte 
         (nombre, descripcion, tipo_soporte, requiere_materiales, color, orden, creado_por) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [nombre, descripcion, tipo_soporte, requiereMateriales, color || '#3498db', orden || 0, userId]
      );

      req.session.message = 'Situación creada exitosamente';
      res.redirect(`/situaciones/${result.rows[0].id}`);
    } catch (error) {
      console.error('Error al crear situación:', error);
      res.render('situaciones/nueva', {
        title: 'Nueva Situación de Soporte',
        user: req.session.user,
        error: 'Error al crear situación'
      });
    }
  },

  // Ver detalle de situación con sus materiales
  detalle: async (req, res) => {
    try {
      const { id } = req.params;
      const { rol } = req.session.user;

      if (rol !== 'skn_admin') {
        return res.status(403).send('Solo administradores de SKN pueden ver detalles');
      }

      // Obtener situación
      const situacion = await pool.query(
        `SELECT s.*, u.nombre as creador_nombre
         FROM situaciones_soporte s
         LEFT JOIN usuarios u ON s.creado_por = u.id
         WHERE s.id = $1`,
        [id]
      );

      if (situacion.rows.length === 0) {
        return res.status(404).send('Situación no encontrada');
      }

      // Obtener materiales del checklist
      const materiales = await pool.query(
        `SELECT * FROM checklist_materiales 
         WHERE situacion_id = $1 
         ORDER BY orden, nombre`,
        [id]
      );

      // Obtener tickets que usan esta situación
      const tickets = await pool.query(
        `SELECT t.id, t.titulo, t.estado, e.nombre as empresa_nombre
         FROM tickets t
         JOIN empresas e ON t.empresa_id = e.id
         WHERE t.situacion_soporte_id = $1
         ORDER BY t.fecha_creacion DESC
         LIMIT 10`,
        [id]
      );

      res.render('situaciones/detalle', {
        title: situacion.rows[0].nombre,
        user: req.session.user,
        situacion: situacion.rows[0],
        materiales: materiales.rows,
        tickets: tickets.rows,
        message: req.session.message,
        error: req.session.error
      });

      delete req.session.message;
      delete req.session.error;
    } catch (error) {
      console.error('Error al ver detalle:', error);
      res.status(500).send('Error al cargar detalle');
    }
  },

  // Mostrar formulario de edición
  showEditar: async (req, res) => {
    try {
      const { id } = req.params;
      const { rol } = req.session.user;

      if (rol !== 'skn_admin') {
        return res.status(403).send('Solo administradores de SKN pueden editar situaciones');
      }

      const result = await pool.query('SELECT * FROM situaciones_soporte WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).send('Situación no encontrada');
      }

      res.render('situaciones/editar', {
        title: 'Editar Situación',
        user: req.session.user,
        situacion: result.rows[0],
        error: null
      });
    } catch (error) {
      console.error('Error al mostrar formulario de edición:', error);
      res.status(500).send('Error al cargar formulario');
    }
  },

  // Actualizar situación
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { rol } = req.session.user;

      if (rol !== 'skn_admin') {
        return res.status(403).send('Solo administradores de SKN pueden actualizar situaciones');
      }

      const { 
        nombre, 
        descripcion, 
        tipo_soporte, 
        requiere_materiales, 
        color, 
        orden,
        activo
      } = req.body;

      // Si es remoto, no puede requerir materiales
      const requiereMateriales = tipo_soporte === 'presencial' && requiere_materiales === 'on';
      const estaActivo = activo === 'on';

      await pool.query(
        `UPDATE situaciones_soporte 
         SET nombre = $1, descripcion = $2, tipo_soporte = $3, requiere_materiales = $4, 
             color = $5, orden = $6, activo = $7, fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [nombre, descripcion, tipo_soporte, requiereMateriales, color, orden || 0, estaActivo, id]
      );

      req.session.message = 'Situación actualizada exitosamente';
      res.redirect(`/situaciones/${id}`);
    } catch (error) {
      console.error('Error al actualizar situación:', error);
      const situacion = await pool.query('SELECT * FROM situaciones_soporte WHERE id = $1', [req.params.id]);
      res.render('situaciones/editar', {
        title: 'Editar Situación',
        user: req.session.user,
        situacion: situacion.rows[0],
        error: 'Error al actualizar situación'
      });
    }
  },

  // Eliminar situación (soft delete)
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const { rol } = req.session.user;

      if (rol !== 'skn_admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      await pool.query('UPDATE situaciones_soporte SET activo = false WHERE id = $1', [id]);

      req.session.message = 'Situación desactivada';
      res.redirect('/situaciones');
    } catch (error) {
      console.error('Error al eliminar situación:', error);
      req.session.error = 'Error al eliminar situación';
      res.redirect('/situaciones');
    }
  },

  // ========== GESTIÓN DE MATERIALES ==========

  // Agregar material al checklist
  agregarMaterial: async (req, res) => {
    try {
      const { id: situacionId } = req.params;
      const { rol } = req.session.user;

      if (rol !== 'skn_admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const { nombre, descripcion, obligatorio, cantidad_sugerida, orden } = req.body;

      await pool.query(
        `INSERT INTO checklist_materiales 
         (situacion_id, nombre, descripcion, obligatorio, cantidad_sugerida, orden) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          situacionId, 
          nombre, 
          descripcion, 
          obligatorio === 'on', 
          cantidad_sugerida || 1, 
          orden || 0
        ]
      );

      req.session.message = 'Material agregado al checklist';
      res.redirect(`/situaciones/${situacionId}`);
    } catch (error) {
      console.error('Error al agregar material:', error);
      req.session.error = 'Error al agregar material';
      res.redirect(`/situaciones/${req.params.id}`);
    }
  },

  // Actualizar material del checklist
  actualizarMaterial: async (req, res) => {
    try {
      const { id: situacionId, materialId } = req.params;
      const { rol } = req.session.user;

      if (rol !== 'skn_admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const { nombre, descripcion, obligatorio, cantidad_sugerida, orden, activo } = req.body;

      await pool.query(
        `UPDATE checklist_materiales 
         SET nombre = $1, descripcion = $2, obligatorio = $3, cantidad_sugerida = $4, 
             orden = $5, activo = $6
         WHERE id = $7 AND situacion_id = $8`,
        [
          nombre, 
          descripcion, 
          obligatorio === 'on', 
          cantidad_sugerida || 1, 
          orden || 0,
          activo === 'on',
          materialId,
          situacionId
        ]
      );

      req.session.message = 'Material actualizado';
      res.redirect(`/situaciones/${situacionId}`);
    } catch (error) {
      console.error('Error al actualizar material:', error);
      req.session.error = 'Error al actualizar material';
      res.redirect(`/situaciones/${req.params.id}`);
    }
  },

  // Eliminar material
  eliminarMaterial: async (req, res) => {
    try {
      const { id: situacionId, materialId } = req.params;
      const { rol } = req.session.user;

      if (rol !== 'skn_admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      await pool.query(
        'DELETE FROM checklist_materiales WHERE id = $1 AND situacion_id = $2',
        [materialId, situacionId]
      );

      req.session.message = 'Material eliminado';
      res.redirect(`/situaciones/${situacionId}`);
    } catch (error) {
      console.error('Error al eliminar material:', error);
      req.session.error = 'Error al eliminar material';
      res.redirect(`/situaciones/${req.params.id}`);
    }
  }
};

module.exports = situacionesController;
