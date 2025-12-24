const db = require('../database');
const { deleteImage, getThumbnailUrl, getPreviewUrl } = require('../config/cloudinary');

const ticketsController = {
  // Listar tickets
  // SKN Admin/Subadmin: Ve TODOS los tickets de todas las empresas
  // SKN User: Solo ve tickets asignados a él
  // Empresa: Solo ve SUS tickets
  index: async (req, res) => {
    try {
      const user = req.session.user;
      const esSKNAdmin = ['skn_admin', 'skn_subadmin'].includes(user.rol);
      const esSKNUser = user.rol === 'skn_user';
      const esSKN = esSKNAdmin || esSKNUser;
      
      // Verificar si es Belen (subadmin especial para finalizar tickets)
      const esBelen = user.rol === 'skn_subadmin' && user.nombre && user.nombre.toLowerCase().includes('belen');
      
      const { buscar, estado, prioridad, empresa, fecha_desde, fecha_hasta, asignado, sin_asignar } = req.query;

      let query;
      let params = [];
      let paramIndex = 1;

      if (esSKNAdmin) {
        // SKN Admin/Subadmin ve todos los tickets con información de empresa y sucursal
        // BELEN solo verá tickets cerrados para finalizarlos, o los asignados a ella
        if (esBelen) {
          query = `
            SELECT DISTINCT
              t.*, 
              e.nombre as empresa_nombre,
              s.nombre as sucursal_nombre,
              s.direccion as sucursal_direccion,
              s.ciudad as sucursal_ciudad,
              s.provincia as sucursal_provincia,
              u.nombre as solicitante_nombre, 
              ua.nombre as asignado_nombre 
            FROM tickets t 
            JOIN empresas e ON t.empresa_id = e.id
            LEFT JOIN sucursales s ON t.sucursal_id = s.id
            LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
            LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
            LEFT JOIN tickets_tecnicos tt ON t.id = tt.ticket_id AND tt.activo = true
            WHERE (t.estado = 'cerrado' OR tt.usuario_id = $${paramIndex})
          `;
          params.push(user.id);
          paramIndex++;
        } else {
          query = `
            SELECT DISTINCT
              t.*, 
              e.nombre as empresa_nombre,
              s.nombre as sucursal_nombre,
              s.direccion as sucursal_direccion,
              s.ciudad as sucursal_ciudad,
              s.provincia as sucursal_provincia,
              u.nombre as solicitante_nombre, 
              ua.nombre as asignado_nombre 
            FROM tickets t 
            JOIN empresas e ON t.empresa_id = e.id
            LEFT JOIN sucursales s ON t.sucursal_id = s.id
            LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
            LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
            WHERE 1=1
          `;
        }
        
        // Filtro por empresa (solo para SKN Admin/Subadmin)
        if (empresa) {
          query += ` AND t.empresa_id = $${paramIndex}`;
          params.push(parseInt(empresa, 10));
          paramIndex++;
        }
      } else if (esSKNUser) {
        // SKN User solo ve tickets asignados a él (ahora usa tickets_tecnicos)
        query = `
          SELECT DISTINCT
            t.*, 
            e.nombre as empresa_nombre,
            s.nombre as sucursal_nombre,
            s.direccion as sucursal_direccion,
            s.ciudad as sucursal_ciudad,
            s.provincia as sucursal_provincia,
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre 
          FROM tickets t 
          JOIN empresas e ON t.empresa_id = e.id
          LEFT JOIN sucursales s ON t.sucursal_id = s.id
          LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
          LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
          INNER JOIN tickets_tecnicos tt ON t.id = tt.ticket_id AND tt.activo = true
          WHERE tt.usuario_id = $${paramIndex}
        `;
        params.push(user.id);
        paramIndex++;
      } else {
        // Empresa solo ve sus tickets (con estado cerrado visible, finalizado no)
        query = `
          SELECT DISTINCT
            t.*, 
            s.nombre as sucursal_nombre,
            s.direccion as sucursal_direccion,
            s.ciudad as sucursal_ciudad,
            s.provincia as sucursal_provincia,
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre 
          FROM tickets t 
          LEFT JOIN sucursales s ON t.sucursal_id = s.id
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

      // Filtro por sin asignar (solo para SKN)
      if (sin_asignar === 'true' && esSKN) {
        query += ` AND NOT EXISTS (SELECT 1 FROM tickets_tecnicos WHERE ticket_id = t.id AND activo = true)`;
      }

      // Filtro por técnico asignado (solo para SKN Admin)
      if (asignado && esSKNAdmin && !esBelen) {
        query += ` AND EXISTS (SELECT 1 FROM tickets_tecnicos WHERE ticket_id = t.id AND usuario_id = $${paramIndex} AND activo = true)`;
        params.push(parseInt(asignado, 10));
        paramIndex++;
      }

      query += ` ORDER BY 
        CASE t.estado 
          WHEN 'abierto' THEN 1 
          WHEN 'en_proceso' THEN 2 
          WHEN 'cerrado' THEN 3 
          WHEN 'finalizado' THEN 4
        END,
        t.fecha_creacion DESC
      `;

      const result = await db.query(query, params);
      
      // Para cada ticket, obtener los técnicos asignados
      const ticketsConTecnicos = await Promise.all(result.rows.map(async (ticket) => {
        const tecnicosResult = await db.query(
          `SELECT u.id, u.nombre 
           FROM tickets_tecnicos tt
           JOIN usuarios u ON tt.usuario_id = u.id
           WHERE tt.ticket_id = $1 AND tt.activo = true
           ORDER BY u.nombre`,
          [ticket.id]
        );
        return {
          ...ticket,
          tecnicos_asignados: tecnicosResult.rows
        };
      }));

      // Obtener lista de empresas para SKN
      let empresas = [];
      let tecnicos = [];
      if (esSKN) {
        const empresasResult = await db.query(
          'SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre'
        );
        empresas = empresasResult.rows;

        // Obtener lista de técnicos SKN
        const tecnicosResult = await db.query(
          `SELECT id, nombre FROM usuarios 
           WHERE rol IN ('skn_admin', 'skn_subadmin', 'skn_user') AND activo = true 
           ORDER BY nombre`
        );
        tecnicos = tecnicosResult.rows;
      }

      res.render('tickets/index', { 
        title: 'Tickets', 
        tickets: ticketsConTecnicos,
        esSKN,
        esBelen: esBelen || false,
        empresas,
        tecnicos,
        filtros: { buscar, estado, prioridad, empresa, fecha_desde, fecha_hasta, asignado, sin_asignar },
        user
      });
    } catch (error) {
      console.error('Error al listar tickets:', error);
      res.render('tickets/index', { 
        title: 'Tickets', 
        tickets: [],
        esSKN: false,
        esBelen: false,
        empresas: [],
        tecnicos: [],
        filtros: {},
        user: req.session.user
      });
    }
  },

  // Mostrar formulario de nuevo ticket
  showNuevo: async (req, res) => {
    try {
      const user = req.session.user;
      const esSKN = ['skn_admin', 'skn_subadmin', 'skn_user'].includes(user.rol);

      let empresas = [];
      let sucursales = [];
      let tecnicos = [];
      
      if (esSKN) {
        // SKN puede crear tickets para cualquier empresa
        const result = await db.query(
          'SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre'
        );
        empresas = result.rows;
        
        // Obtener técnicos SKN para asignación múltiple
        const tecnicosResult = await db.query(
          `SELECT id, nombre FROM usuarios 
           WHERE rol IN ('skn_admin', 'skn_subadmin', 'skn_user') AND activo = true 
           ORDER BY nombre`
        );
        tecnicos = tecnicosResult.rows;
      } else {
        // Obtener sucursales de la empresa del usuario
        const sucursalesResult = await db.query(
          'SELECT id, nombre, direccion, ciudad, provincia FROM sucursales WHERE empresa_id = $1 AND activo = true ORDER BY es_principal DESC, nombre',
          [user.empresa_id]
        );
        sucursales = sucursalesResult.rows;
      }

      // Obtener tipos de trabajo activos
      const tiposTrabajo = await db.query(
        'SELECT id, nombre, descripcion, requiere_instalacion FROM tipos_trabajo WHERE activo = true ORDER BY nombre'
      );

      // Obtener situaciones de soporte activas
      const situaciones = await db.query(
        'SELECT id, nombre, descripcion, tipo_soporte, color FROM situaciones_soporte WHERE activo = true ORDER BY tipo_soporte, orden, nombre'
      );

      res.render('tickets/nuevo', { 
        title: 'Nuevo Ticket',
        empresas,
        sucursales,
        tecnicos,
        tiposTrabajo: tiposTrabajo.rows,
        situaciones: situaciones.rows,
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
    const { titulo, descripcion, prioridad, empresa_id, tipo_soporte, tipo_trabajo_id, situacion_soporte_id, sucursal_id, tecnicos_ids } = req.body;
    const user = req.session.user;
    const esSKN = ['skn_admin', 'skn_subadmin', 'skn_user'].includes(user.rol);
    const file = req.file; // Imagen inicial

    try {
      let empresaFinal;
      let sucursalFinal = sucursal_id || null;
      
      if (esSKN) {
        // SKN puede asignar a cualquier empresa
        empresaFinal = empresa_id;
      } else {
        // Empresa solo puede crear tickets para sí misma
        empresaFinal = user.empresa_id;
      }

      // Obtener información de la empresa para determinar si requiere autorización
      const empresaInfo = await db.query(
        'SELECT abonada FROM empresas WHERE id = $1',
        [empresaFinal]
      );
      const esAbonada = empresaInfo.rows[0]?.abonada || false;

      // Obtener información de la situación para determinar si requiere materiales
      let requiereMateriales = false;
      if (situacion_soporte_id) {
        const situacionInfo = await db.query(
          'SELECT requiere_materiales FROM situaciones_soporte WHERE id = $1',
          [situacion_soporte_id]
        );
        requiereMateriales = situacionInfo.rows[0]?.requiere_materiales || false;
      }

      // Determinar si requiere autorización:
      // 1. Empresa abonada + Ticket presencial con materiales
      // 2. Empresa NO abonada + Cualquier ticket presencial
      const requiereAutorizacion = (
        (esAbonada && tipo_soporte === 'fisico' && requiereMateriales) ||
        (!esAbonada && tipo_soporte === 'fisico')
      );

      // Insertar ticket con sucursal
      const ticketResult = await db.query(
        `INSERT INTO tickets (empresa_id, usuario_solicitante, titulo, descripcion, prioridad, estado, tipo_soporte, tipo_trabajo_id, situacion_soporte_id, requiere_autorizacion, sucursal_id) 
         VALUES ($1, $2, $3, $4, $5, 'abierto', $6, $7, $8, $9, $10) RETURNING id`,
        [empresaFinal, user.id, titulo, descripcion, prioridad || 'media', tipo_soporte || 'remoto', tipo_trabajo_id || null, situacion_soporte_id || null, requiereAutorizacion, sucursalFinal]
      );

      const ticketId = ticketResult.rows[0].id;

      // Asignar técnicos si se proporcionaron (solo SKN puede asignar)
      if (esSKN && tecnicos_ids) {
        const tecnicosArray = Array.isArray(tecnicos_ids) ? tecnicos_ids : [tecnicos_ids];
        for (const tecnicoId of tecnicosArray) {
          if (tecnicoId) {
            await db.query(
              `INSERT INTO tickets_tecnicos (ticket_id, usuario_id, asignado_por)
               VALUES ($1, $2, $3)`,
              [ticketId, tecnicoId, user.id]
            );
          }
        }
        
        // Si se asignaron técnicos, actualizar el campo legacy usuario_asignado con el primer técnico
        if (tecnicosArray.length > 0 && tecnicosArray[0]) {
          await db.query(
            'UPDATE tickets SET usuario_asignado = $1 WHERE id = $2',
            [tecnicosArray[0], ticketId]
          );
        }
      }

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
    const esSKNAdmin = ['skn_admin', 'skn_subadmin'].includes(user.rol);
    const esSKNUser = user.rol === 'skn_user';
    const esSKN = esSKNAdmin || esSKNUser;
    const esBelen = user.rol === 'skn_subadmin' && user.nombre && user.nombre.toLowerCase().includes('belen');

    try {
      let query;
      let params;

      if (esSKNAdmin) {
        // SKN Admin/Subadmin puede ver cualquier ticket (con sucursal)
        query = `
          SELECT 
            t.*, 
            e.nombre as empresa_nombre,
            e.abonada as empresa_abonada,
            s.nombre as sucursal_nombre,
            s.direccion as sucursal_direccion,
            s.ciudad as sucursal_ciudad,
            s.provincia as sucursal_provincia,
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre,
            tt.nombre as tipo_trabajo_nombre,
            tt.descripcion as tipo_trabajo_descripcion,
            tt.color as tipo_trabajo_color,
            uauth.nombre as autorizado_por_nombre,
            ufin.nombre as finalizado_por_nombre
          FROM tickets t 
          JOIN empresas e ON t.empresa_id = e.id
          LEFT JOIN sucursales s ON t.sucursal_id = s.id
          LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
          LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
          LEFT JOIN tipos_trabajo tt ON t.tipo_trabajo_id = tt.id
          LEFT JOIN usuarios uauth ON t.autorizado_por = uauth.id
          LEFT JOIN usuarios ufin ON t.finalizado_por = ufin.id
          WHERE t.id = $1
        `;
        params = [id];
      } else if (esSKNUser) {
        // SKN User solo puede ver tickets asignados a él (con sucursal)
        query = `
          SELECT 
            t.*, 
            e.nombre as empresa_nombre,
            e.abonada as empresa_abonada,
            s.nombre as sucursal_nombre,
            s.direccion as sucursal_direccion,
            s.ciudad as sucursal_ciudad,
            s.provincia as sucursal_provincia,
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre,
            tt.nombre as tipo_trabajo_nombre,
            tt.descripcion as tipo_trabajo_descripcion,
            tt.color as tipo_trabajo_color,
            uauth.nombre as autorizado_por_nombre
          FROM tickets t 
          JOIN empresas e ON t.empresa_id = e.id
          LEFT JOIN sucursales s ON t.sucursal_id = s.id
          LEFT JOIN usuarios u ON t.usuario_solicitante = u.id 
          LEFT JOIN usuarios ua ON t.usuario_asignado = ua.id 
          LEFT JOIN tipos_trabajo tt ON t.tipo_trabajo_id = tt.id
          LEFT JOIN usuarios uauth ON t.autorizado_por = uauth.id
          WHERE t.id = $1 AND EXISTS (
            SELECT 1 FROM tickets_tecnicos 
            WHERE ticket_id = t.id AND usuario_id = $2 AND activo = true
          )
        `;
        params = [id, user.id];
      } else {
        // Empresa solo ve sus tickets (ocultar estado finalizado)
        query = `
          SELECT 
            t.*,
            CASE WHEN t.estado = 'finalizado' THEN 'cerrado' ELSE t.estado END as estado,
            s.nombre as sucursal_nombre,
            s.direccion as sucursal_direccion,
            s.ciudad as sucursal_ciudad,
            s.provincia as sucursal_provincia,
            u.nombre as solicitante_nombre, 
            ua.nombre as asignado_nombre,
            tt.nombre as tipo_trabajo_nombre,
            tt.descripcion as tipo_trabajo_descripcion,
            tt.color as tipo_trabajo_color
          FROM tickets t 
          LEFT JOIN sucursales s ON t.sucursal_id = s.id
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

      // Obtener técnicos asignados al ticket
      const tecnicosAsignados = await db.query(
        `SELECT u.id, u.nombre, tt.fecha_asignacion
         FROM tickets_tecnicos tt
         JOIN usuarios u ON tt.usuario_id = u.id
         WHERE tt.ticket_id = $1 AND tt.activo = true
         ORDER BY tt.fecha_asignacion DESC`,
        [id]
      );

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
          `SELECT id, nombre as nombre_completo, rol
           FROM usuarios 
           WHERE (rol = 'skn_admin' OR rol = 'skn_subadmin' OR rol = 'skn_user') AND activo = true 
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
        tecnicosAsignados: tecnicosAsignados.rows,
        usuariosSKN,
        esSKN,
        esBelen: esBelen || false,
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
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user' || user.rol === 'skn_subadmin';
    const esBelen = user.rol === 'skn_subadmin' && user.nombre && user.nombre.toLowerCase().includes('belen');

    try {
      // Solo SKN puede cambiar estado
      if (!esSKN) {
        return res.status(403).send('Solo usuarios SKN pueden cambiar el estado de tickets');
      }
      
      // Solo Belen puede marcar tickets como "finalizado"
      if (estado === 'finalizado' && !esBelen) {
        req.session.error = 'Solo Belen puede marcar tickets como finalizados';
        return res.redirect(`/tickets/${id}`);
      }

      // Si se intenta poner en proceso, verificar si es presencial y requiere checklist
      if (estado === 'en_proceso') {
        const ticketInfo = await db.query(
          `SELECT t.tipo_soporte, s.requiere_materiales, t.situacion_soporte_id
           FROM tickets t
           LEFT JOIN situaciones_soporte s ON t.situacion_soporte_id = s.id
           WHERE t.id = $1`,
          [id]
        );

        const ticket = ticketInfo.rows[0];

        // Si es físico/presencial y requiere materiales, verificar que el checklist esté completo
        if (ticket.tipo_soporte === 'fisico' && ticket.requiere_materiales && ticket.situacion_soporte_id) {
          // Verificar si hay materiales obligatorios sin marcar
          const materialesObligatorios = await db.query(
            `SELECT cm.id, cm.nombre
             FROM checklist_materiales cm
             WHERE cm.situacion_id = $1 AND cm.obligatorio = true
             AND cm.id NOT IN (
               SELECT material_id 
               FROM ticket_checklist_materiales 
               WHERE ticket_id = $2 AND llevado = true
             )`,
            [ticket.situacion_soporte_id, id]
          );

          if (materialesObligatorios.rows.length > 0) {
            req.session.error = '⚠️ Debes completar el checklist de materiales antes de iniciar el ticket. Ve a "Ver Checklist" y marca los materiales que llevarás.';
            return res.redirect(`/tickets/${id}`);
          }
        }
      }

      // Si se intenta cerrar, verificar requisitos
      if (estado === 'cerrado') {
        const ticketInfo = await db.query(
          `SELECT t.tipo_soporte, t.requiere_autorizacion, t.estado_autorizacion
           FROM tickets t
           WHERE t.id = $1`,
          [id]
        );

        const ticket = ticketInfo.rows[0];

        // Si es físico/presencial, verificar que tenga al menos una imagen
        if (ticket.tipo_soporte === 'fisico') {
          const imagenes = await db.query(
            `SELECT COUNT(*) as total
             FROM tickets_imagenes
             WHERE ticket_id = $1`,
            [id]
          );

          if (parseInt(imagenes.rows[0].total) === 0) {
            req.session.error = '⚠️ Para cerrar un ticket presencial debes subir al menos una imagen del trabajo realizado.';
            return res.redirect(`/tickets/${id}`);
          }
        }

        // Si requiere autorización, verificar que esté aprobado
        if (ticket.requiere_autorizacion && ticket.estado_autorizacion !== 'aprobado') {
          req.session.error = '⚠️ Este ticket requiere autorización del SubAdmin antes de cerrarse. Estado actual: ' + (ticket.estado_autorizacion || 'pendiente');
          return res.redirect(`/tickets/${id}`);
        }

        // Actualizar estado a cerrado con fecha
        await db.query(
          "UPDATE tickets SET estado = $1, fecha_cierre = TIMEZONE('America/Argentina/Buenos_Aires', NOW()) WHERE id = $2",
          [estado, id]
        );
      } else if (estado === 'finalizado') {
        // Finalizar ticket (solo Belen)
        await db.query(
          "UPDATE tickets SET estado = $1, finalizado_por = $2, fecha_finalizacion = TIMEZONE('America/Argentina/Buenos_Aires', NOW()) WHERE id = $3",
          [estado, user.id, id]
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

  // Asignar ticket (SOLO SKN) - Asignación múltiple de técnicos
  asignar: async (req, res) => {
    const { id } = req.params;
    const { tecnicos_ids } = req.body;
    const user = req.session.user;
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user' || user.rol === 'skn_subadmin';

    try {
      // Solo SKN puede asignar tickets
      if (!esSKN) {
        return res.status(403).send('Solo usuarios SKN pueden asignar tickets');
      }

      // Desactivar asignaciones anteriores
      await db.query(
        'UPDATE tickets_tecnicos SET activo = false WHERE ticket_id = $1',
        [id]
      );

      // Asignar nuevos técnicos
      const tecnicosArray = Array.isArray(tecnicos_ids) ? tecnicos_ids : [tecnicos_ids];
      for (const tecnicoId of tecnicosArray) {
        if (tecnicoId) {
          // Insertar o reactivar asignación
          await db.query(
            `INSERT INTO tickets_tecnicos (ticket_id, usuario_id, asignado_por, activo)
             VALUES ($1, $2, $3, true)
             ON CONFLICT (ticket_id, usuario_id)
             DO UPDATE SET activo = true, fecha_asignacion = CURRENT_TIMESTAMP, asignado_por = $3`,
            [id, tecnicoId, user.id]
          );
        }
      }

      // Actualizar el campo legacy usuario_asignado con el primer técnico
      if (tecnicosArray.length > 0 && tecnicosArray[0]) {
        await db.query(
          'UPDATE tickets SET usuario_asignado = $1 WHERE id = $2',
          [tecnicosArray[0], id]
        );
      }

      req.session.message = 'Técnicos asignados exitosamente';
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
    const esSKN = user.rol === 'skn_admin' || user.rol === 'skn_user' || user.rol === 'skn_subadmin';

    try {
      // Solo SKN puede asignarse tickets
      if (!esSKN) {
        return res.status(403).send('Solo usuarios SKN pueden asignarse tickets');
      }

      // Insertar o reactivar asignación
      await db.query(
        `INSERT INTO tickets_tecnicos (ticket_id, usuario_id, asignado_por, activo)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (ticket_id, usuario_id)
         DO UPDATE SET activo = true, fecha_asignacion = CURRENT_TIMESTAMP`,
        [id, user.id, user.id]
      );

      // Actualizar el campo legacy usuario_asignado
      await db.query(
        'UPDATE tickets SET usuario_asignado = $1 WHERE id = $2',
        [user.id, id]
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

      // Verificar que sea soporte físico y que esté en proceso
      const ticket = await db.query('SELECT tipo_soporte, estado FROM tickets WHERE id = $1', [id]);
      if (ticket.rows.length === 0 || ticket.rows[0].tipo_soporte !== 'fisico') {
        req.session.error = 'Solo para tickets de soporte físico';
        return res.redirect(`/tickets/${id}`);
      }

      if (ticket.rows[0].estado === 'abierto') {
        req.session.error = '⚠️ Debes cambiar el ticket a "En Proceso" antes de registrar la hora de inicio. Recuerda completar el checklist de materiales primero.';
        return res.redirect(`/tickets/${id}`);
      }

      await db.query(
        "UPDATE tickets SET hora_inicio = TIMEZONE('America/Argentina/Buenos_Aires', NOW()) WHERE id = $1",
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
        "UPDATE tickets SET hora_fin = TIMEZONE('America/Argentina/Buenos_Aires', NOW()) WHERE id = $1",
        [id]
      );

      req.session.message = 'Hora de fin registrada. Duración calculada automáticamente.';
      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al registrar hora fin:', error);
      req.session.error = 'Error al registrar hora de fin';
      res.redirect(`/tickets/${id}`);
    }
  },

  // Autorizar cierre de ticket (SOLO SubAdmin)
  autorizarCierre: async (req, res) => {
    const { id } = req.params;
    const { decision } = req.body; // 'aprobado' o 'rechazado'
    const user = req.session.user;

    try {
      // Solo subadmin puede autorizar
      if (user.rol !== 'skn_subadmin') {
        req.session.error = 'Solo el SubAdmin puede autorizar el cierre de tickets';
        return res.redirect(`/tickets/${id}`);
      }

      // Verificar que el ticket requiere autorización
      const ticket = await db.query(
        'SELECT requiere_autorizacion, estado FROM tickets WHERE id = $1',
        [id]
      );

      if (!ticket.rows[0].requiere_autorizacion) {
        req.session.error = 'Este ticket no requiere autorización';
        return res.redirect(`/tickets/${id}`);
      }

      if (ticket.rows[0].estado === 'cerrado') {
        req.session.error = 'Este ticket ya está cerrado';
        return res.redirect(`/tickets/${id}`);
      }

      // Actualizar autorización
      await db.query(
        `UPDATE tickets 
         SET estado_autorizacion = $1, 
             autorizado_por = $2, 
             fecha_autorizacion = TIMEZONE('America/Argentina/Buenos_Aires', NOW())
         WHERE id = $3`,
        [decision, user.id, id]
      );

      if (decision === 'aprobado') {
        req.session.message = '✅ Ticket autorizado para cierre. El técnico ya puede cerrarlo.';
      } else {
        req.session.message = '❌ Cierre rechazado. El técnico deberá hacer ajustes.';
      }

      res.redirect(`/tickets/${id}`);
    } catch (error) {
      console.error('Error al autorizar cierre:', error);
      req.session.error = 'Error al autorizar cierre';
      res.redirect(`/tickets/${id}`);
    }
  },

  // Obtener sucursales por empresa (API para formulario)
  getSucursalesPorEmpresa: async (req, res) => {
    const { empresa_id } = req.params;
    
    try {
      const sucursales = await db.query(
        `SELECT id, nombre, direccion, ciudad, provincia 
         FROM sucursales 
         WHERE empresa_id = $1 AND activo = true 
         ORDER BY es_principal DESC, nombre`,
        [empresa_id]
      );
      
      res.json(sucursales.rows);
    } catch (error) {
      console.error('Error al obtener sucursales:', error);
      res.status(500).json({ error: 'Error al obtener sucursales' });
    }
  }
};

module.exports = ticketsController;

