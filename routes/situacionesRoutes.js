const express = require('express');
const router = express.Router();
const situacionesController = require('../controllers/situacionesController');
const { isSKNAdmin } = require('./middleware');

// TODAS las rutas SOLO para SKN ADMIN
router.get('/', isSKNAdmin, situacionesController.index);
router.get('/nueva', isSKNAdmin, situacionesController.showNueva);
router.post('/nueva', isSKNAdmin, situacionesController.crear);
router.get('/:id', isSKNAdmin, situacionesController.detalle);
router.get('/:id/editar', isSKNAdmin, situacionesController.showEditar);
router.post('/:id/editar', isSKNAdmin, situacionesController.actualizar);
router.post('/:id/eliminar', isSKNAdmin, situacionesController.eliminar);

// Rutas para materiales del checklist
router.post('/:id/materiales', isSKNAdmin, situacionesController.agregarMaterial);
router.post('/:id/materiales/:materialId/editar', isSKNAdmin, situacionesController.actualizarMaterial);
router.post('/:id/materiales/:materialId/eliminar', isSKNAdmin, situacionesController.eliminarMaterial);

module.exports = router;
