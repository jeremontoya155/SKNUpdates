const express = require('express');
const router = express.Router();
const ticketsController = require('../controllers/ticketsController');
const { isAuthenticated, isSKNUser } = require('./middleware');
const upload = require('../config/multer');

// Rutas de tickets
router.get('/', isAuthenticated, ticketsController.index);
router.get('/nuevo', isAuthenticated, ticketsController.showNuevo);
router.post('/nuevo', isAuthenticated, ticketsController.crear);
router.get('/:id', isAuthenticated, ticketsController.detalle);
router.post('/:id/comentario', isAuthenticated, ticketsController.agregarComentario);

// Subir y eliminar imágenes
router.post('/:id/imagen', isAuthenticated, upload.single('imagen'), ticketsController.subirImagen);
router.post('/:id/imagen/:imagenId/eliminar', isAuthenticated, ticketsController.eliminarImagen);

// SOLO SKN puede cambiar estado y asignar
router.post('/:id/estado', isSKNUser, ticketsController.cambiarEstado);
router.post('/:id/asignar', isSKNUser, ticketsController.asignar);
router.post('/:id/asignarme', isSKNUser, ticketsController.asignarme);

module.exports = router;
