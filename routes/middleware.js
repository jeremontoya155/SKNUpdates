// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
}

// Middleware para verificar roles específicos
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

// Middleware para verificar si es usuario de SKN (admin o user)
function isSKNUser(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  if (req.session.user.rol === 'skn_admin' || req.session.user.rol === 'skn_user') {
    return next();
  }
  res.status(403).send('Solo usuarios de SKN pueden acceder a esta página');
}

// Middleware para verificar si es admin (SKN o de empresa)
function isAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  if (req.session.user.rol === 'skn_admin' || req.session.user.rol === 'empresa_admin') {
    return next();
  }
  res.status(403).send('Solo administradores pueden acceder a esta página');
}

// Middleware para verificar si puede editar inventario
function canEditInventory(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  // SKN admin puede editar todo
  // Empresa admin puede editar solo de su empresa
  if (req.session.user.rol === 'skn_admin' || req.session.user.rol === 'empresa_admin') {
    return next();
  }
  res.status(403).send('No tienes permisos para editar el inventario');
}

module.exports = { 
  isAuthenticated, 
  hasRole, 
  isSKNUser, 
  isAdmin, 
  canEditInventory 
};
