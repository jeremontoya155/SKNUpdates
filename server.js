const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto-temporal',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // true en producción con HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));

// Middleware para pasar datos de sesión a todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.message = req.session.message || null;
  res.locals.error = req.session.error || null;
  delete req.session.message;
  delete req.session.error;
  next();
});

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const ticketsRoutes = require('./routes/ticketsRoutes');
const visitasRoutes = require('./routes/visitasRoutes');
const servidoresRoutes = require('./routes/servidoresRoutes');
const contadoresRoutes = require('./routes/contadoresRoutes');
const empresasRoutes = require('./routes/empresasRoutes');
const evaluacionesRoutes = require('./routes/evaluacionesRoutes');

// Usar rutas
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/inventario', inventarioRoutes);
app.use('/tickets', ticketsRoutes);
app.use('/visitas', visitasRoutes);
app.use('/servidores', servidoresRoutes);
app.use('/contadores', contadoresRoutes);
app.use('/empresas', empresasRoutes);
app.use('/evaluaciones', evaluacionesRoutes); // SOLO admin SKN

// Ruta principal
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
