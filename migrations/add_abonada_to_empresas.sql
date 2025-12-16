-- Agregar campo 'abonada' a la tabla empresas
-- Este campo indica si la empresa tiene el servicio pagado/abonado

ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS abonada BOOLEAN DEFAULT TRUE;

-- Agregar comentario a la columna
COMMENT ON COLUMN empresas.abonada IS 'Indica si la empresa está abonada al servicio';

-- Actualizar todas las empresas existentes como abonadas por defecto
UPDATE empresas SET abonada = TRUE WHERE abonada IS NULL;

-- Verificar la actualización
SELECT id, nombre, abonada FROM empresas;
