const db = require('../database');

const visitasController = {
  // Listar visitas
  index: async (req, res) => {
    try {
      const user = req.session.user;
      const { buscar, estado, fecha_desde, fecha_hasta } = req.query;

      let query = `
        SELECT v.*, u.nombre as visitado_nombre 
        FROM visitas v 
        LEFT JOIN usuarios u ON v.usuario_visitado = u.id 
        WHERE v.empresa_id = $1
      `;
      
      const params = [user.empresa_id];
      let paramIndex = 2;

      // Filtro por búsqueda
      if (buscar) {
        query += ` AND (LOWER(v.visitante_nombre) LIKE LOWER($${paramIndex}) OR LOWER(v.visitante_empresa) LIKE LOWER($${paramIndex}))`;
        params.push(`%${buscar}%`);
        paramIndex++;
      }

      // Filtro por estado
      if (estado) {
        query += ` AND v.estado = $${paramIndex}`;
        params.push(estado);
        paramIndex++;
      }

      // Filtro por fecha desde
      if (fecha_desde) {
        query += ` AND v.fecha_visita >= $${paramIndex}`;
        params.push(fecha_desde);
        paramIndex++;
      }

      // Filtro por fecha hasta
      if (fecha_hasta) {
        query += ` AND v.fecha_visita <= $${paramIndex}::date + interval '1 day'`;
        params.push(fecha_hasta);
        paramIndex++;
      }

      query += ` ORDER BY v.fecha_visita DESC`;

      const result = await db.query(query, params);

      res.render('visitas/index', { 
        title: 'Visitas', 
        visitas: result.rows,
        filtros: { buscar, estado, fecha_desde, fecha_hasta }
      });
    } catch (error) {
      console.error('Error al listar visitas:', error);
      res.render('visitas/index', { 
        title: 'Visitas', 
        visitas: [],
        filtros: {}
      });
    }
  },

  // Mostrar formulario de nueva visita
  showNuevo: async (req, res) => {
    try {
      const user = req.session.user;
      const usuarios = await db.query(
        'SELECT id, nombre FROM usuarios WHERE empresa_id = $1 AND activo = true ORDER BY nombre',
        [user.empresa_id]
      );

      res.render('visitas/nuevo', { title: 'Nueva Visita', usuarios: usuarios.rows });
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      res.render('visitas/nuevo', { title: 'Nueva Visita', usuarios: [] });
    }
  },

  // Crear visita
  crear: async (req, res) => {
    const { usuario_visitado, visitante_nombre, visitante_empresa, visitante_documento, motivo_visita, fecha_visita } = req.body;
    const user = req.session.user;

    try {
      await db.query(
        `INSERT INTO visitas (empresa_id, usuario_visitado, visitante_nombre, visitante_empresa, visitante_documento, motivo_visita, fecha_visita) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.empresa_id, usuario_visitado, visitante_nombre, visitante_empresa, visitante_documento, motivo_visita, fecha_visita]
      );

      req.session.message = 'Visita registrada exitosamente';
      res.redirect('/visitas');
    } catch (error) {
      console.error('Error al crear visita:', error);
      req.session.error = 'Error al crear visita';
      res.redirect('/visitas/nuevo');
    }
  },

  // Ver detalle de visita
  detalle: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      const result = await db.query(
        `SELECT v.*, u.nombre as visitado_nombre 
         FROM visitas v 
         LEFT JOIN usuarios u ON v.usuario_visitado = u.id 
         WHERE v.id = $1 AND v.empresa_id = $2`,
        [id, user.empresa_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).send('Visita no encontrada');
      }

      res.render('visitas/detalle', {
        title: 'Detalle Visita',
        visita: result.rows[0]
      });
    } catch (error) {
      console.error('Error al ver detalle:', error);
      res.redirect('/visitas');
    }
  },

  // Cambiar estado de visita
  cambiarEstado: async (req, res) => {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    const user = req.session.user;

    try {
      // Verificar que la visita pertenece a la empresa
      const visita = await db.query('SELECT empresa_id FROM visitas WHERE id = $1', [id]);
      if (visita.rows.length === 0 || visita.rows[0].empresa_id !== user.empresa_id) {
        return res.status(403).send('No tienes permisos');
      }

      await db.query(
        'UPDATE visitas SET estado = $1, observaciones = $2 WHERE id = $3',
        [estado, observaciones, id]
      );

      req.session.message = 'Estado de visita actualizado';
      res.redirect(`/visitas/${id}`);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      req.session.error = 'Error al cambiar estado';
      res.redirect(`/visitas/${id}`);
    }
  }
};

module.exports = visitasController;
