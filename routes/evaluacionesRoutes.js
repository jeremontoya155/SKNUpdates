const express = require('express');
const router = express.Router();
const evaluacionesController = require('../controllers/evaluacionesController');
const multer = require('multer');
const path = require('path');

// Configuración de multer para imágenes de evaluaciones
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/evaluaciones/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'eval-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, png) y PDFs'));
    }
  }
});

// ⚠️ IMPORTANTE: TODAS las rutas requieren email fnalbandian@gmail.com
// Ningún otro usuario puede acceder a esta sección
router.use(evaluacionesController.soloAdminSKN);

// Rutas de evaluaciones internas
router.get('/', evaluacionesController.index);
router.get('/nuevo', evaluacionesController.nuevo);
router.post('/', upload.array('imagenes', 10), evaluacionesController.crear);
router.get('/:id', evaluacionesController.detalle);
router.get('/:id/editar', evaluacionesController.editar);
router.post('/:id', upload.array('imagenes', 10), evaluacionesController.actualizar);
router.post('/:id/eliminar', evaluacionesController.eliminar);

module.exports = router;
