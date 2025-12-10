-- Agregar tipo de soporte a tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS tipo_soporte VARCHAR(20) DEFAULT 'remoto' CHECK (tipo_soporte IN ('remoto', 'fisico'));

-- Agregar tipo de imagen (inicial, antes, durante, despues)
ALTER TABLE tickets_imagenes 
ADD COLUMN IF NOT EXISTS tipo_imagen VARCHAR(20) DEFAULT 'general' CHECK (tipo_imagen IN ('inicial', 'antes', 'durante', 'despues', 'general'));

-- Comentarios
COMMENT ON COLUMN tickets.tipo_soporte IS 'Tipo de soporte: remoto o fisico';
COMMENT ON COLUMN tickets_imagenes.tipo_imagen IS 'Tipo de imagen: inicial (al crear ticket), antes/durante/despues (soporte fisico), general';
