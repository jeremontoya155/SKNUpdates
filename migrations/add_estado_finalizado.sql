-- Modificar el tipo ENUM de estado para incluir 'finalizado'
-- Primero verificar el tipo actual
DO $$
BEGIN
    -- Agregar el nuevo estado 'finalizado' al ENUM si no existe
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'estado_ticket' AND e.enumlabel = 'finalizado'
    ) THEN
        -- Verificar si el tipo ENUM existe
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_ticket') THEN
            ALTER TYPE estado_ticket ADD VALUE 'finalizado';
        ELSE
            -- Si no existe el tipo, crearlo con todos los valores
            CREATE TYPE estado_ticket AS ENUM ('abierto', 'en_proceso', 'cerrado', 'finalizado');
        END IF;
    END IF;
END
$$;

-- Si la columna estado es VARCHAR, no hay problema. Si es ENUM, asegurarse de que acepta 'finalizado'
-- La mayoría de las implementaciones usan VARCHAR, pero por si acaso:

-- Agregar columna para rastrear quién finalizó el ticket
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS finalizado_por INTEGER REFERENCES usuarios(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_finalizacion TIMESTAMP;

-- Índice para búsquedas de tickets finalizados
CREATE INDEX IF NOT EXISTS idx_tickets_estado_finalizado ON tickets(estado) WHERE estado = 'finalizado';

-- Comentarios
COMMENT ON COLUMN tickets.finalizado_por IS 'Usuario que marcó el ticket como finalizado (solo subadmin Belen)';
COMMENT ON COLUMN tickets.fecha_finalizacion IS 'Fecha y hora en que se finalizó el ticket';

-- Crear tabla de log para auditoría de cambios de estado
CREATE TABLE IF NOT EXISTS tickets_historial_estado (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT
);

-- Índices para historial
CREATE INDEX IF NOT EXISTS idx_historial_ticket ON tickets_historial_estado(ticket_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON tickets_historial_estado(fecha_cambio);

COMMENT ON TABLE tickets_historial_estado IS 'Historial de cambios de estado de tickets para auditoría';

-- Crear función para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION registrar_cambio_estado_ticket()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO tickets_historial_estado (ticket_id, estado_anterior, estado_nuevo)
        VALUES (NEW.id, OLD.estado, NEW.estado);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para registrar cambios de estado
DROP TRIGGER IF EXISTS trigger_cambio_estado_ticket ON tickets;
CREATE TRIGGER trigger_cambio_estado_ticket
    AFTER UPDATE ON tickets
    FOR EACH ROW
    WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
    EXECUTE FUNCTION registrar_cambio_estado_ticket();

COMMENT ON FUNCTION registrar_cambio_estado_ticket IS 'Función que registra automáticamente los cambios de estado en tickets';
