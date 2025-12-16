const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresasController');
const { isSKNUser, isSKNAdmin } = require('./middleware');

// TODAS las rutas SOLO para SKN
router.get('/', isSKNUser, empresasController.index);
router.get('/nueva', isSKNUser, empresasController.showNueva);
router.post('/nueva', isSKNUser, empresasController.crear);
router.get('/:id/editar', isSKNUser, empresasController.showEditar);
router.post('/:id/editar', isSKNUser, empresasController.actualizar);
router.get('/:id', isSKNUser, empresasController.detalle);
router.post('/:id/toggle', isSKNUser, empresasController.toggleActivo);
router.post('/:id/toggle-abonada', isSKNAdmin, empresasController.toggleAbonada);

// Rutas de sucursales
router.post('/:empresa_id/sucursales', isSKNUser, empresasController.crearSucursal);
router.post('/:empresa_id/sucursales/:sucursal_id/editar', isSKNUser, empresasController.editarSucursal);
router.post('/:empresa_id/sucursales/:sucursal_id/eliminar', isSKNUser, empresasController.eliminarSucursal);

module.exports = router;
