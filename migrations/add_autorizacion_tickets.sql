-- Agregar campo para autorización de cierre por subadmin
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS requiere_autorizacion BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS autorizado_por INTEGER REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS fecha_autorizacion TIMESTAMP,
ADD COLUMN IF NOT EXISTS estado_autorizacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_autorizacion IN ('pendiente', 'aprobado', 'rechazado'));

-- Índice para búsquedas de tickets pendientes de autorización
CREATE INDEX IF NOT EXISTS idx_tickets_autorizacion ON tickets(estado_autorizacion) WHERE requiere_autorizacion = TRUE;

-- Comentarios
COMMENT ON COLUMN tickets.requiere_autorizacion IS 'Si el ticket requiere autorización de subadmin para cerrarse';
COMMENT ON COLUMN tickets.autorizado_por IS 'Usuario subadmin que autorizó el cierre';
COMMENT ON COLUMN tickets.fecha_autorizacion IS 'Fecha y hora de la autorización';
COMMENT ON COLUMN tickets.estado_autorizacion IS 'Estado de la autorización: pendiente, aprobado, rechazado';
