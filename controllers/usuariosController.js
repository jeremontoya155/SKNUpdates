const db = require('../database');
const bcrypt = require('bcrypt');

const usuariosController = {
  // Listar usuarios (admin y superadmin)
  index: async (req, res) => {
    try {
      const user = req.session.user;
      let query, params;

      if (user.rol === 'superadmin') {
        query = `SELECT u.*, e.nombre as empresa_nombre 
                 FROM usuarios u 
                 LEFT JOIN empresas e ON u.empresa_id = e.id 
                 ORDER BY u.fecha_registro DESC`;
        params = [];
      } else if (user.rol === 'admin') {
        query = `SELECT u.*, e.nombre as empresa_nombre 
                 FROM usuarios u 
                 LEFT JOIN empresas e ON u.empresa_id = e.id 
                 WHERE u.empresa_id = $1 
                 ORDER BY u.fecha_registro DESC`;
        params = [user.empresa_id];
      } else {
        return res.status(403).send('No tienes permisos');
      }

      const result = await db.query(query, params);
      res.render('usuarios/index', { title: 'Usuarios', usuarios: result.rows });
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      res.render('usuarios/index', { title: 'Usuarios', usuarios: [] });
    }
  },

  // Aprobar usuario (admin)
  aprobar: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      // Verificar que el usuario a aprobar pertenece a la misma empresa
      if (user.rol === 'admin') {
        const usuarioAprobar = await db.query('SELECT empresa_id FROM usuarios WHERE id = $1', [id]);
        if (usuarioAprobar.rows.length === 0 || usuarioAprobar.rows[0].empresa_id !== user.empresa_id) {
          return res.status(403).send('No tienes permisos');
        }
      }

      await db.query(
        'UPDATE usuarios SET activo = true, fecha_aprobacion = NOW() WHERE id = $1',
        [id]
      );

      req.session.message = 'Usuario aprobado exitosamente';
      res.redirect('/usuarios');
    } catch (error) {
      console.error('Error al aprobar usuario:', error);
      req.session.error = 'Error al aprobar usuario';
      res.redirect('/usuarios');
    }
  },

  // Desactivar usuario
  desactivar: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      // Verificar permisos
      if (user.rol === 'admin') {
        const usuarioDesactivar = await db.query('SELECT empresa_id FROM usuarios WHERE id = $1', [id]);
        if (usuarioDesactivar.rows.length === 0 || usuarioDesactivar.rows[0].empresa_id !== user.empresa_id) {
          return res.status(403).send('No tienes permisos');
        }
      }

      await db.query('UPDATE usuarios SET activo = false WHERE id = $1', [id]);

      req.session.message = 'Usuario desactivado';
      res.redirect('/usuarios');
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      req.session.error = 'Error al desactivar usuario';
      res.redirect('/usuarios');
    }
  },

  // Cambiar rol
  cambiarRol: async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;
    const user = req.session.user;

    try {
      // Solo admin puede cambiar roles en su empresa
      if (user.rol !== 'admin' && user.rol !== 'superadmin') {
        return res.status(403).send('No tienes permisos');
      }

      if (user.rol === 'admin') {
        const usuarioCambiar = await db.query('SELECT empresa_id FROM usuarios WHERE id = $1', [id]);
        if (usuarioCambiar.rows.length === 0 || usuarioCambiar.rows[0].empresa_id !== user.empresa_id) {
          return res.status(403).send('No tienes permisos');
        }
      }

      await db.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, id]);

      req.session.message = 'Rol actualizado';
      res.redirect('/usuarios');
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      req.session.error = 'Error al cambiar rol';
      res.redirect('/usuarios');
    }
  }
};

module.exports = usuariosController;
