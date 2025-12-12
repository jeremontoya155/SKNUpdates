-- ============================================
-- EQUIPOS CELULARES
-- ============================================

-- Obtener el ID de la categoría Celulares
DO $$
DECLARE
  cat_celulares_id INTEGER;
BEGIN
  SELECT id INTO cat_celulares_id FROM categorias_materiales WHERE nombre = 'Celulares';
  
  -- Celulares Donadio - Logística (sucursal_id=115)
  INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
  VALUES
  (9, 115, cat_celulares_id, 'Celular Camión 1 - Carlos Bustos', 'Samsung', 'A05', 'Teléfono: 3515207275, A05 de Camion1', 'CEL-DON-LOG-001', 1, 1, true),
  (9, 115, cat_celulares_id, 'Celular Camión 2 - Elias Jara', 'Samsung', 'A05', 'Teléfono: 3512349422, A05 de Camion2', 'CEL-DON-LOG-002', 1, 1, true),
  (9, 115, cat_celulares_id, 'Celular Chofer Donadio 2 - Damian Aguirre', 'Alcatel', '5007G', 'Teléfono: 3515207276, Chofer Donadio 2', 'CEL-DON-LOG-003', 1, 1, true),
  (9, 115, cat_celulares_id, 'Celular Facturación - German Mozzoni', 'Samsung', 'A025', 'Teléfono: 3515207274, Galaxy A025 de Facturacion', 'CEL-DON-LOG-004', 1, 1, true),
  (9, 115, cat_celulares_id, 'Celular Logística - Curle', 'Samsung', 'A51', 'Teléfono: 3515522544, S/N: R58N65TQD9T, Galaxy A51', 'CEL-DON-LOG-005', 1, 1, true);

  -- Celular sin ubicación específica
  INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
  VALUES
  (9, 36, cat_celulares_id, 'Celular Nicolas Fornaciari', 'Samsung', 'A05', 'Android, Código: 9451', 'CEL-DON-001', 1, 1, true);
  
END $$;

-- Verificación de celulares
SELECT 
  e.nombre as empresa,
  s.nombre as sucursal,
  m.nombre as celular,
  m.marca,
  m.modelo,
  m.codigo
FROM materiales m
JOIN empresas e ON m.empresa_id = e.id
JOIN sucursales s ON m.sucursal_id = s.id
JOIN categorias_materiales c ON m.categoria_id = c.id
WHERE c.nombre = 'Celulares'
ORDER BY e.nombre, s.nombre;
