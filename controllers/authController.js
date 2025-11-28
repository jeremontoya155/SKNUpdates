const db = require('../database');
const bcrypt = require('bcrypt');

const authController = {
  // Mostrar formulario de login
  showLogin: (req, res) => {
    res.render('auth/login', { title: 'Iniciar Sesión' });
  },

  // Procesar login
  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      // Buscar usuario
      const result = await db.query(
        'SELECT u.*, e.nombre as empresa_nombre FROM usuarios u LEFT JOIN empresas e ON u.empresa_id = e.id WHERE u.email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        req.session.error = 'Credenciales incorrectas';
        return res.redirect('/auth/login');
      }

      const user = result.rows[0];

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        req.session.error = 'Credenciales incorrectas';
        return res.redirect('/auth/login');
      }

      // Verificar si está activo (aprobado)
      if (!user.activo) {
        req.session.error = 'Tu cuenta está pendiente de aprobación por un administrador';
        return res.redirect('/auth/login');
      }

      // Actualizar último login
      await db.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1', [user.id]);

      // Crear sesión
      req.session.user = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        empresa_id: user.empresa_id,
        empresa_nombre: user.empresa_nombre
      };

      res.redirect('/dashboard');
    } catch (error) {
      console.error('Error en login:', error);
      req.session.error = 'Error al iniciar sesión';
      res.redirect('/auth/login');
    }
  },

  // Mostrar formulario de registro
  showRegister: async (req, res) => {
    try {
      const empresas = await db.query('SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre');
      res.render('auth/register', { title: 'Registrarse', empresas: empresas.rows });
    } catch (error) {
      console.error('Error al cargar empresas:', error);
      res.render('auth/register', { title: 'Registrarse', empresas: [] });
    }
  },

  // Procesar registro
  register: async (req, res) => {
    const { nombre, email, password, empresa_id } = req.body;

    try {
      // Verificar si el email ya existe
      const existeEmail = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
      if (existeEmail.rows.length > 0) {
        req.session.error = 'El email ya está registrado';
        return res.redirect('/auth/register');
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Insertar usuario (activo = false por defecto)
      await db.query(
        'INSERT INTO usuarios (nombre, email, password_hash, empresa_id, rol, activo) VALUES ($1, $2, $3, $4, $5, $6)',
        [nombre, email, passwordHash, empresa_id, 'usuario', false]
      );

      req.session.message = 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.';
      res.redirect('/auth/login');
    } catch (error) {
      console.error('Error en registro:', error);
      req.session.error = 'Error al registrar usuario';
      res.redirect('/auth/register');
    }
  },

  // Cerrar sesión
  logout: (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
  }
};

module.exports = authController;
