-- Tabla para almacenar imágenes de tickets
CREATE TABLE IF NOT EXISTS tickets_imagenes (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  tamanio INTEGER,
  subido_por INTEGER REFERENCES usuarios(id),
  fecha_subida TIMESTAMP DEFAULT NOW(),
  descripcion TEXT
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tickets_imagenes_ticket_id ON tickets_imagenes(ticket_id);

-- Comentarios
COMMENT ON TABLE tickets_imagenes IS 'Imágenes adjuntas a tickets (capturas de error, fotos, etc.)';
COMMENT ON COLUMN tickets_imagenes.nombre_archivo IS 'Nombre original del archivo';
COMMENT ON COLUMN tickets_imagenes.ruta_archivo IS 'Ruta donde se guardó el archivo';
COMMENT ON COLUMN tickets_imagenes.tamanio IS 'Tamaño en bytes';
