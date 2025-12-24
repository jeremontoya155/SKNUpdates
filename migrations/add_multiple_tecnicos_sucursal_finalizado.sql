-- Agregar columna sucursal_id a tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sucursal_id INTEGER REFERENCES sucursales(id);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_sucursal ON tickets(sucursal_id);

-- Comentario
COMMENT ON COLUMN tickets.sucursal_id IS 'Sucursal desde donde se registra la tarea/ticket';

-- Crear tabla para asignar múltiples técnicos a un ticket
CREATE TABLE IF NOT EXISTS tickets_tecnicos (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  asignado_por INTEGER REFERENCES usuarios(id),
  activo BOOLEAN DEFAULT true,
  UNIQUE(ticket_id, usuario_id) -- Evitar duplicados
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_tecnicos_ticket ON tickets_tecnicos(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tecnicos_usuario ON tickets_tecnicos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tecnicos_activo ON tickets_tecnicos(activo);

-- Comentarios
COMMENT ON TABLE tickets_tecnicos IS 'Asignación múltiple de técnicos a tickets';
COMMENT ON COLUMN tickets_tecnicos.asignado_por IS 'Usuario que realizó la asignación';
COMMENT ON COLUMN tickets_tecnicos.activo IS 'Permite desactivar una asignación sin eliminarla';

-- Migrar datos existentes de usuario_asignado a tickets_tecnicos
INSERT INTO tickets_tecnicos (ticket_id, usuario_id, fecha_asignacion)
SELECT id, usuario_asignado, fecha_creacion 
FROM tickets 
WHERE usuario_asignado IS NOT NULL
ON CONFLICT (ticket_id, usuario_id) DO NOTHING;

-- Crear vista para facilitar consultas
CREATE OR REPLACE VIEW vista_tickets_tecnicos AS
SELECT 
  t.id as ticket_id,
  t.titulo,
  t.estado,
  t.prioridad,
  t.empresa_id,
  e.nombre as empresa_nombre,
  s.nombre as sucursal_nombre,
  s.direccion as sucursal_direccion,
  s.ciudad as sucursal_ciudad,
  s.provincia as sucursal_provincia,
  tt.usuario_id as tecnico_id,
  u.nombre as tecnico_nombre,
  tt.fecha_asignacion,
  tt.activo as asignacion_activa
FROM tickets t
LEFT JOIN empresas e ON t.empresa_id = e.id
LEFT JOIN sucursales s ON t.sucursal_id = s.id
LEFT JOIN tickets_tecnicos tt ON t.id = tt.ticket_id AND tt.activo = true
LEFT JOIN usuarios u ON tt.usuario_id = u.id;

COMMENT ON VIEW vista_tickets_tecnicos IS 'Vista combinada de tickets con sus técnicos asignados y sucursales';
