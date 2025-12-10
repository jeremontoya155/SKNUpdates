const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dsjhopbuf',
  api_key: process.env.CLOUDINARY_API_KEY || '889815153528246',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'QkmdP9B-UEUb9wOMkEsEb_Bjr6A'
});

// Configuración de almacenamiento para tickets
const ticketsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'skn-tickets', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Sin GIF para ahorrar espacio
    format: 'webp', // Convertir a WebP (menor tamaño)
    transformation: [
      { 
        width: 1200, 
        height: 1200, 
        crop: 'limit', // Limitar tamaño máximo (reducido de 1920 a 1200)
        quality: 'auto:low', // Calidad baja pero aceptable
        fetch_format: 'auto' // Formato óptimo según navegador
      }
    ],
    public_id: (req, file) => {
      // Generar nombre único: timestamp-random
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `ticket-${uniqueSuffix}`;
    }
  }
});

// Configuración de almacenamiento para evaluaciones
const evaluacionesStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'skn-evaluaciones', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], // Sin GIF
    format: 'webp', // Convertir a WebP
    transformation: [
      { 
        width: 1200, 
        height: 1200, 
        crop: 'limit',
        quality: 'auto:low',
        fetch_format: 'auto'
      }
    ],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `evaluacion-${uniqueSuffix}`;
    }
  }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']; // Sin GIF
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP)'), false);
  }
};

// Configuración de multer para tickets
const uploadTickets = multer({
  storage: ticketsStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// Configuración de multer para evaluaciones
const uploadEvaluaciones = multer({
  storage: evaluacionesStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// Función para eliminar imagen de Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw error;
  }
};

// Función para obtener URL de imagen con transformaciones
const getImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto:low', // Calidad baja por defecto
    fetch_format: 'auto', // Formato óptimo automático
    ...options
  };
  return cloudinary.url(publicId, defaultOptions);
};

// Función para obtener thumbnail optimizado (miniatura pequeña)
const getThumbnailUrl = (publicId) => {
  return cloudinary.url(publicId, {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 'auto:eco', // Calidad económica para thumbnails
    fetch_format: 'auto'
  });
};

// Función para obtener imagen de vista previa (mediana)
const getPreviewUrl = (publicId) => {
  return cloudinary.url(publicId, {
    width: 600,
    height: 600,
    crop: 'limit',
    quality: 'auto:low',
    fetch_format: 'auto'
  });
};

// Función para obtener imagen completa optimizada
const getFullImageUrl = (publicId) => {
  return cloudinary.url(publicId, {
    width: 1200,
    height: 1200,
    crop: 'limit',
    quality: 'auto:good', // Calidad buena solo para vista completa
    fetch_format: 'auto'
  });
};

module.exports = {
  cloudinary,
  uploadTickets,
  uploadEvaluaciones,
  deleteImage,
  getImageUrl,
  getThumbnailUrl,
  getPreviewUrl,
  getFullImageUrl
};
