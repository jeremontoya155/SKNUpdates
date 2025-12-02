-- Agregar columna sucursal_id a la tabla materiales (inventario)
ALTER TABLE materiales 
ADD COLUMN IF NOT EXISTS sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL;

-- Índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_materiales_sucursal ON materiales(sucursal_id);

-- Comentario
COMMENT ON COLUMN materiales.sucursal_id IS 'Sucursal donde se encuentra el artículo/material';

-- Nota: Por defecto será NULL, lo que significa que no está asignado a ninguna sucursal específica
-- o que está en el almacén central
