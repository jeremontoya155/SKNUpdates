-- Script para hacer ROLLBACK de las tablas de atributos dinámicos

-- Eliminar tablas en orden inverso (por las foreign keys)
DROP TABLE IF EXISTS valores_atributos_material CASCADE;
DROP TABLE IF EXISTS atributos_categoria CASCADE;

-- Mensaje de confirmación
-- Las tablas de atributos dinámicos han sido eliminadas
-- El sistema volverá a funcionar con la estructura original
