-- Script para verificar la zona horaria de Argentina en PostgreSQL
-- Ejecutar este script para confirmar la configuración

-- 1. Mostrar zona horaria actual de la sesión
SHOW timezone;

-- 2. Ver la hora actual en UTC y en Argentina
SELECT 
  NOW() AS hora_utc,
  TIMEZONE('America/Argentina/Buenos_Aires', NOW()) AS hora_argentina,
  TIMEZONE('America/Argentina/Buenos_Aires', NOW()) - NOW() AS diferencia;

-- 3. Ver formato de hora de Argentina
SELECT 
  TO_CHAR(TIMEZONE('America/Argentina/Buenos_Aires', NOW()), 'DD/MM/YYYY HH24:MI:SS') AS hora_argentina_formateada;

-- 4. Si quieres cambiar la zona horaria de toda la sesión (opcional):
-- SET timezone = 'America/Argentina/Buenos_Aires';

-- 5. Verificar tickets con hora de inicio/fin
SELECT 
  id,
  titulo,
  hora_inicio,
  hora_fin,
  TO_CHAR(hora_inicio, 'DD/MM/YYYY HH24:MI:SS') AS inicio_formateado,
  TO_CHAR(hora_fin, 'DD/MM/YYYY HH24:MI:SS') AS fin_formateado,
  duracion_minutos
FROM tickets
WHERE hora_inicio IS NOT NULL
ORDER BY hora_inicio DESC
LIMIT 10;
