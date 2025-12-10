const db = require('../database');
const bcrypt = require('bcrypt');

const usuariosController = {
  // Listar usuarios
  index: async (req, res) => {
    try {
      const user = req.session.user;
      let query, params;

      if (user.rol === 'skn_admin') {
        // SKN admin ve todos los usuarios
        query = `SELECT u.*, e.nombre as empresa_nombre 
                 FROM usuarios u 
                 LEFT JOIN empresas e ON u.empresa_id = e.id 
                 ORDER BY u.fecha_registro DESC`;
        params = [];
      } else if (user.rol === 'empresa_admin') {
        // Admin de empresa solo ve usuarios de su empresa
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

  // Aprobar usuario (solo SKN admin puede aprobar cualquier usuario)
  aprobar: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      // Solo SKN admin puede aprobar usuarios
      if (user.rol !== 'skn_admin') {
        return res.status(403).send('Solo administradores de SKN pueden aprobar usuarios');
      }

      await db.query(
        "UPDATE usuarios SET activo = true, fecha_aprobacion = TIMEZONE('America/Argentina/Buenos_Aires', NOW()) WHERE id = $1",
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
      // SKN admin puede desactivar a cualquiera
      // Empresa admin solo puede desactivar usuarios de su empresa
      if (user.rol === 'empresa_admin') {
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

  // Cambiar rol (solo SKN admin)
  cambiarRol: async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;
    const user = req.session.user;

    try {
      // Solo SKN admin puede cambiar roles
      if (user.rol !== 'skn_admin') {
        return res.status(403).send('Solo administradores de SKN pueden cambiar roles');
      }

      // Validar que el rol sea válido
      const rolesValidos = ['skn_admin', 'skn_user', 'empresa_admin', 'empresa_user'];
      if (!rolesValidos.includes(rol)) {
        req.session.error = 'Rol inválido';
        return res.redirect('/usuarios');
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
