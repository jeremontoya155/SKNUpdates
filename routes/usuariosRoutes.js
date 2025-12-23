const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { isAuthenticated, hasRole, isAdmin } = require('./middleware');

// Rutas de usuarios (solo admins de SKN y empresa)
router.get('/', isAuthenticated, isAdmin, usuariosController.index);
router.get('/nuevo', isAuthenticated, isAdmin, usuariosController.mostrarNuevo);
router.post('/nuevo', isAuthenticated, isAdmin, usuariosController.crear);
router.get('/:id/editar', isAuthenticated, isAdmin, usuariosController.mostrarEditar);
router.post('/:id/editar', isAuthenticated, isAdmin, usuariosController.editar);
router.post('/:id/aprobar', isAuthenticated, hasRole('skn_admin'), usuariosController.aprobar);
router.post('/:id/desactivar', isAuthenticated, isAdmin, usuariosController.desactivar);
router.post('/:id/cambiar-rol', isAuthenticated, hasRole('skn_admin'), usuariosController.cambiarRol);

module.exports = router;
