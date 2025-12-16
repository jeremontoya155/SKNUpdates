-- Agregar índices para mejorar el rendimiento de las consultas del checklist
CREATE INDEX IF NOT EXISTS idx_ticket_checklist_ticket_material 
ON ticket_checklist_materiales(ticket_id, material_id);

CREATE INDEX IF NOT EXISTS idx_ticket_checklist_llevado 
ON ticket_checklist_materiales(ticket_id, llevado);

-- Comentarios para documentación
COMMENT ON INDEX idx_ticket_checklist_ticket_material IS 'Índice para búsquedas rápidas de materiales por ticket';
COMMENT ON INDEX idx_ticket_checklist_llevado IS 'Índice para verificar materiales marcados como llevados';
