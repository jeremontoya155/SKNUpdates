const db = require('../database');
const bcrypt = require('bcrypt');
const { Expo } = require('expo-server-sdk');

// Crear instancia de Expo
const expo = new Expo();

const apiController = {
  // LOGIN para app móvil
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email y contraseña requeridos' 
        });
      }

      // Buscar usuario
      const result = await db.query(
        'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciales inválidas' 
        });
      }

      const user = result.rows[0];

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciales inválidas' 
        });
      }

      // Solo permitir login a usuarios SKN (técnicos)
      if (!user.rol.startsWith('skn_')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Solo técnicos SKN pueden usar la app' 
        });
      }

      // Retornar datos del usuario
      res.json({
        success: true,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      });

    } catch (error) {
      console.error('Error en login API:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error en el servidor' 
      });
    }
  },

  // OBTENER TICKETS asignados al técnico
  getTickets: async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'userId requerido' 
        });
      }

      // Obtener tickets donde el técnico está asignado
      const query = `
        SELECT 
          t.id,
          t.titulo,
          t.descripcion,
          t.estado,
          t.prioridad,
          t.fecha_creacion,
          e.nombre as empresa_nombre,
          e.email as empresa_email,
          e.telefono as empresa_telefono,
          s.nombre as sucursal_nombre,
          s.direccion as sucursal_direccion,
          s.ciudad as sucursal_ciudad,
          s.provincia as sucursal_provincia
        FROM tickets t
        INNER JOIN tickets_tecnicos tt ON t.id = tt.ticket_id AND tt.activo = true
        LEFT JOIN empresas e ON t.empresa_id = e.id
        LEFT JOIN sucursales s ON t.sucursal_id = s.id
        WHERE tt.usuario_id = $1
          AND t.estado != 'cerrado'
          AND t.estado != 'finalizado'
        ORDER BY 
          CASE t.prioridad
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
          END,
          t.fecha_creacion DESC
      `;

      const result = await db.query(query, [userId]);

      console.log(`[API Mobile] Tickets encontrados para user ${userId}:`, result.rows.length);

      res.json({
        success: true,
        tickets: result.rows
      });

    } catch (error) {
      console.error('Error al obtener tickets:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // CAMBIAR ESTADO del ticket
  cambiarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, userId, comentario } = req.body;
      const imagen = req.file; // Multer guarda el archivo aquí

      console.log('[API Mobile] Datos recibidos:');
      console.log('  req.params:', req.params);
      console.log('  req.body:', req.body);
      console.log('  req.file:', req.file);

      if (!estado || !userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Estado y userId requeridos' 
        });
      }

      if (!comentario || !comentario.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'El comentario es requerido' 
        });
      }

      if (!imagen) {
        return res.status(400).json({ 
          success: false, 
          message: 'La imagen es requerida' 
        });
      }

      // Verificar que el técnico está asignado al ticket
      const checkAssignment = await db.query(
        'SELECT * FROM tickets_tecnicos WHERE ticket_id = $1 AND usuario_id = $2 AND activo = true',
        [id, userId]
      );

      if (checkAssignment.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para modificar este ticket' 
        });
      }

      // Obtener el estado anterior
      const ticketAnterior = await db.query(
        'SELECT estado FROM tickets WHERE id = $1',
        [id]
      );
      const estadoAnterior = ticketAnterior.rows[0]?.estado;

      // Actualizar estado del ticket
      await db.query(
        `UPDATE tickets 
         SET estado = $1
         WHERE id = $2`,
        [estado, id]
      );

      // Guardar en historial con imagen y comentario
      const rutaImagen = imagen.path;
      
      await db.query(
        `INSERT INTO tickets_historial_estado 
         (ticket_id, usuario_id, estado_anterior, estado_nuevo, comentario, imagen_ruta, fecha_cambio) 
         VALUES ($1, $2, $3, $4, $5, $6, TIMEZONE('America/Argentina/Buenos_Aires', NOW()))`,
        [id, userId, estadoAnterior, estado, comentario.trim(), rutaImagen]
      );

      console.log('[API Mobile] Estado actualizado exitosamente');

      res.json({
        success: true,
        message: 'Estado actualizado correctamente',
        imagen: rutaImagen
      });

    } catch (error) {
      console.error('Error al cambiar estado:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Error al cambiar estado',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // OBTENER DETALLE de un ticket
  getTicketDetalle: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'userId requerido' 
        });
      }

      // Verificar asignación
      const checkAssignment = await db.query(
        'SELECT * FROM tickets_tecnicos WHERE ticket_id = $1 AND usuario_id = $2 AND activo = true',
        [id, userId]
      );

      if (checkAssignment.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permiso para ver este ticket' 
        });
      }

      // Obtener detalle completo
      const query = `
        SELECT 
          t.*,
          e.nombre as empresa_nombre,
          e.email as empresa_email,
          e.telefono as empresa_telefono,
          e.direccion as empresa_direccion,
          s.nombre as sucursal_nombre,
          s.direccion as sucursal_direccion,
          s.ciudad as sucursal_ciudad,
          s.provincia as sucursal_provincia
        FROM tickets t
        LEFT JOIN empresas e ON t.empresa_id = e.id
        LEFT JOIN sucursales s ON t.sucursal_id = s.id
        WHERE t.id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Ticket no encontrado' 
        });
      }

      res.json({
        success: true,
        ticket: result.rows[0]
      });

    } catch (error) {
      console.error('Error al obtener detalle:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener detalle' 
      });
    }
  },

  // REGISTRAR PUSH TOKEN
  registerPushToken: async (req, res) => {
    try {
      const { userId, pushToken, platform } = req.body;

      if (!userId || !pushToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'userId y pushToken son requeridos' 
        });
      }

      // Validar que el token sea válido de Expo
      if (!Expo.isExpoPushToken(pushToken)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Token de push inválido' 
        });
      }

      // Insertar o actualizar token
      await db.query(
        `INSERT INTO push_tokens (usuario_id, token, platform, activo)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (usuario_id, token) 
         DO UPDATE SET 
           platform = EXCLUDED.platform,
           activo = true,
           fecha_actualizacion = TIMEZONE('America/Argentina/Buenos_Aires', NOW())`,
        [userId, pushToken, platform || 'unknown']
      );

      console.log(`[Push Token] Registrado para usuario ${userId}: ${pushToken}`);

      res.json({ 
        success: true, 
        message: 'Push token registrado correctamente' 
      });

    } catch (error) {
      console.error('Error registrando push token:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al registrar push token' 
      });
    }
  },

  // CONTADOR DE TICKETS (para notificaciones web)
  getTicketsCount: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT COUNT(*) as count 
         FROM tickets 
         WHERE estado NOT IN ('cerrado', 'finalizado')`
      );

      res.json({ 
        success: true, 
        count: parseInt(result.rows[0].count) 
      });

    } catch (error) {
      console.error('Error contando tickets:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al contar tickets' 
      });
    }
  }
};

// FUNCIÓN AUXILIAR: Enviar notificación push
async function enviarNotificacionPush(userId, titulo, mensaje, data = {}) {
  try {
    console.log(`[Push] Intentando enviar notificación a usuario ${userId}`);

    // Obtener tokens activos del usuario
    const result = await db.query(
      'SELECT token FROM push_tokens WHERE usuario_id = $1 AND activo = true',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`[Push] Usuario ${userId} no tiene tokens registrados`);
      return { success: false, message: 'Usuario sin tokens' };
    }

    const tokens = result.rows.map(row => row.token);
    console.log(`[Push] Enviando a ${tokens.length} dispositivo(s)`);

    // Crear mensajes
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: titulo,
      body: mensaje,
      data: data,
      priority: 'high',
      badge: 1,
      channelId: 'default'
    }));

    // Enviar en chunks (Expo requiere esto)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log(`[Push] Chunk enviado exitosamente`);
      } catch (error) {
        console.error('[Push] Error enviando chunk:', error);
      }
    }

    console.log(`[Push] Notificación enviada exitosamente a usuario ${userId}`);
    return { success: true, tickets };

  } catch (error) {
    console.error('[Push] Error en enviarNotificacionPush:', error);
    return { success: false, error: error.message };
  }
}

// Exportar controlador y función auxiliar
module.exports = apiController;
module.exports.enviarNotificacionPush = enviarNotificacionPush;

module.exports = apiController;
