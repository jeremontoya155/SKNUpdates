-- ============================================
-- ACTUALIZACIÓN: Roles y Materiales Plantilla
-- ============================================

-- 1. Actualizar roles existentes en usuarios
-- Cambiar 'admin' a 'skn_admin' y 'usuario' a 'empresa_user'
UPDATE usuarios SET rol = 'skn_admin' WHERE rol = 'admin';
UPDATE usuarios SET rol = 'empresa_user' WHERE rol = 'usuario';
UPDATE usuarios SET rol = 'skn_user' WHERE rol = 'tecnico';

-- 2. Agregar campo para materiales plantilla
ALTER TABLE materiales ADD COLUMN IF NOT EXISTS es_plantilla BOOLEAN DEFAULT FALSE;
ALTER TABLE materiales ADD COLUMN IF NOT EXISTS plantilla_nombre VARCHAR(255);

-- 3. Agregar índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_materiales_nombre ON materiales(nombre);
CREATE INDEX IF NOT EXISTS idx_materiales_codigo ON materiales(codigo);
CREATE INDEX IF NOT EXISTS idx_materiales_categoria ON materiales(categoria_id);
CREATE INDEX IF NOT EXISTS idx_materiales_empresa ON materiales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_materiales_plantilla ON materiales(es_plantilla) WHERE es_plantilla = TRUE;

-- 4. Crear tabla de copias de plantillas (para rastrear qué empresa copió qué plantilla)
CREATE TABLE IF NOT EXISTS materiales_desde_plantilla (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
  plantilla_id INTEGER NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
  fecha_copia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(material_id, plantilla_id)
);

-- 5. Crear materiales plantilla genéricos para SKN (empresa_id = 1)
-- Solo si no existen ya

-- Plantilla: Notebook Corporativa
INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
SELECT 
  'Notebook Corporativa',
  'Plantilla genérica de notebook para uso corporativo',
  'PLANTILLA-NB-001',
  0,
  5,
  'unidad',
  (SELECT id FROM categorias_materiales WHERE nombre = 'Electrónica' LIMIT 1),
  1,
  TRUE,
  'Notebook Estándar'
WHERE NOT EXISTS (
  SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-NB-001'
);

-- Plantilla: Impresora
INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
SELECT 
  'Impresora Multifunción',
  'Plantilla genérica de impresora multifunción',
  'PLANTILLA-IMP-001',
  0,
  2,
  'unidad',
  (SELECT id FROM categorias_materiales WHERE nombre = 'Electrónica' LIMIT 1),
  1,
  TRUE,
  'Impresora Estándar'
WHERE NOT EXISTS (
  SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-IMP-001'
);

-- Plantilla: Monitor
INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
SELECT 
  'Monitor LED',
  'Plantilla genérica de monitor LED',
  'PLANTILLA-MON-001',
  0,
  3,
  'unidad',
  (SELECT id FROM categorias_materiales WHERE nombre = 'Electrónica' LIMIT 1),
  1,
  TRUE,
  'Monitor Estándar'
WHERE NOT EXISTS (
  SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-MON-001'
);

-- Plantilla: Teclado y Mouse
INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
SELECT 
  'Kit Teclado + Mouse',
  'Plantilla genérica de kit teclado y mouse',
  'PLANTILLA-TM-001',
  0,
  10,
  'unidad',
  (SELECT id FROM categorias_materiales WHERE nombre = 'Electrónica' LIMIT 1),
  1,
  TRUE,
  'Teclado Mouse Estándar'
WHERE NOT EXISTS (
  SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-TM-001'
);

-- Plantilla:Router
INSERT INTO materiales (nombre, descripcion, codigo, cantidad_actual, stock_minimo, unidad_medida, categoria_id, empresa_id, es_plantilla, plantilla_nombre)
SELECT 
  'Router Wi-Fi',
  'Plantilla genérica de router wifi corporativo',
  'PLANTILLA-RTR-001',
  0,
  2,
  'unidad',
  (SELECT id FROM categorias_materiales WHERE nombre = 'Electrónica' LIMIT 1),
  1,
  TRUE,
  'Router Estándar'
WHERE NOT EXISTS (
  SELECT 1 FROM materiales WHERE codigo = 'PLANTILLA-RTR-001'
);

-- 6. Agregar atributos a las plantillas de notebooks
INSERT INTO valores_atributos_material (material_id, atributo_id, valor)
SELECT 
  m.id,
  a.id,
  CASE a.nombre
    WHEN 'RAM' THEN '8GB'
    WHEN 'Procesador' THEN 'Intel Core i5'
    WHEN 'Almacenamiento' THEN '256GB SSD'
    WHEN 'Pantalla' THEN '15.6 pulgadas'
  END
FROM materiales m
CROSS JOIN atributos_categoria a
WHERE m.codigo = 'PLANTILLA-NB-001'
  AND a.nombre IN ('RAM', 'Procesador', 'Almacenamiento', 'Pantalla')
  AND NOT EXISTS (
    SELECT 1 FROM valores_atributos_material vam 
    WHERE vam.material_id = m.id AND vam.atributo_id = a.id
  );

-- 7. Comentarios sobre los nuevos roles
COMMENT ON COLUMN usuarios.rol IS 'Roles: skn_admin (admin SKN), skn_user (usuario SKN), empresa_admin (admin de empresa), empresa_user (usuario de empresa)';

-- 8. Actualizar el usuario admin de SKN si existe
UPDATE usuarios SET rol = 'skn_admin' WHERE email = 'admin@skn.com';

SELECT 'Actualización completada exitosamente' as resultado;
