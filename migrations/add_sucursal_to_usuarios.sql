-- Agregar columna sucursal_id a la tabla usuarios
-- Permite asignar una sucursal específica a cada usuario

-- 1. Agregar la columna sucursal_id
ALTER TABLE usuarios 
ADD COLUMN sucursal_id INTEGER;

-- 2. Agregar constraint de foreign key
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_sucursal 
FOREIGN KEY (sucursal_id) 
REFERENCES sucursales(id) 
ON DELETE SET NULL;

-- 3. Crear índice para mejorar performance de búsquedas
CREATE INDEX idx_usuarios_sucursal_id ON usuarios(sucursal_id);

-- Comentarios para documentación
COMMENT ON COLUMN usuarios.sucursal_id IS 'Sucursal a la que está asignado el usuario';

-- Mostrar resultado
SELECT 'Columna sucursal_id agregada exitosamente a tabla usuarios' as resultado;
