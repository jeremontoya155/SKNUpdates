// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
}

// Middleware para verificar roles
function hasRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    if (roles.includes(req.session.user.rol)) {
      return next();
    }
    res.status(403).send('No tienes permisos para acceder a esta página');
  };
}

module.exports = { isAuthenticated, hasRole };
