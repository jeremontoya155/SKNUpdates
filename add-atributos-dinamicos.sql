-- Script para agregar atributos dinámicos a los materiales

-- Tabla para definir atributos personalizados por categoría
CREATE TABLE IF NOT EXISTS atributos_categoria (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER REFERENCES categorias_materiales(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL, -- ej: "RAM", "Procesador", "Marca"
    tipo_dato VARCHAR(50) DEFAULT 'texto' CHECK (tipo_dato IN ('texto', 'numero', 'fecha', 'seleccion')),
    opciones TEXT, -- Para tipo 'seleccion', guardar opciones separadas por comas
    requerido BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para almacenar los valores de atributos de cada material
CREATE TABLE IF NOT EXISTS valores_atributos_material (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materiales(id) ON DELETE CASCADE,
    atributo_id INTEGER REFERENCES atributos_categoria(id) ON DELETE CASCADE,
    valor TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, atributo_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_atributos_categoria ON atributos_categoria(categoria_id);
CREATE INDEX IF NOT EXISTS idx_valores_material ON valores_atributos_material(material_id);
CREATE INDEX IF NOT EXISTS idx_valores_atributo ON valores_atributos_material(atributo_id);

-- Ejemplos de atributos predefinidos

-- Para categoría "Notebooks" (asumiendo que el id es 1)
-- Si necesitas crear la categoría primero, descomenta esto:
-- INSERT INTO categorias_materiales (empresa_id, nombre, descripcion) 
-- VALUES (1, 'Notebooks', 'Computadoras portátiles') 
-- ON CONFLICT DO NOTHING;

-- Insertar atributos de ejemplo para Notebooks
-- Nota: Debes ajustar el categoria_id según tu base de datos
/*
INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, requerido, orden) VALUES
(1, 'Marca', 'texto', true, 1),
(1, 'Modelo', 'texto', true, 2),
(1, 'Procesador', 'texto', false, 3),
(1, 'RAM (GB)', 'numero', false, 4),
(1, 'Disco Duro', 'texto', false, 5),
(1, 'Pantalla', 'texto', false, 6),
(1, 'Sistema Operativo', 'seleccion', false, 7);
*/

-- Para categoría "Impresoras"
/*
INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, requerido, orden) VALUES
(2, 'Marca', 'texto', true, 1),
(2, 'Modelo', 'texto', true, 2),
(2, 'Tipo', 'seleccion', true, 3),
(2, 'Conexión', 'seleccion', false, 4),
(2, 'Tipo Cartucho', 'texto', false, 5);
*/

COMMENT ON TABLE atributos_categoria IS 'Define qué atributos personalizados tiene cada categoría de materiales';
COMMENT ON TABLE valores_atributos_material IS 'Almacena los valores de los atributos para cada material específico';
