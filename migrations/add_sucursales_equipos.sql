-- ============================================
-- AGREGAR SUCURSALES BASADAS EN EXCEL DE EQUIPOS
-- IDs reales: Donadio=9, ADLS=13, Corsider=12, Sanchez Antoniolli=6
-- ============================================

-- Sucursales de DONADIO (empresa_id = 9)
INSERT INTO sucursales (empresa_id, nombre, direccion, telefono, activo) VALUES
(9, 'Logística', 'Sector Logística', NULL, true),
(9, 'Ventas', 'Sector Ventas', NULL, true),
(9, 'Impuestos', 'Sector Impuestos', NULL, true),
(9, 'Tesorería', 'Sector Tesorería', NULL, true),
(9, 'Créditos', 'Sector Créditos', NULL, true),
(9, 'Supervisión Ventas', 'Sector Supervisión de Ventas', NULL, true),
(9, 'Caja', 'Sector Caja', NULL, true),
(9, 'RRHH', 'Recursos Humanos', NULL, true),
(9, 'Planta', 'Planta de Producción', NULL, true),
(9, 'Garita', 'Garita de Seguridad', NULL, true)
ON CONFLICT DO NOTHING;

-- Sucursales de ARMA DE LAS SIERRAS / ADLS (empresa_id = 13)
INSERT INTO sucursales (empresa_id, nombre, direccion, telefono, activo) VALUES
(13, 'Oficina Técnica', 'Oficina Técnica ADLS', NULL, true),
(13, 'Mantenimiento', 'Sector Mantenimiento', NULL, true),
(13, 'Acindar Fondo', 'Depósito Acindar Fondo', NULL, true)
ON CONFLICT DO NOTHING;

-- Sucursales de CORSIDER (empresa_id = 12)
-- Incluye: Corsider R20, Corsider Argandoña, Pringles, Arias
INSERT INTO sucursales (empresa_id, nombre, direccion, telefono, activo) VALUES
(12, 'Sucursal R20 - Ventas', 'Sucursal R20 - Sector Ventas', NULL, true),
(12, 'Sucursal R20 - Atrás PB', 'Sucursal R20 - Planta Baja Posterior', NULL, true),
(12, 'Sucursal R20 - Venta Directa', 'Sucursal R20 - Venta Directa', NULL, true),
(12, 'Sucursal R20 - Compras', 'Sucursal R20 - Sector Compras', NULL, true),
(12, 'Sucursal R20 - Mostrador PB', 'Sucursal R20 - Mostrador Planta Baja', NULL, true),
(12, 'Sucursal R20 - Sistemas Construcción', 'Sucursal R20 - Sistemas de Construcción', NULL, true),
(12, 'Sucursal R20 - Pasillo', 'Sucursal R20 - Pasillo', NULL, true),
(12, 'Sucursal R20 - Gestión Ventas', 'Sucursal R20 - Gestión de Ventas', NULL, true),
(12, 'Sucursal Argandoña - Mostrador', 'Sucursal Argandoña - Mostrador', NULL, true),
(12, 'Sucursal Argandoña - Despacho', 'Sucursal Argandoña - Despacho', NULL, true),
(12, 'Sucursal Argandoña - Caja', 'Sucursal Argandoña - Caja', NULL, true),
(12, 'Sucursal Pringles - Mostrador', 'Sucursal Pringles - Mostrador', NULL, true),
(12, 'Sucursal Pringles - Caja', 'Sucursal Pringles - Caja', NULL, true),
(12, 'Sucursal Arias - Mostrador', 'Sucursal Arias - Mostrador', NULL, true),
(12, 'Sucursal Arias - Caja', 'Sucursal Arias - Caja', NULL, true)
ON CONFLICT DO NOTHING;

-- Verificar sucursales creadas
SELECT e.nombre as empresa, s.nombre as sucursal, s.direccion
FROM sucursales s
JOIN empresas e ON s.empresa_id = e.id
ORDER BY e.nombre, s.nombre;
