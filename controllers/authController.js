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
      await db.query("UPDATE usuarios SET ultimo_login = TIMEZONE('America/Argentina/Buenos_Aires', NOW()) WHERE id = $1", [user.id]);

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
    const { nombre, email, password, empresa_id, tipo_registro, 
            empresa_nombre, empresa_cuit, empresa_direccion, empresa_telefono, empresa_email } = req.body;

    try {
      // Verificar si el email ya existe
      const existeEmail = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
      if (existeEmail.rows.length > 0) {
        req.session.error = 'El email ya está registrado';
        return res.redirect('/auth/register');
      }

      let empresaId = empresa_id;
      let rolUsuario = 'empresa_user';

      // Si está creando una nueva empresa
      if (tipo_registro === 'nueva') {
        // Verificar que el nombre de empresa no exista
        const existeEmpresa = await db.query('SELECT id FROM empresas WHERE nombre = $1', [empresa_nombre]);
        if (existeEmpresa.rows.length > 0) {
          req.session.error = 'Ya existe una empresa con ese nombre';
          return res.redirect('/auth/register');
        }

        // Crear la nueva empresa
        const nuevaEmpresa = await db.query(
          `INSERT INTO empresas (nombre, cuit, direccion, telefono, email, activo) 
           VALUES ($1, $2, $3, $4, $5, false) 
           RETURNING id`,
          [empresa_nombre, empresa_cuit, empresa_direccion, empresa_telefono, empresa_email]
        );
        
        empresaId = nuevaEmpresa.rows[0].id;
        rolUsuario = 'empresa_admin'; // El que crea la empresa es admin de esa empresa
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Insertar usuario (activo = false por defecto, debe ser aprobado por SKN)
      await db.query(
        'INSERT INTO usuarios (nombre, email, password_hash, empresa_id, rol, activo) VALUES ($1, $2, $3, $4, $5, $6)',
        [nombre, email, passwordHash, empresaId, rolUsuario, false]
      );

      if (tipo_registro === 'nueva') {
        req.session.message = 'Registro exitoso. Tu empresa y cuenta están pendientes de aprobación por SKN.';
      } else {
        req.session.message = 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.';
      }
      
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
