const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { isAuthenticated } = require('./middleware');

// Rutas de inventario
router.get('/', isAuthenticated, inventarioController.index);
router.get('/nuevo', isAuthenticated, inventarioController.showNuevo);
router.post('/nuevo', isAuthenticated, inventarioController.crear);
router.get('/categorias', isAuthenticated, inventarioController.categorias);
router.post('/categorias', isAuthenticated, inventarioController.crearCategoria);
router.get('/categorias/:id/atributos', isAuthenticated, inventarioController.atributosCategoria);
router.post('/categorias/atributos', isAuthenticated, inventarioController.crearAtributo);
router.get('/:id', isAuthenticated, inventarioController.detalle);
router.post('/movimiento', isAuthenticated, inventarioController.registrarMovimiento);

module.exports = router;
