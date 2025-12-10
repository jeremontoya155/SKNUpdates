-- Agregar columna cloudinary_id a tickets_imagenes para almacenar el public_id de Cloudinary
ALTER TABLE tickets_imagenes 
ADD COLUMN IF NOT EXISTS cloudinary_id VARCHAR(255);

-- Comentario de la columna
COMMENT ON COLUMN tickets_imagenes.cloudinary_id IS 'Public ID de la imagen en Cloudinary';
