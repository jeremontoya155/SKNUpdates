-- ============================================
-- INSERTAR EQUIPOS DESDE EXCEL
-- ============================================

-- 1. Crear categoría Celulares si no existe
INSERT INTO categorias_materiales (nombre, descripcion, activo)
VALUES ('Celulares', 'Teléfonos móviles y smartphones', true)
ON CONFLICT DO NOTHING;

-- 2. Obtener IDs de categorías
-- PC de Escritorio = 1
-- Notebooks = 2
-- Celulares = (nueva)

-- 3. Mapeo de sucursales (según ver-sucursales-equipos.js):
-- Donadio (empresa_id=9):
--   Logística = 115, Ventas = 116, Impuestos = 117, Tesorería = 118
--   Créditos = 119, Supervisión Ventas = 120, Caja = 121, RRHH = 122
--   Planta = 123, Garita = 124

-- ADLS (empresa_id=13):
--   Oficina Técnica = 125, Mantenimiento = 126, Acindar Fondo = 127

-- Corsider (empresa_id=12):
--   R20 - Ventas = 128, R20 - Atrás PB = 129, R20 - Venta Directa = 130
--   R20 - Compras = 131, R20 - Mostrador PB = 132, R20 - Sistemas Construcción = 133
--   R20 - Pasillo = 134, R20 - Gestión Ventas = 135
--   Argandoña - Mostrador = 136, Argandoña - Despacho = 137, Argandoña - Caja = 138
--   Pringles - Mostrador = 139, Pringles - Caja = 140
--   Arias - Mostrador = 141, Arias - Caja = 142

-- ============================================
-- EQUIPOS DE DONADIO
-- ============================================

-- Logística (sucursal_id=115)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 115, 1, 'PC Gabriel Wanchope', NULL, NULL, 'i3 6100, 4GB RAM, SSD 240GB, ZORIN, Anydesk: 973834754', 'PC-DON-LOG-001', 1, 1, true),
(9, 115, 2, 'Notebook Logística', NULL, NULL, 'Intel i3-1115G4, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 124574017, Ex Federico Demicheli', 'NB-DON-LOG-001', 1, 1, true),
(9, 115, 1, 'PC Facturación 2 - Mozzoni', NULL, NULL, 'i3 10100, 8GB RAM, SSD 240GB, ZORIN OS 16.3, Anydesk: 1858272989', 'PC-DON-LOG-002', 1, 1, true),
(9, 115, 1, 'PC Facturación 1', NULL, NULL, 'i3-6100, 4GB RAM, 240GB, ZORIN, Anydesk: 1716019665', 'PC-DON-LOG-003', 1, 1, true),
(9, 115, 1, 'PC Balanza', 'Asus', 'P5G41-M LX', 'Intel Core Duo E7500, 4GB DDR2, SSD 120GB, W10 Pro, Anydesk: 148187157', 'PC-DON-LOG-004', 1, 1, true),
(9, 115, 1, 'PC Fernando Curletto', NULL, NULL, 'Intel Core i3-4170, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1765934752', 'PC-DON-LOG-005', 1, 1, true),
(9, 115, 2, 'Notebook Luis Franco - GERENCIA', 'Lenovo', '81HN', 'S/N: R90V6TLF, i3-7020U, 4GB RAM, Kingston SA4 240GB, W10 Pro, Anydesk: 1869543530', 'NB-DON-LOG-006', 1, 1, true),
(9, 115, 1, 'PC Impresiones', NULL, NULL, 'Intel Core Duo E7500, 4GB RAM, W7', 'PC-DON-LOG-007', 1, 1, true);

-- Ventas (sucursal_id=116)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 116, 1, 'PC Florencia Signorelli', NULL, NULL, 'Intel Core i3-7100, 4GB+8GB DDR4, W10 Pro, Anydesk: 360182747', 'PC-DON-VEN-001', 1, 1, true),
(9, 116, 1, 'PC Florencia Lopez - VENTAS01', NULL, NULL, 'i5-1135, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1675221710, User GP: VDirectaJD', 'PC-DON-VEN-002', 1, 1, true),
(9, 116, 1, 'PC Valentina Torasso - ventas07', 'Gigabyte', 'H110M-H', 'i3 7100, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1522212332', 'PC-DON-VEN-003', 1, 1, true),
(9, 116, 2, 'Notebook Emmanuel Matyjaszczyk', 'Lenovo', 'V15G1', 'S/N: PF36ZXK6, Intel i3-10110U, 8GB RAM, 240GB, W10 Pro, Anydesk: 579370792, User GP: MAndreani', 'NB-DON-VEN-001', 1, 1, true),
(9, 116, 2, 'Notebook Julian Pereyra - VENTAS-Z7', 'Asus', 'X515EA', 'S/N: S3N0GP000046128, Anydesk: 1505517682, User GP: VZona7', 'NB-DON-VEN-002', 1, 1, true);

-- Impuestos (sucursal_id=117)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 117, 2, 'Notebook Lucia Carraro - CONTABLE2', 'HP', '250 G7', 'S/N: CND9332B7X, Intel Core i3-7020U, 8GB RAM, SSD 480GB, W10 Pro, Anydesk: 855686001', 'NB-DON-IMP-001', 1, 1, true);

-- Tesorería (sucursal_id=118)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 118, 2, 'Notebook Veronica Campetella - CAJA1', 'Asus', 'X515EA', 'S/N: R5N0GP00066020F, Intel i5-1135G7, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1194363517', 'NB-DON-TES-001', 1, 1, true),
(9, 118, 1, 'PC Veronica Campetella - PCBancos', NULL, NULL, 'Intel i5-11400, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1950220931', 'PC-DON-TES-001', 1, 1, true),
(9, 118, 1, 'PC Maricel Farias - ADMCORPO1', 'Micro-Star', 'MS-7C89', 'Intel Core i3-10100, 12GB RAM, SSD 240GB, W10 Pro, Anydesk: 1111433241', 'PC-DON-TES-002', 1, 1, true);

-- Créditos (sucursal_id=119)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 119, 2, 'Notebook Jorge Sayavedra - PC-CREDITO', 'Lenovo', '80SY', 'S/N: LR09GEBV, Intel Core i5-6200U, 8GB DDR4, 120GB, W10 Pro, Anydesk: 1801349122', 'NB-DON-CRE-001', 1, 1, true);

-- Supervisión Ventas (sucursal_id=120)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 120, 2, 'Notebook Leonela Cabral - CORSIDER-LCABRAL', 'Lenovo', '82KU', 'S/N: PF3KZW6Z, AMD Ryzen 3 5300U, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1834161828, OBS: Bisagra izquierda floja', 'NB-DON-SUP-001', 1, 1, true);

-- Caja (sucursal_id=121)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 121, 1, 'PC PCCAJA', NULL, NULL, 'Intel i3-7100, 8GB RAM, W10 Pro, Anydesk: 547001289, User GP: SMignacca', 'PC-DON-CAJ-001', 1, 1, true);

-- RRHH (sucursal_id=122)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 122, 1, 'PC Alberto Escudero - RRHHAECorpo', 'Micro-Star International', 'MS-7C89', 'Intel i3-10100, 8GB RAM, 240GB, W10 Pro, Anydesk: 1305995620', 'PC-DON-RRH-001', 1, 1, true),
(9, 122, 2, 'Notebook Alejandro Pereyra - NTBK-NOEDONADIO', 'Lenovo', '82QC', 'S/N: PF41PEJ0, Intel i3-1215U, 4GB RAM, SSD 120GB, W10 Pro, Anydesk: 1046149249', 'NB-DON-RRH-001', 1, 1, true);

-- Planta (sucursal_id=123)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 123, 1, 'PC Cortadora 1', NULL, NULL, 'Intel Celeron J1900, 4GB RAM, W10 Pro, Anydesk: 1800389369', 'PC-DON-PLA-001', 1, 1, true),
(9, 123, 1, 'PC Patio 2', NULL, NULL, 'Pentium E5400, 4GB RAM, W7 Professional, Anydesk: 833456636', 'PC-DON-PLA-002', 1, 1, true);

-- Garita (sucursal_id=124)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 124, 1, 'PC PATIO SOGEFI', NULL, 'H81M-H', 'Pentium G3250, 4GB RAM, 120GB, W10 Pro, Anydesk: 1910967788', 'PC-DON-GAR-001', 1, 1, true);

-- ============================================
-- EQUIPOS DE ADLS (Arma de las Sierras)
-- ============================================

-- Oficina Técnica (sucursal_id=125)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(13, 125, 1, 'PC Yamila Lafuente - OFTEC1', 'MSI', 'MS-7A15', 'Intel Core i3-7100, 12GB DDR4, SSD 240GB, W10 Pro, Anydesk: 1685987866', 'PC-ADLS-OFT-001', 1, 1, true),
(13, 125, 2, 'Notebook Santiago Bortayro - NTBK-SBORTAYRO', 'Lenovo', 'V15 G2 ITL', 'S/N: PF3NEJMB, Intel i5-1135G7, 16GB RAM, SSD 240GB, W10 Pro, Anydesk: 1581250373', 'NB-ADLS-OFT-001', 1, 1, true),
(13, 125, 2, 'Notebook Sebastian Nobile - ARM-NTBK2', 'Acer', 'Aspire A315-56', 'S/N: NXHS5EM00J01807B4B3400, Intel i3-1005G1, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1940593125, OBS: Ambas bisagras rotas con soporte de metal', 'NB-ADLS-OFT-002', 1, 1, true),
(13, 125, 2, 'Notebook Alejandra Cañete - ARM-NTBK1', 'HP', '15-da2xxx', 'S/N: CND0288BDJ, Intel i5-10210U, 8GB RAM, WDC 480GB, W10 Pro, Anydesk: 1243349798', 'NB-ADLS-OFT-003', 1, 1, true),
(13, 125, 2, 'Notebook Francisco Martinez - ADLS-Tecnica-FM', 'Asus', 'X515EA', 'S/N: R5N0GP00050921E, Intel i3 1115G4, 8GB RAM, W10 Pro, TeamViewer: 1948039401', 'NB-ADLS-OFT-004', 1, 1, true);

-- Mantenimiento (sucursal_id=126)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(13, 126, 1, 'PC Mantenimiento - Pañol', NULL, NULL, 'Intel i3-3250, 4GB RAM, SSD 120GB, W10 Pro, Anydesk: 1923100447', 'PC-ADLS-MAN-001', 1, 1, true);

-- Acindar Fondo (sucursal_id=127)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(13, 127, 1, 'PC AC20094', NULL, NULL, 'Intel i5 12500, 8GB RAM, W10 Pro', 'PC-ADLS-ACI-001', 1, 1, true);

-- Continúa en siguiente archivo...
