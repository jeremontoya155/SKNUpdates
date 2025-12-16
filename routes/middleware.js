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

// Middleware para verificar si es usuario de SKN (admin, subadmin o user)
function isSKNUser(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  const sknRoles = ['skn_admin', 'skn_subadmin', 'skn_user'];
  if (sknRoles.includes(req.session.user.rol)) {
    return next();
  }
  res.status(403).send('Solo usuarios de SKN pueden acceder a esta página');
}

// Middleware para verificar si es admin completo de SKN (solo skn_admin)
function isSKNAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  if (req.session.user.rol === 'skn_admin') {
    return next();
  }
  res.status(403).send('Solo administradores completos de SKN pueden acceder');
}

// Middleware para verificar si es admin o subadmin de SKN
function isSKNAdminOrSubadmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  if (req.session.user.rol === 'skn_admin' || req.session.user.rol === 'skn_subadmin') {
    return next();
  }
  res.status(403).send('Solo administradores de SKN pueden acceder');
}

// Middleware para verificar si es admin (SKN, subadmin SKN o de empresa)
function isAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  const adminRoles = ['skn_admin', 'skn_subadmin', 'empresa_admin'];
  if (adminRoles.includes(req.session.user.rol)) {
    return next();
  }
  res.status(403).send('Solo administradores pueden acceder a esta página');
}

// Middleware para verificar si puede editar inventario
function canEditInventory(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  // SKN admin y subadmin pueden editar todo
  // Empresa admin puede editar solo de su empresa
  const canEdit = ['skn_admin', 'skn_subadmin', 'empresa_admin'];
  if (canEdit.includes(req.session.user.rol)) {
    return next();
  }
  res.status(403).send('No tienes permisos para editar el inventario');
}

module.exports = { 
  isAuthenticated, 
  hasRole, 
  isSKNUser,
  isSKNAdmin,
  isSKNAdminOrSubadmin,
  isAdmin, 
  canEditInventory 
};
