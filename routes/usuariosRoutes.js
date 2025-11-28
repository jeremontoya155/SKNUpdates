const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { isAuthenticated, hasRole, isAdmin } = require('./middleware');

// Rutas de usuarios (solo admins de SKN y empresa)
router.get('/', isAuthenticated, isAdmin, usuariosController.index);
router.post('/:id/aprobar', isAuthenticated, hasRole('skn_admin'), usuariosController.aprobar);
router.post('/:id/desactivar', isAuthenticated, isAdmin, usuariosController.desactivar);
router.post('/:id/cambiar-rol', isAuthenticated, hasRole('skn_admin'), usuariosController.cambiarRol);

module.exports = router;
