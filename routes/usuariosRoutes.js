const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { isAuthenticated, hasRole } = require('./middleware');

// Rutas de usuarios (solo admin y superadmin)
router.get('/', isAuthenticated, hasRole('admin', 'superadmin'), usuariosController.index);
router.post('/:id/aprobar', isAuthenticated, hasRole('admin', 'superadmin'), usuariosController.aprobar);
router.post('/:id/desactivar', isAuthenticated, hasRole('admin', 'superadmin'), usuariosController.desactivar);
router.post('/:id/cambiar-rol', isAuthenticated, hasRole('admin', 'superadmin'), usuariosController.cambiarRol);

module.exports = router;
