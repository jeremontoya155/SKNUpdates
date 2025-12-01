const express = require('express');
const router = express.Router();
const contadoresController = require('../controllers/contadoresController');
const { isAuthenticated, isSKNUser } = require('./middleware');

// Todas las rutas requieren autenticación
// IMPORTANTE: Rutas específicas ANTES de rutas dinámicas con :id

// Ver listado: Todos los usuarios (filtrado por rol)
router.get('/', isAuthenticated, contadoresController.index);

// Crear contador: SOLO SKN (antes de /:id)
router.get('/nuevo', isSKNUser, contadoresController.showNuevo);
router.post('/nuevo', isSKNUser, contadoresController.crear);

// Editar contador: SOLO SKN (antes de /:id)
router.get('/editar/:id', isSKNUser, contadoresController.showEditar);
router.post('/editar/:id', isSKNUser, contadoresController.actualizar);

// Ver detalle: Todos pueden ver (pero filtrado por empresa)
router.get('/:id', isAuthenticated, contadoresController.detalle);

module.exports = router;
