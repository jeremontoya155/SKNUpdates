-- Crear tabla de tipos de trabajo (configurable por SKN admin)
CREATE TABLE IF NOT EXISTS tipos_trabajo (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  requiere_instalacion BOOLEAN DEFAULT false,
  color VARCHAR(7) DEFAULT '#2196F3', -- Color para UI
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Agregar datos iniciales
INSERT INTO tipos_trabajo (nombre, descripcion, requiere_instalacion, color) VALUES
  ('Instalación', 'Instalación de nuevo equipo o software', true, '#4CAF50'),
  ('Reparación', 'Reparación de equipo o problema existente', false, '#FF9800'),
  ('Mantenimiento', 'Mantenimiento preventivo o correctivo', false, '#2196F3'),
  ('Capacitación', 'Capacitación de usuarios', false, '#9C27B0'),
  ('Actualización', 'Actualización de software o hardware', false, '#00BCD4'),
  ('Consultoría', 'Asesoramiento técnico', false, '#795548'),
  ('Soporte Remoto', 'Asistencia remota', false, '#607D8B')
ON CONFLICT (nombre) DO NOTHING;

-- Agregar columnas a tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS tipo_trabajo_id INTEGER REFERENCES tipos_trabajo(id),
ADD COLUMN IF NOT EXISTS hora_inicio TIMESTAMP,
ADD COLUMN IF NOT EXISTS hora_fin TIMESTAMP,
ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN hora_inicio IS NOT NULL AND hora_fin IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (hora_fin - hora_inicio)) / 60
    ELSE NULL 
  END
) STORED;

-- Comentarios
COMMENT ON TABLE tipos_trabajo IS 'Tipos de trabajo configurables por SKN admin';
COMMENT ON COLUMN tipos_trabajo.requiere_instalacion IS 'Si requiere documentación especial de instalación';
COMMENT ON COLUMN tickets.tipo_trabajo_id IS 'Tipo de trabajo realizado';
COMMENT ON COLUMN tickets.hora_inicio IS 'Hora de inicio de la intervención (solo soporte físico)';
COMMENT ON COLUMN tickets.hora_fin IS 'Hora de finalización de la intervención (solo soporte físico)';
COMMENT ON COLUMN tickets.duracion_minutos IS 'Duración calculada automáticamente en minutos';

-- Índices
CREATE INDEX IF NOT EXISTS idx_tickets_tipo_trabajo ON tickets(tipo_trabajo_id);
CREATE INDEX IF NOT EXISTS idx_tipos_trabajo_activo ON tipos_trabajo(activo);
