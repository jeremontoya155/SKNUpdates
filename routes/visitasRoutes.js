const express = require('express');
const router = express.Router();
const visitasController = require('../controllers/visitasController');
const { isAuthenticated } = require('./middleware');

// Rutas de visitas
router.get('/', isAuthenticated, visitasController.index);
router.get('/nuevo', isAuthenticated, visitasController.showNuevo);
router.post('/nuevo', isAuthenticated, visitasController.crear);
router.get('/:id', isAuthenticated, visitasController.detalle);
router.post('/:id/estado', isAuthenticated, visitasController.cambiarEstado);

module.exports = router;
