const express = require('express');
const router = express.Router();
const ticketsController = require('../controllers/ticketsController');
const { isAuthenticated } = require('./middleware');

// Rutas de tickets
router.get('/', isAuthenticated, ticketsController.index);
router.get('/nuevo', isAuthenticated, ticketsController.showNuevo);
router.post('/nuevo', isAuthenticated, ticketsController.crear);
router.get('/:id', isAuthenticated, ticketsController.detalle);
router.post('/:id/comentario', isAuthenticated, ticketsController.agregarComentario);
router.post('/:id/estado', isAuthenticated, ticketsController.cambiarEstado);
router.post('/:id/asignar', isAuthenticated, ticketsController.asignar);

module.exports = router;
