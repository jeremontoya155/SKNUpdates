const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { isAuthenticated, canEditInventory, isSKNUser } = require('./middleware');

// Rutas de inventario - todos pueden ver (si tienen acceso)
router.get('/', isAuthenticated, inventarioController.index);
router.get('/:id', isAuthenticated, inventarioController.detalle);

// Solo admins pueden crear/editar
router.get('/nuevo', canEditInventory, inventarioController.showNuevo);
router.post('/nuevo', canEditInventory, inventarioController.crear);
router.post('/movimiento', canEditInventory, inventarioController.registrarMovimiento);

// Solo SKN puede gestionar categorías y plantillas
router.get('/categorias', isSKNUser, inventarioController.categorias);
router.post('/categorias', isSKNUser, inventarioController.crearCategoria);
router.get('/categorias/:id/atributos', isSKNUser, inventarioController.atributosCategoria);
router.post('/categorias/atributos', isSKNUser, inventarioController.crearAtributo);

module.exports = router;
