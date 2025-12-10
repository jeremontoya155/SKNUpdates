const db = require('../database');
const { deleteImage, getThumbnailUrl, getPreviewUrl } = require('../config/cloudinary');

const ticketsController = {
  // Listar tickets
  // SKN: Ve TODOS los tickets de todas las empresas
  // Empresa: Solo ve SUS tickets
  index: async (req, res) => {
    try {
      const user = req.session.user;
      const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';
      const { buscar, estado, prioridad, empresa, fecha_desde, fecha_hasta } = req.query;

      let query;
      let params = [];
      let paramIndex = 1;

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
          WHERE 1=1
        `;
        
        // Filtro por empresa (solo para SKN)
        if (empresa) {
          query += ` AND t.empresa_id = $${paramIndex}`;
          params.push(parseInt(empresa, 10));
          paramIndex++;
        }
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
          WHERE t.empresa_id = $${paramIndex}
        `;
        params = [user.empresa_id];
        paramIndex++;
      }

      // Filtro por búsqueda
      if (buscar) {
        query += ` AND (LOWER(t.titulo) LIKE LOWER($${paramIndex}) OR LOWER(t.descripcion) LIKE LOWER($${paramIndex}))`;
        params.push(`%${buscar}%`);
        paramIndex++;
      }

      // Filtro por estado
      if (estado) {
        query += ` AND t.estado = $${paramIndex}`;
        params.push(estado);
        paramIndex++;
      }

      // Filtro por prioridad
      if (prioridad) {
        query += ` AND t.prioridad = $${paramIndex}`;
        params.push(prioridad);
        paramIndex++;
      }

      // Filtro por fecha desde
      if (fecha_desde) {
        query += ` AND t.fecha_creacion >= $${paramIndex}`;
        params.push(fecha_desde);
        paramIndex++;
      }

      // Filtro por fecha hasta
      if (fecha_hasta) {
        query += ` AND t.fecha_creacion <= $${paramIndex}::date + interval '1 day'`;
        params.push(fecha_hasta);
        paramIndex++;
      }

      query += ` ORDER BY 
        CASE t.estado 
          WHEN 'abierto' THEN 1 
          WHEN 'en_proceso' THEN 2 
          WHEN 'cerrado' THEN 3 
        END,
        t.fecha_creacion DESC
      `;

      const result = await db.query(query, params);

      // Obtener lista de empresas para SKN
      let empresas = [];
      if (esSKN) {
        const empresasResult = await db.query(
          'SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre'
        );
        empresas = empresasResult.rows;
      }

      res.render('tickets/index', { 
        title: 'Tickets', 
        tickets: result.rows,
        esSKN,
        empresas,
        filtros: { buscar, estado, prioridad, empresa, fecha_desde, fecha_hasta },
        user
      });
    } catch (error) {
      console.error('Error al listar tickets:', error);
      res.render('tickets/index', { 
        title: 'Tickets', 
        tickets: [],
        esSKN: false,
        empresas: [],
        filtros: {},
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

      // Obtener tipos de trabajo activos
      const tiposTrabajo = await db.query(
        'SELECT id, nombre, descripcion, requiere_instalacion FROM tipos_trabajo WHERE activo = true ORDER BY nombre'
      );

      res.render('tickets/nuevo', { 
        title: 'Nuevo Ticket',
        empresas,
        tiposTrabajo: tiposTrabajo.rows,
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
    const { titulo, descripcion, prioridad, empresa_id, tipo_soporte, tipo_trabajo_id } = req.body;
    const user = req.session.user;
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';
    const file = req.file; // Imagen inicial

    try {
      // Validación: Si es soporte físico, la imagen es OBLIGATORIA
      if (tipo_soporte === 'fisico' && !file) {
        req.session.error = 'Para tickets de soporte físico es obligatorio adjuntar una imagen del problema';
        return res.redirect('/tickets/nuevo');
      }

      let empresaFinal;
      
      if (esSKN) {
        // SKN puede asignar a cualquier empresa
        empresaFinal = empresa_id;
      } else {
        // Empresa solo puede crear tickets para sí misma
        empresaFinal = user.empresa_id;
      }

      // Insertar ticket con tipo de soporte y tipo de trabajo
      const ticketResult = await db.query(
        `INSERT INTO tickets (empresa_id, usuario_solicitante, titulo, descripcion, prioridad, estado, tipo_soporte, tipo_trabajo_id) 
         VALUES ($1, $2, $3, $4, $5, 'abierto', $6, $7) RETURNING id`,
        [empresaFinal, user.id, titulo, descripcion, prioridad || 'media', tipo_soporte || 'remoto', tipo_trabajo_id || null]
      );

      const ticketId = ticketResult.rows[0].id;

      // Si hay imagen inicial, guardarla
      if (file) {
        const ruta = file.path; // URL de Cloudinary
        const publicId = file.filename; // Public ID de Cloudinary
        
        await db.query(
          `INSERT INTO tickets_imagenes (ticket_id, nombre_archivo, ruta_archivo, mime_type, tamanio, subido_por, descripcion, cloudinary_id, tipo_imagen)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'inicial')`,
          [ticketId, file.originalname, ruta, file.mimetype, file.size, user.id, 'Imagen inicial del problema', publicId]
        );
      }

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
            ua.nombre as asignado_nombre,
            tt.nombre as tipo_trabajo_nombre,
            tt.descripcion as tipo_trabajo_descripcion,
            tt.color as tipo_trabajo_color
          FROM tickets t 
          JOIN empresas e ON t.empresa_id = e.id
          LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
          LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
          LEFT JOIN tipos_trabajo tt ON t.tipo_trabajo_id = tt.id
          WHERE t.id = $1
        `;
        params = [id];
      } else {
        // Empresa solo ve sus tickets
        query = `
          SELECT 
            t.*, 
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre,
            tt.nombre as tipo_trabajo_nombre,
            tt.descripcion as tipo_trabajo_descripcion,
            tt.color as tipo_trabajo_color
          FROM tickets t 
          LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
          LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
          LEFT JOIN tipos_trabajo tt ON t.tipo_trabajo_id = tt.id
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

      // Obtener imágenes del ticket
      const imagenes = await db.query(
        `SELECT ti.*, u.nombre as subido_por_nombre
         FROM tickets_imagenes ti
         LEFT JOIN usuarios u ON ti.subido_por = u.id
         WHERE ti.ticket_id = $1
         ORDER BY ti.fecha_subida DESC`,
        [id]
      );

      res.render('tickets/detalle', {
        title: 'Detalle Ticket',
        ticket: ticket.rows[0],
        comentarios: comentarios.rows,
        imagenes: imagenes.rows,
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
  },

  // Subir imagen a ticket
  subirImagen: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;
    const file = req.file;
    const { tipo_imagen, descripcion } = req.body;

    try {
      if (!file) {
        req.session.error = 'No se seleccionó ninguna imagen';
        return res.redirect(`/tickets/${id}`);
      }

      // Verificar que el usuario tenga acceso al ticket
      const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';
      let ticketQuery;
      let ticketParams;

      if (esSKN) {
        ticketQuery = 'SELECT id, tipo_soporte FROM tickets WHERE id = $1';
        ticketParams = [id];
      } else {
        ticketQuery = 'SELECT id, tipo_soporte FROM tickets WHERE id = $1 AND empresa_id = $2';
        ticketParams = [id, user.empresa_id];
      }

      const ticketResult = await db.query(ticketQuery, ticketParams);
      
      if (ticketResult.rows.length === 0) {
        req.session.error = 'No tienes acceso a este ticket';
        return res.redirect('/tickets');
      }

      const ticket = ticketResult.rows[0];

      // Validar tipo de imagen según tipo de soporte
      const tipoImagenFinal = tipo_imagen || 'general';
      if (ticket.tipo_soporte === 'remoto' && ['antes', 'durante', 'despues'].includes(tipoImagenFinal)) {
        req.session.error = 'Solo los tickets de soporte físico pueden tener imágenes de antes/durante/después';
        return res.redirect(`/tickets/${id}`);
      }

      // Guardar información de la imagen en la BD
      // Con Cloudinary, file.path contiene la URL completa de la imagen
      const ruta = file.path; // URL de Cloudinary
      const publicId = file.filename; // Public ID de Cloudinary
      
      await db.query(
        `INSERT INTO tickets_imagenes (ticket_id, nombre_archivo, ruta_archivo, mime_type, tamanio, subido_por, descripcion, cloudinary_id, tipo_imagen)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, file.originalname, ruta, file.mimetype, file.size, user.id, descripcion || '', publicId, tipoImagenFinal]
      );

      req.session.message = 'Imagen subida exitosamente';
      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      req.session.error = 'Error al subir imagen';
      res.redirect(`/tickets/${id}`);
    }
  },

  // Eliminar imagen (solo quien la subió o SKN)
  eliminarImagen: async (req, res) => {
    const { id, imagenId } = req.params;
    const user = req.session.user;
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

    try {
      // Obtener imagen para verificar permisos y eliminar archivo
      const imagenResult = await db.query(
        'SELECT * FROM tickets_imagenes WHERE id = $1 AND ticket_id = $2',
        [imagenId, id]
      );

      if (imagenResult.rows.length === 0) {
        req.session.error = 'Imagen no encontrada';
        return res.redirect(`/tickets/${id}`);
      }

      const imagen = imagenResult.rows[0];

      // Solo SKN o quien subió la imagen puede eliminarla
      if (!esSKN && imagen.subido_por !== user.id) {
        req.session.error = 'No tienes permiso para eliminar esta imagen';
        return res.redirect(`/tickets/${id}`);
      }

      // Eliminar imagen de Cloudinary si tiene cloudinary_id
      if (imagen.cloudinary_id) {
        try {
          await deleteImage(imagen.cloudinary_id);
        } catch (cloudinaryError) {
          console.error('Error al eliminar de Cloudinary:', cloudinaryError);
          // Continuar con la eliminación de la BD aunque falle Cloudinary
        }
      } else {
        // Si es una imagen antigua (almacenada localmente), eliminar archivo físico
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../public', imagen.ruta_archivo);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Eliminar registro de BD
      await db.query('DELETE FROM tickets_imagenes WHERE id = $1', [imagenId]);

      req.session.message = 'Imagen eliminada exitosamente';
      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      req.session.error = 'Error al eliminar imagen';
      res.redirect(`/tickets/${id}`);
    }
  },

  // Registrar hora de inicio (SOLO SKN para soporte físico)
  registrarHoraInicio: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

    try {
      if (!esSKN) {
        req.session.error = 'Solo usuarios SKN pueden registrar hora de inicio';
        return res.redirect(`/tickets/${id}`);
      }

      // Verificar que sea soporte físico
      const ticket = await db.query('SELECT tipo_soporte FROM tickets WHERE id = $1', [id]);
      if (ticket.rows.length === 0 || ticket.rows[0].tipo_soporte !== 'fisico') {
        req.session.error = 'Solo para tickets de soporte físico';
        return res.redirect(`/tickets/${id}`);
      }

      await db.query(
        'UPDATE tickets SET hora_inicio = NOW() WHERE id = $1',
        [id]
      );

      req.session.message = 'Hora de inicio registrada';
      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al registrar hora inicio:', error);
      req.session.error = 'Error al registrar hora de inicio';
      res.redirect(`/tickets/${id}`);
    }
  },

  // Registrar hora de fin (SOLO SKN para soporte físico)
  registrarHoraFin: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user';

    try {
      if (!esSKN) {
        req.session.error = 'Solo usuarios SKN pueden registrar hora de fin';
        return res.redirect(`/tickets/${id}`);
      }

      // Verificar que sea soporte físico y que tenga hora de inicio
      const ticket = await db.query(
        'SELECT tipo_soporte, hora_inicio FROM tickets WHERE id = $1',
        [id]
      );
      
      if (ticket.rows.length === 0) {
        req.session.error = 'Ticket no encontrado';
        return res.redirect('/tickets');
      }

      if (ticket.rows[0].tipo_soporte !== 'fisico') {
        req.session.error = 'Solo para tickets de soporte físico';
        return res.redirect(`/tickets/${id}`);
      }

      if (!ticket.rows[0].hora_inicio) {
        req.session.error = 'Debe registrar primero la hora de inicio';
        return res.redirect(`/tickets/${id}`);
      }

      await db.query(
        'UPDATE tickets SET hora_fin = NOW() WHERE id = $1',
        [id]
      );

      req.session.message = 'Hora de fin registrada. Duración calculada automáticamente.';
      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al registrar hora fin:', error);
      req.session.error = 'Error al registrar hora de fin';
      res.redirect(`/tickets/${id}`);
    }
  }
};

module.exports = ticketsController;
