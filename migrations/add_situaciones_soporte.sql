-- ============================================
-- SISTEMA DE SITUACIONES DE SOPORTE Y CHECKLIST DE MATERIALES
-- ============================================

-- Tabla de situaciones/casos de soporte
CREATE TABLE IF NOT EXISTS situaciones_soporte (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo_soporte VARCHAR(20) NOT NULL CHECK (tipo_soporte IN ('presencial', 'remoto')),
  requiere_materiales BOOLEAN DEFAULT FALSE,
  color VARCHAR(7) DEFAULT '#3498db',
  activo BOOLEAN DEFAULT TRUE,
  orden INTEGER DEFAULT 0,
  creado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE situaciones_soporte IS 'Situaciones o casos específicos para cada tipo de soporte';
COMMENT ON COLUMN situaciones_soporte.tipo_soporte IS 'Tipo de soporte: presencial o remoto';
COMMENT ON COLUMN situaciones_soporte.requiere_materiales IS 'Si requiere checklist de materiales (solo para presencial)';

-- Tabla de materiales/equipos para checklist
CREATE TABLE IF NOT EXISTS checklist_materiales (
  id SERIAL PRIMARY KEY,
  situacion_id INTEGER NOT NULL REFERENCES situaciones_soporte(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  obligatorio BOOLEAN DEFAULT FALSE,
  cantidad_sugerida INTEGER DEFAULT 1,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE checklist_materiales IS 'Materiales necesarios para cada situación de soporte presencial';
COMMENT ON COLUMN checklist_materiales.obligatorio IS 'Si el material es obligatorio para esta situación';

-- Relación de ticket con situación
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS situacion_soporte_id INTEGER REFERENCES situaciones_soporte(id);

COMMENT ON COLUMN tickets.situacion_soporte_id IS 'Situación específica del ticket según tipo de soporte';

-- Tabla para registrar checklist completado por técnico
CREATE TABLE IF NOT EXISTS ticket_checklist_materiales (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES checklist_materiales(id) ON DELETE CASCADE,
  llevado BOOLEAN DEFAULT FALSE,
  cantidad_llevada INTEGER DEFAULT 0,
  notas TEXT,
  registrado_por INTEGER REFERENCES usuarios(id),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ticket_id, material_id)
);

COMMENT ON TABLE ticket_checklist_materiales IS 'Registro de materiales llevados por el técnico para cada ticket';
COMMENT ON COLUMN ticket_checklist_materiales.llevado IS 'Si el técnico confirmó llevar este material';

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_situaciones_tipo ON situaciones_soporte(tipo_soporte);
CREATE INDEX IF NOT EXISTS idx_situaciones_activo ON situaciones_soporte(activo);
CREATE INDEX IF NOT EXISTS idx_checklist_situacion ON checklist_materiales(situacion_id);
CREATE INDEX IF NOT EXISTS idx_tickets_situacion ON tickets(situacion_soporte_id);
CREATE INDEX IF NOT EXISTS idx_ticket_checklist ON ticket_checklist_materiales(ticket_id);

-- ============================================
-- DATOS DE EJEMPLO: SITUACIONES PRESENCIALES
-- ============================================

INSERT INTO situaciones_soporte (nombre, descripcion, tipo_soporte, requiere_materiales, color, orden) VALUES
('Instalación de Equipo Nuevo', 'Instalación y configuración de nuevo equipo en sitio', 'presencial', true, '#27ae60', 1),
('Mantenimiento Preventivo', 'Revisión y mantenimiento programado de equipos', 'presencial', true, '#3498db', 2),
('Reparación de Hardware', 'Reparación de componentes físicos dañados', 'presencial', true, '#e74c3c', 3),
('Cambio de Componentes', 'Reemplazo de partes específicas del equipo', 'presencial', true, '#f39c12', 4),
('Actualización en Sitio', 'Actualización de software/firmware en el lugar', 'presencial', true, '#9b59b6', 5),
('Diagnóstico Presencial', 'Diagnóstico técnico que requiere presencia física', 'presencial', false, '#1abc9c', 6),
('Capacitación en Sitio', 'Capacitación de usuarios en el lugar', 'presencial', false, '#34495e', 7)
ON CONFLICT DO NOTHING;

-- ============================================
-- DATOS DE EJEMPLO: SITUACIONES REMOTAS
-- ============================================

INSERT INTO situaciones_soporte (nombre, descripcion, tipo_soporte, requiere_materiales, color, orden) VALUES
('Soporte Remoto General', 'Asistencia remota para problemas generales', 'remoto', false, '#3498db', 1),
('Configuración de Software', 'Configuración remota de aplicaciones', 'remoto', false, '#9b59b6', 2),
('Actualización Remota', 'Actualización de software de forma remota', 'remoto', false, '#27ae60', 3),
('Diagnóstico Remoto', 'Análisis y diagnóstico a través de conexión remota', 'remoto', false, '#1abc9c', 4),
('Resolución de Errores', 'Solución de errores y problemas de software', 'remoto', false, '#e74c3c', 5),
('Consulta Técnica', 'Consulta o asesoramiento técnico remoto', 'remoto', false, '#f39c12', 6),
('Monitoreo y Supervisión', 'Monitoreo remoto de sistemas', 'remoto', false, '#34495e', 7)
ON CONFLICT DO NOTHING;

-- ============================================
-- MATERIALES EJEMPLO PARA INSTALACIÓN
-- ============================================

INSERT INTO checklist_materiales (situacion_id, nombre, descripcion, obligatorio, cantidad_sugerida, orden)
SELECT 
  s.id,
  'Notebook de Trabajo',
  'Laptop para configuración e instalación',
  true,
  1,
  1
FROM situaciones_soporte s WHERE s.nombre = 'Instalación de Equipo Nuevo'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_materiales (situacion_id, nombre, descripcion, obligatorio, cantidad_sugerida, orden)
SELECT 
  s.id,
  'Cables de Red',
  'Cables ethernet CAT5e o CAT6',
  true,
  2,
  2
FROM situaciones_soporte s WHERE s.nombre = 'Instalación de Equipo Nuevo'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_materiales (situacion_id, nombre, descripcion, obligatorio, cantidad_sugerida, orden)
SELECT 
  s.id,
  'Destornilladores',
  'Kit de destornilladores variados',
  true,
  1,
  3
FROM situaciones_soporte s WHERE s.nombre = 'Instalación de Equipo Nuevo'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_materiales (situacion_id, nombre, descripcion, obligatorio, cantidad_sugerida, orden)
SELECT 
  s.id,
  'USB Booteable',
  'USB con sistema operativo y drivers',
  false,
  1,
  4
FROM situaciones_soporte s WHERE s.nombre = 'Instalación de Equipo Nuevo'
ON CONFLICT DO NOTHING;

-- ============================================
-- MATERIALES EJEMPLO PARA MANTENIMIENTO
-- ============================================

INSERT INTO checklist_materiales (situacion_id, nombre, descripcion, obligatorio, cantidad_sugerida, orden)
SELECT 
  s.id,
  'Aire Comprimido',
  'Lata de aire comprimido para limpieza',
  true,
  1,
  1
FROM situaciones_soporte s WHERE s.nombre = 'Mantenimiento Preventivo'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_materiales (situacion_id, nombre, descripcion, obligatorio, cantidad_sugerida, orden)
SELECT 
  s.id,
  'Paños de Microfibra',
  'Paños para limpieza de pantallas y equipos',
  true,
  3,
  2
FROM situaciones_soporte s WHERE s.nombre = 'Mantenimiento Preventivo'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_materiales (situacion_id, nombre, descripcion, obligatorio, cantidad_sugerida, orden)
SELECT 
  s.id,
  'Pasta Térmica',
  'Pasta térmica para procesadores',
  false,
  1,
  3
FROM situaciones_soporte s WHERE s.nombre = 'Mantenimiento Preventivo'
ON CONFLICT DO NOTHING;

-- Verificar creación
SELECT 'Situaciones creadas:' as info, COUNT(*) as total FROM situaciones_soporte;
SELECT 'Materiales de checklist creados:' as info, COUNT(*) as total FROM checklist_materiales;

SELECT 
  s.nombre as situacion,
  s.tipo_soporte,
  s.requiere_materiales,
  COUNT(c.id) as total_materiales
FROM situaciones_soporte s
LEFT JOIN checklist_materiales c ON s.id = c.situacion_id
GROUP BY s.id, s.nombre, s.tipo_soporte, s.requiere_materiales
ORDER BY s.tipo_soporte, s.orden;
