const express = require('express');
const router = express.Router();
const servidoresController = require('../controllers/servidoresController');
const { isAuthenticated, isSKNUser, canEditInventory } = require('./middleware');

// Listar servidores - todos autenticados pueden ver
router.get('/', isAuthenticated, servidoresController.index);

// Ver detalle
router.get('/:id', isAuthenticated, servidoresController.detalle);

// Crear - solo admins
router.get('/nuevo', canEditInventory, servidoresController.showNuevo);
router.post('/nuevo', canEditInventory, servidoresController.crear);

module.exports = router;
