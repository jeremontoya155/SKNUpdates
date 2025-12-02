const db = require('../database');

const servidoresController = {
  // Listar servidores de una empresa
  index: async (req, res) => {
    try {
      const user = req.session.user;
      let query = 'SELECT * FROM servidores WHERE activo = true';
      const params = [];

      // SKN ve todos, empresas solo los suyos
      if (user.rol === 'empresa_admin' || user.rol === 'empresa_user') {
        // Seguridad: asegurar que exista empresa_id en sesión
        if (!user.empresa_id) {
          req.session.error = 'No se pudo determinar la empresa del usuario';
          return res.render('servidores/index', { title: 'Servidores', servidores: [] });
        }
        query += ' AND empresa_id = $1';
        params.push(parseInt(user.empresa_id, 10));
      }

      query += ' ORDER BY tipo, nombre';

      const result = await db.query(query, params);

      res.render('servidores/index', {
        title: 'Servidores',
        servidores: result.rows
      });
    } catch (error) {
      console.error('Error al listar servidores:', error);
      res.render('servidores/index', { 
        title: 'Servidores', 
        servidores: [] 
      });
    }
  },

  // Mostrar formulario de nuevo servidor
  showNuevo: async (req, res) => {
    try {
      const user = req.session.user;
      let empresas = [];
      
      // SKN puede elegir empresa, otros usan la suya
      if (user.rol === 'skn_admin' || user.rol === 'skn_user') {
        const result = await db.query(
          'SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre'
        );
        empresas = result.rows;
      }
      
      res.render('servidores/nuevo', { 
        title: 'Nuevo Servidor',
        empresas: empresas
      });
    } catch (error) {
      console.error('Error:', error);
      res.redirect('/servidores');
    }
  },

  // Crear servidor
  crear: async (req, res) => {
    const { empresa_id, tipo, nombre, ip_externa, ip_interna, puerto, usuario, password, observaciones } = req.body;
    const user = req.session.user;
    
    try {
      // Determinar empresa_id
      let empresaId = empresa_id;
      if (user.rol === 'empresa_admin' || user.rol === 'empresa_user') {
        if (!user.empresa_id) {
          req.session.error = 'No se pudo determinar la empresa del usuario';
          return res.redirect('/servidores/nuevo');
        }
        empresaId = user.empresa_id;
      }
      
      // Validar que empresaId existe
      if (!empresaId) {
        req.session.error = 'Debe especificar una empresa';
        return res.redirect('/servidores/nuevo');
      }
      
      await db.query(
        `INSERT INTO servidores (empresa_id, tipo, nombre, ip_externa, ip_interna, puerto, usuario, password, observaciones)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [empresaId, tipo, nombre, ip_externa, ip_interna, puerto, usuario, password, observaciones]
      );
      
      req.session.message = 'Servidor creado exitosamente';
      res.redirect('/servidores');
    } catch (error) {
      console.error('Error al crear servidor:', error);
      req.session.error = 'Error al crear servidor';
      res.redirect('/servidores/nuevo');
    }
  },

  // Ver detalle de servidor
  detalle: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;
    
    try {
      let query = `
        SELECT s.*, e.nombre as empresa_nombre
        FROM servidores s
        LEFT JOIN empresas e ON s.empresa_id = e.id
        WHERE s.id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        req.session.error = 'Servidor no encontrado';
        return res.redirect('/servidores');
      }
      
      const servidor = result.rows[0];
      
      // Verificar permisos
      if ((user.rol === 'empresa_admin' || user.rol === 'empresa_user') && 
          servidor.empresa_id !== user.empresa_id) {
        req.session.error = 'No tienes permisos para ver este servidor';
        return res.redirect('/servidores');
      }
      
      res.render('servidores/detalle', {
        title: 'Detalle Servidor',
        servidor: servidor
      });
    } catch (error) {
      console.error('Error al ver detalle:', error);
      res.redirect('/servidores');
    }
  }
};

module.exports = servidoresController;
