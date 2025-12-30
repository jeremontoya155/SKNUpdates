-- Tabla para almacenar tokens de notificaciones push de Expo
-- Fecha: 2025-12-30

CREATE TABLE IF NOT EXISTS push_tokens (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  platform VARCHAR(20) CHECK (platform IN ('android', 'ios', 'web')),
  activo BOOLEAN DEFAULT true,
  fecha_registro TIMESTAMP DEFAULT TIMEZONE('America/Argentina/Buenos_Aires', NOW()),
  fecha_actualizacion TIMESTAMP DEFAULT TIMEZONE('America/Argentina/Buenos_Aires', NOW()),
  UNIQUE (usuario_id, token)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_push_tokens_usuario ON push_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_activo ON push_tokens(activo);

-- Comentarios
COMMENT ON TABLE push_tokens IS 'Tokens de notificaciones push de Expo para usuarios móviles';
COMMENT ON COLUMN push_tokens.usuario_id IS 'ID del usuario (técnico)';
COMMENT ON COLUMN push_tokens.token IS 'Token de Expo Push Notifications';
COMMENT ON COLUMN push_tokens.platform IS 'Plataforma del dispositivo (android/ios/web)';
COMMENT ON COLUMN push_tokens.activo IS 'Si el token está activo o fue revocado';
