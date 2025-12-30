const db = require('../database');
const bcrypt = require('bcrypt');

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
        SELECT DISTINCT
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

      res.json({
        success: true,
        tickets: result.rows
      });

    } catch (error) {
      console.error('Error al obtener tickets:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener tickets' 
      });
    }
  },

  // CAMBIAR ESTADO del ticket
  cambiarEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado, userId } = req.body;

      if (!estado || !userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Estado y userId requeridos' 
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

      // Actualizar estado
      await db.query(
        `UPDATE tickets 
         SET estado = $1, 
             fecha_actualizacion = TIMEZONE('America/Argentina/Buenos_Aires', NOW())
         WHERE id = $2`,
        [estado, id]
      );

      res.json({
        success: true,
        message: 'Estado actualizado correctamente'
      });

    } catch (error) {
      console.error('Error al cambiar estado:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al cambiar estado' 
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
  }
};

module.exports = apiController;
