-- Agregar campos de stock a tabla materiales (si no existen)
ALTER TABLE materiales 
ADD COLUMN IF NOT EXISTS stock_actual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS stock_minimo INTEGER DEFAULT 1;

-- Actualizar equipos existentes para que tengan stock = 1 (disponible)
UPDATE materiales 
SET stock_actual = 1, stock_minimo = 1
WHERE categoria_id IN (1, 2, 7) -- PC, Notebook, Celulares
AND stock_actual IS NULL;

-- Verificar
SELECT 
  m.id,
  m.nombre,
  c.nombre as categoria,
  m.stock_actual,
  m.stock_minimo
FROM materiales m
JOIN categorias_materiales c ON m.categoria_id = c.id
WHERE c.nombre IN ('PC de Escritorio', 'Notebooks', 'Celulares')
ORDER BY c.nombre, m.nombre
LIMIT 10;
