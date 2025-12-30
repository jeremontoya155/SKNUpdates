-- Agregar columnas para comentario e imagen en el historial de tickets
-- Fecha: 2025-12-30

-- Agregar columna comentario si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets_historial_estado' 
        AND column_name = 'comentario'
    ) THEN
        ALTER TABLE tickets_historial_estado 
        ADD COLUMN comentario TEXT;
    END IF;
END $$;

-- Agregar columna imagen_ruta si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets_historial_estado' 
        AND column_name = 'imagen_ruta'
    ) THEN
        ALTER TABLE tickets_historial_estado 
        ADD COLUMN imagen_ruta VARCHAR(500);
    END IF;
END $$;

COMMENT ON COLUMN tickets_historial_estado.comentario IS 'Comentario del técnico al cambiar el estado';
COMMENT ON COLUMN tickets_historial_estado.imagen_ruta IS 'Ruta de la imagen adjunta al cambio de estado';
