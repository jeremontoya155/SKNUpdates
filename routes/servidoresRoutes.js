const express = require('express');
const router = express.Router();
const servidoresController = require('../controllers/servidoresController');
const { isAuthenticated, isSKNUser, canEditInventory } = require('./middleware');

// Listar servidores - todos autenticados pueden ver
router.get('/', isAuthenticated, servidoresController.index);

// Crear - solo admins (DEBE IR ANTES de /:id)
router.get('/nuevo', canEditInventory, servidoresController.showNuevo);
router.post('/nuevo', canEditInventory, servidoresController.crear);

// Ver detalle (DEBE IR DESPUÉS de /nuevo)
router.get('/:id', isAuthenticated, servidoresController.detalle);

module.exports = router;
