const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { isAuthenticated, canEditInventory, isSKNUser } = require('./middleware');

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas dinámicas (:id)

// Rutas de inventario - listado (todos pueden ver)
router.get('/', isAuthenticated, inventarioController.index);

// Solo admins pueden crear/editar - ANTES de /:id
router.get('/nuevo', canEditInventory, inventarioController.showNuevo);
router.post('/nuevo', canEditInventory, inventarioController.crear);
router.post('/movimiento', canEditInventory, inventarioController.registrarMovimiento);

// Solo SKN puede gestionar categorías y plantillas - ANTES de /:id
router.get('/categorias', isSKNUser, inventarioController.categorias);
router.post('/categorias', isSKNUser, inventarioController.crearCategoria);
router.get('/categorias/:id/atributos', isSKNUser, inventarioController.atributosCategoria);
router.post('/categorias/atributos', isSKNUser, inventarioController.crearAtributo);

// Ruta dinámica /:id debe ir AL FINAL
router.get('/:id', isAuthenticated, inventarioController.detalle);

module.exports = router;
