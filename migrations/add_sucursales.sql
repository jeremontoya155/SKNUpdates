-- Crear tabla de sucursales para empresas
CREATE TABLE IF NOT EXISTS sucursales (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50), -- Código identificador de sucursal (ej: SUC-001, CENTRAL, etc.)
  direccion TEXT NOT NULL,
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(20),
  telefono VARCHAR(50),
  email VARCHAR(255),
  es_principal BOOLEAN DEFAULT false, -- Marcar si es la sucursal principal
  observaciones TEXT,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sucursales_empresa ON sucursales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sucursales_activo ON sucursales(activo);

-- Comentarios
COMMENT ON TABLE sucursales IS 'Sucursales/sedes de cada empresa';
COMMENT ON COLUMN sucursales.es_principal IS 'Indica si es la sucursal/sede principal';
COMMENT ON COLUMN sucursales.codigo IS 'Código identificador de la sucursal';

-- Agregar columna CUIT a empresas si no existe
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cuit VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS provincia VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(20);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS sitio_web VARCHAR(255);

-- Comentarios para nuevas columnas
COMMENT ON COLUMN empresas.cuit IS 'CUIT de la empresa (formato: 20-12345678-9)';
COMMENT ON COLUMN empresas.telefono IS 'Teléfono principal de contacto';
COMMENT ON COLUMN empresas.sitio_web IS 'URL del sitio web corporativo';
