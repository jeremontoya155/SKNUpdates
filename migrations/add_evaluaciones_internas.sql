-- Crear tabla de evaluaciones internas (solo para admin SKN)
CREATE TABLE IF NOT EXISTS evaluaciones_internas (
  id SERIAL PRIMARY KEY,
  usuario_evaluado_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  evaluador_id INTEGER NOT NULL REFERENCES usuarios(id), -- Siempre será admin SKN
  
  -- Información de la evaluación
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) DEFAULT 'general', -- general, desempeño, actitud, puntualidad, etc.
  
  -- Puntajes (de 1 a 10)
  puntaje_desempeno INTEGER CHECK (puntaje_desempeno >= 1 AND puntaje_desempeno <= 10),
  puntaje_actitud INTEGER CHECK (puntaje_actitud >= 1 AND puntaje_actitud <= 10),
  puntaje_puntualidad INTEGER CHECK (puntaje_puntualidad >= 1 AND puntaje_puntualidad <= 10),
  puntaje_trabajo_equipo INTEGER CHECK (puntaje_trabajo_equipo >= 1 AND puntaje_trabajo_equipo <= 10),
  puntaje_general INTEGER CHECK (puntaje_general >= 1 AND puntaje_general <= 10),
  
  -- Notas confidenciales
  notas_confidenciales TEXT, -- Notas que solo el admin puede ver
  contraseñas_accesos TEXT, -- Contraseñas u otros datos sensibles
  
  -- Imágenes/Evidencias
  imagenes TEXT[], -- Array de URLs de imágenes (capturas, evidencias)
  
  -- Estado y decisiones
  recomendacion VARCHAR(50), -- 'premio', 'aumento', 'advertencia', 'capacitacion', 'despido'
  monto_sugerido DECIMAL(10, 2), -- Monto sugerido para premio/aumento
  aprobado_para_premio BOOLEAN DEFAULT false,
  
  -- Período de evaluación
  periodo_inicio DATE,
  periodo_fin DATE,
  
  -- Metadata
  es_confidencial BOOLEAN DEFAULT true, -- Siempre true, pero por si acaso
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_evaluaciones_usuario_evaluado ON evaluaciones_internas(usuario_evaluado_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_evaluador ON evaluaciones_internas(evaluador_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_tipo ON evaluaciones_internas(tipo);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_recomendacion ON evaluaciones_internas(recomendacion);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_periodo ON evaluaciones_internas(periodo_inicio, periodo_fin);

-- Comentarios
COMMENT ON TABLE evaluaciones_internas IS 'Evaluaciones internas confidenciales - SOLO para admin SKN';
COMMENT ON COLUMN evaluaciones_internas.usuario_evaluado_id IS 'Usuario siendo evaluado';
COMMENT ON COLUMN evaluaciones_internas.evaluador_id IS 'Admin SKN que realiza la evaluación';
COMMENT ON COLUMN evaluaciones_internas.contraseñas_accesos IS 'Contraseñas y datos sensibles del empleado';
COMMENT ON COLUMN evaluaciones_internas.imagenes IS 'Array de URLs de evidencias/capturas';
COMMENT ON COLUMN evaluaciones_internas.recomendacion IS 'Decisión: premio, aumento, advertencia, capacitacion, despido';
COMMENT ON COLUMN evaluaciones_internas.aprobado_para_premio IS 'Si fue aprobado para recibir premio a fin de año';
