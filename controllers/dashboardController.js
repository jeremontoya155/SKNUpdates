const db = require('../database');

const dashboardController = {
  // Dashboard principal
  index: async (req, res) => {
    try {
      const user = req.session.user;
      const stats = {};

      // Estadísticas según el rol
      if (user.rol === 'superadmin') {
        // Superadmin ve todo
        const empresas = await db.query('SELECT COUNT(*) as total FROM empresas WHERE activo = true');
        const usuarios = await db.query('SELECT COUNT(*) as total FROM usuarios');
        const tickets = await db.query('SELECT COUNT(*) as total FROM tickets WHERE estado != $1', ['cerrado']);
        
        stats.empresas = empresas.rows[0].total;
        stats.usuarios = usuarios.rows[0].total;
        stats.tickets = tickets.rows[0].total;
      } else {
        // Admin y usuarios ven solo su empresa
        const materiales = await db.query(
          'SELECT COUNT(*) as total FROM materiales WHERE empresa_id = $1 AND activo = true',
          [user.empresa_id]
        );
        
        const materialesBajos = await db.query(
          'SELECT COUNT(*) as total FROM materiales WHERE empresa_id = $1 AND stock_actual <= stock_minimo AND activo = true',
          [user.empresa_id]
        );
        
        const tickets = await db.query(
          'SELECT COUNT(*) as total FROM tickets WHERE empresa_id = $1 AND estado != $2',
          [user.empresa_id, 'cerrado']
        );
        
        const visitas = await db.query(
          'SELECT COUNT(*) as total FROM visitas WHERE empresa_id = $1 AND fecha_visita >= NOW()',
          [user.empresa_id]
        );

        stats.materiales = materiales.rows[0].total;
        stats.materialesBajos = materialesBajos.rows[0].total;
        stats.tickets = tickets.rows[0].total;
        stats.visitas = visitas.rows[0].total;
      }

      res.render('dashboard/index', { title: 'Dashboard', stats });
    } catch (error) {
      console.error('Error en dashboard:', error);
      res.render('dashboard/index', { title: 'Dashboard', stats: {} });
    }
  }
};

module.exports = dashboardController;
