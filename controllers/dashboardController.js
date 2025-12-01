const db = require('../database');

const dashboardController = {
  // Dashboard principal
  index: async (req, res) => {
    try {
      const user = req.session.user;
      const stats = {};

      // Estadísticas según el rol
      if (user.rol === 'skn_admin' || user.rol === 'skn_user') {
        // SKN ve todo - Dashboard Administrativo Completo
        const empresas = await db.query('SELECT COUNT(*) as total FROM empresas WHERE activo = true');
        const usuarios = await db.query('SELECT COUNT(*) as total FROM usuarios');
        const ticketsAbiertos = await db.query(
          'SELECT COUNT(*) as total FROM tickets WHERE estado IN ($1, $2)',
          ['abierto', 'en_proceso']
        );
        const materiales = await db.query('SELECT COUNT(*) as total FROM materiales WHERE activo = true');
        
        // Listado completo de empresas con contactos
        const empresasConContactos = await db.query(`
          SELECT e.id, e.nombre, e.email, e.telefono, e.direccion,
                 COUNT(DISTINCT u.id) as total_usuarios,
                 COUNT(DISTINCT m.id) as total_materiales,
                 COUNT(DISTINCT t.id) FILTER (WHERE t.estado IN ('abierto', 'en_proceso')) as tickets_activos
          FROM empresas e
          LEFT JOIN usuarios u ON e.id = u.empresa_id AND u.activo = true
          LEFT JOIN materiales m ON e.id = m.empresa_id AND m.activo = true
          LEFT JOIN tickets t ON e.id = t.empresa_id
          WHERE e.activo = true
          GROUP BY e.id, e.nombre, e.email, e.telefono, e.direccion
          ORDER BY e.nombre
        `);
        
        // Todos los usuarios con sus contactos
        const usuariosConContactos = await db.query(`
          SELECT u.id, u.nombre, u.email, u.rol, e.nombre as empresa_nombre, e.telefono as empresa_telefono
          FROM usuarios u
          LEFT JOIN empresas e ON u.empresa_id = e.id
          WHERE u.activo = true
          ORDER BY e.nombre, u.nombre
        `);
        
        // Distribución de tickets por empresa
        const ticketsPorEmpresa = await db.query(`
          SELECT e.nombre as empresa, 
                 COUNT(*) FILTER (WHERE t.estado IN ('abierto', 'en_proceso')) as activos,
                 COUNT(*) FILTER (WHERE t.estado = 'cerrado') as cerrados
          FROM empresas e
          LEFT JOIN tickets t ON e.id = t.empresa_id
          WHERE e.activo = true
          GROUP BY e.nombre
          ORDER BY activos DESC
        `);
        
        stats.empresas = empresas.rows[0].total;
        stats.usuarios = usuarios.rows[0].total;
        stats.ticketsAbiertos = ticketsAbiertos.rows[0].total;
        stats.materiales = materiales.rows[0].total;
        stats.empresasConContactos = empresasConContactos.rows;
        stats.usuariosConContactos = usuariosConContactos.rows;
        stats.ticketsPorEmpresa = ticketsPorEmpresa.rows;
      } else {
        // Usuarios de empresa ven dashboard mejorado
        const materiales = await db.query(
          'SELECT COUNT(*) as total FROM materiales WHERE empresa_id = $1 AND activo = true',
          [user.empresa_id]
        );
        
        const materialesBajos = await db.query(
          'SELECT COUNT(*) as total FROM materiales WHERE empresa_id = $1 AND stock_actual <= stock_minimo AND activo = true',
          [user.empresa_id]
        );
        
        // Tickets en curso (abiertos + en proceso)
        const ticketsEnCurso = await db.query(
          'SELECT COUNT(*) as total FROM tickets WHERE empresa_id = $1 AND estado IN ($2, $3)',
          [user.empresa_id, 'abierto', 'en_proceso']
        );
        
        // Tickets resueltos totales
        const ticketsResueltos = await db.query(
          'SELECT COUNT(*) as total FROM tickets WHERE empresa_id = $1 AND estado = $2',
          [user.empresa_id, 'cerrado']
        );
        
        // Tickets resueltos en los últimos 30 días
        const ticketsResueltosRecientes = await db.query(
          'SELECT COUNT(*) as total FROM tickets WHERE empresa_id = $1 AND estado = $2 AND fecha_cierre >= NOW() - INTERVAL \'30 days\'',
          [user.empresa_id, 'cerrado']
        );
        
        // Tickets críticos resueltos recientemente (últimos 7 días)
        const ticketsCriticosResueltos = await db.query(
          `SELECT t.id, t.titulo, t.prioridad, t.fecha_cierre, t.fecha_creacion,
           EXTRACT(EPOCH FROM (t.fecha_cierre - t.fecha_creacion))/3600 as horas_resolucion
           FROM tickets t
           WHERE t.empresa_id = $1 
           AND t.estado = 'cerrado'
           AND t.prioridad IN ('urgente', 'alta')
           AND t.fecha_cierre >= NOW() - INTERVAL '7 days'
           ORDER BY t.fecha_cierre DESC
           LIMIT 5`,
          [user.empresa_id]
        );
        
        // Timeline de tickets (últimos 30 días)
        const ticketsTimeline = await db.query(
          `SELECT 
             DATE(fecha_creacion) as fecha,
             COUNT(*) FILTER (WHERE estado = 'cerrado') as resueltos,
             COUNT(*) FILTER (WHERE estado IN ('abierto', 'en_proceso')) as activos
           FROM tickets
           WHERE empresa_id = $1 
           AND fecha_creacion >= NOW() - INTERVAL '30 days'
           GROUP BY DATE(fecha_creacion)
           ORDER BY fecha DESC
           LIMIT 30`,
          [user.empresa_id]
        );
        
        // Tiempo promedio de resolución (últimos 30 días)
        const tiempoPromedioResolucion = await db.query(
          `SELECT 
             AVG(EXTRACT(EPOCH FROM (fecha_cierre - fecha_creacion))/3600) as horas_promedio
           FROM tickets
           WHERE empresa_id = $1 
           AND estado = 'cerrado'
           AND fecha_cierre >= NOW() - INTERVAL '30 days'
           AND fecha_cierre IS NOT NULL`,
          [user.empresa_id]
        );
        
        // Total de tickets creados (histórico)
        const ticketsTotales = await db.query(
          'SELECT COUNT(*) as total FROM tickets WHERE empresa_id = $1',
          [user.empresa_id]
        );
        
        const visitas = await db.query(
          'SELECT COUNT(*) as total FROM visitas WHERE empresa_id = $1 AND fecha_visita >= NOW()',
          [user.empresa_id]
        );

        // Distribución de materiales por categoría
        const materialesPorCategoria = await db.query(
          `SELECT c.nombre as categoria, c.icono, COUNT(m.id) as total
           FROM materiales m
           JOIN categorias_materiales c ON m.categoria_id = c.id
           WHERE m.empresa_id = $1 AND m.activo = true
           GROUP BY c.nombre, c.icono
           ORDER BY total DESC`,
          [user.empresa_id]
        );
        
        // Últimas visitas realizadas
        const ultimasVisitas = await db.query(
          `SELECT visitante_nombre, visitante_empresa, motivo_visita, fecha_visita, estado
           FROM visitas
           WHERE empresa_id = $1
           ORDER BY fecha_visita DESC
           LIMIT 5`,
          [user.empresa_id]
        );
        
        // Tickets resueltos con mejor calificación (más rápidos)
        const ticketsMasRapidos = await db.query(
          `SELECT t.titulo, t.prioridad,
                  EXTRACT(EPOCH FROM (t.fecha_cierre - t.fecha_creacion))/3600 as horas_resolucion,
                  t.fecha_cierre
           FROM tickets t
           WHERE t.empresa_id = $1 
           AND t.estado = 'cerrado'
           AND t.fecha_cierre >= NOW() - INTERVAL '60 days'
           AND t.fecha_cierre IS NOT NULL
           ORDER BY horas_resolucion ASC
           LIMIT 3`,
          [user.empresa_id]
        );

        stats.materiales = materiales.rows[0].total;
        stats.materialesBajos = materialesBajos.rows[0].total;
        stats.ticketsEnCurso = ticketsEnCurso.rows[0].total;
        stats.ticketsResueltos = ticketsResueltos.rows[0].total;
        stats.ticketsResueltosRecientes = ticketsResueltosRecientes.rows[0].total;
        stats.ticketsCriticosResueltos = ticketsCriticosResueltos.rows;
        stats.ticketsTimeline = ticketsTimeline.rows;
        stats.tiempoPromedioResolucion = tiempoPromedioResolucion.rows[0].horas_promedio || 0;
        stats.ticketsTotales = ticketsTotales.rows[0].total;
        stats.visitas = visitas.rows[0].total;
        stats.materialesPorCategoria = materialesPorCategoria.rows;
        stats.ultimasVisitas = ultimasVisitas.rows;
        stats.ticketsMasRapidos = ticketsMasRapidos.rows;
        
        // Calcular porcentaje de resolución
        if (stats.ticketsTotales > 0) {
          stats.porcentajeResolucion = Math.round((stats.ticketsResueltos / stats.ticketsTotales) * 100);
        } else {
          stats.porcentajeResolucion = 0;
        }
      }

      res.render('dashboard/index', { title: 'Dashboard', stats });
    } catch (error) {
      console.error('Error en dashboard:', error);
      res.render('dashboard/index', { title: 'Dashboard', stats: {} });
    }
  }
};

module.exports = dashboardController;
