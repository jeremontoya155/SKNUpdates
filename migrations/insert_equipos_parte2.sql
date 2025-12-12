-- ============================================
-- EQUIPOS DE CORSIDER - PARTE 2
-- ============================================

-- R20 - Ventas (sucursal_id=128)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 128, 2, 'Notebook Florencia Canelo - NTBK-VENDE2', 'Asus', 'X515EA', 'S/N: R5N0GP00006323E, 11th Gen Intel Core i3-1115G4, 8GB RAM, W11 Pro, Anydesk: 1435118551', 'NB-COR-R20VEN-001', 1, 1, true);

-- R20 - Atrás PB (sucursal_id=129)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 129, 1, 'PC Marcos - Mostrador2', NULL, NULL, 'Intel Core i3-7100, 8GB DDR4, SSD 240GB, W10 Pro, Anydesk: 1468732470', 'PC-COR-R20ATR-001', 1, 1, true);

-- R20 - Venta Directa (sucursal_id=130)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 130, 2, 'Notebook Cinthya Brizuela - VTADIRECTA', 'Lenovo', '80SY', 'S/N: LR09FRMR, i5 6200, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1986023373, User GP: NSerrone, OBS: Golpes en bisagras - carcasa rota en bisagra derecha', 'NB-COR-R20VD-001', 1, 1, true),
(12, 130, 1, 'PC Cynthia Brizuela - CORSIDER-VTADCTA', NULL, NULL, 'i5 1035, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1986336186', 'PC-COR-R20VD-001', 1, 1, true);

-- R20 - Compras (sucursal_id=131)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 131, 2, 'Notebook Silvia Casco - CORSIDER-COMP', 'DELL', 'Latitude 3520', 'S/N: 8YVYNG3, i5 1135, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1368845948, User GP: corsider, OBS: Rota de bisagras (derecha más que izquierda)', 'NB-COR-R20COM-001', 1, 1, true),
(12, 131, 1, 'PC Usuario - ServicioPC', NULL, NULL, 'Intel Pentium G630T, 2GB+4GB DDR3, SSD 240GB, W10 Pro, Anydesk: 1237507425, User GP: Compras1', 'PC-COR-R20COM-001', 1, 1, true);

-- R20 - Mostrador PB (sucursal_id=132)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 132, 1, 'PC Sebastian Eier - Fiscal', NULL, NULL, 'i3-7100, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 335072704', 'PC-COR-R20MOS-001', 1, 1, true),
(12, 132, 1, 'PC Joaquin Conde - Mostrador3', NULL, NULL, 'i3-2120, 4GB+4GB DDR4, SSD 120GB, W10 Pro, Anydesk: 303284658', 'PC-COR-R20MOS-002', 1, 1, true);

-- R20 - Sistemas Construcción (sucursal_id=133)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 133, 1, 'PC Dayana Giraudo - MOSTRADOR1-SC', NULL, NULL, 'i3-10100, 8GB RAM, W10 Pro, Anydesk: 1438358401', 'PC-COR-R20SC-001', 1, 1, true),
(12, 133, 2, 'Notebook Francisco Pereyra - NTBK-CSD-100', 'Bangho', 'MAX L5', 'S/N: AR020001681735, Intel i3-1215U, 8GB RAM, SSD 240GB, W11 Pro, TeamViewer: 637790384, User GP: Francisco Pereyra', 'NB-COR-R20SC-001', 1, 1, true),
(12, 133, 2, 'Notebook Alejandro Medina - EXNTBK-SBORTAYRO', NULL, NULL, 'Intel Core i5-6200U, 12GB RAM, W10 Pro, Anydesk: 1962701899', 'NB-COR-R20SC-002', 1, 1, true);

-- R20 - Pasillo (sucursal_id=134)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 134, 1, 'PC Operaciones SC - OPERACIONES-SC', NULL, NULL, 'i3-10100, 8GB RAM, SSD 240GB, W10 Pro, TeamViewer: 541912425, User GP: MostradorSCR203', 'PC-COR-R20PAS-001', 1, 1, true);

-- R20 - Gestión Ventas (sucursal_id=135)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 135, 2, 'Notebook Paola Bustos - NTBK-CSDRESP', 'Asus', 'X515EA', 'S/N: N2N0GP000868099, Intel i5-1135G7, 8GB RAM, NVMe WDC 256GB, W10 Pro, Anydesk: 412613017', 'NB-COR-R20GV-001', 1, 1, true);

-- Argandoña - Mostrador (sucursal_id=136)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 136, 1, 'PC Franco Turri - Ventas2', NULL, NULL, 'i3 7100, 4GB+8GB, HDD 1TB, W10 Pro, Anydesk: 198027594', 'PC-COR-ARGMOS-001', 1, 1, true),
(12, 136, 1, 'PC MostradorARG - Ventas3', NULL, NULL, 'i3 7100, 4GB+8GB, SSD 240GB, Asus H110M-D, W10 Pro, Anydesk: 1782617622, User GP: MostradorARG2', 'PC-COR-ARGMOS-002', 1, 1, true),
(12, 136, 2, 'Notebook Franco Turri', 'Lenovo', 'V15-IIL', 'S/N: PF31QFZH', 'NB-COR-ARGMOS-001', 1, 1, true);

-- Argandoña - Despacho (sucursal_id=137)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 137, 1, 'PC CorARGDespacho', NULL, NULL, 'i3 12100, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1836249861', 'PC-COR-ARGDES-001', 1, 1, true);

-- Argandoña - Caja (sucursal_id=138)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 138, 1, 'PC Ventas - Caja', NULL, NULL, 'i3 10100, 4GB+4GB, SSD 240GB, W10 Pro, Anydesk: 1832173552', 'PC-COR-ARGCAJ-001', 1, 1, true);

-- Pringles - Mostrador (sucursal_id=139)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 139, 1, 'PC VentasJose', NULL, NULL, 'Intel Pentium Gold G6405, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1027857513, User GP: MostradorCYP', 'PC-COR-PRIMOS-001', 1, 1, true);

-- Pringles - Caja (sucursal_id=140)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 140, 1, 'PC DIEGOVENTAS011', NULL, NULL, 'AMD A4-4000, 4GB RAM, HDD 500GB, W10 Pro, Anydesk: 669510467, User GP: Mostrador2CYP', 'PC-COR-PRICAJ-001', 1, 1, true);

-- Arias - Mostrador (sucursal_id=141)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 141, 1, 'PC3 - DESKTOP-NCB1TLD', 'MSI', 'MS-7721', 'AMD Radeon R5 (A6-7480), 4GB RAM, 120GB, W10 Pro, Anydesk: 894808581', 'PC-COR-ARIAMOS-001', 1, 1, true);

-- Arias - Caja (sucursal_id=142)
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 142, 1, 'PC Caja Arias', NULL, NULL, 'Anydesk: 1028367904', 'PC-COR-ARIACAJ-001', 1, 1, true);

-- ============================================
-- Notebooks sin ubicación específica (Casa Central Donadio)
-- ============================================
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(9, 36, 2, 'Notebook Agustin Rios - NTBK-IMP4-AR', 'HP', NULL, 'S/N: 5CD207FTPC, Intel i3-7020U, 8GB RAM, SSD 240GB, W11 Pro, Anydesk: 1695135328', 'NB-DON-001', 1, 1, true),
(9, 36, 2, 'Notebook Pablo Ramirez - NTBK-CREDITOS1', 'Dell', NULL, 'Intel i5-6200U, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1567789408, User GP: PRamirez', 'NB-DON-002', 1, 1, true),
(9, 36, 2, 'Notebook Facundo Ramos - DESKTOP-MF0T4P0', 'HP', '15bs0xx', 'S/N: CND7253DY7, Intel i3-6006U, 8GB RAM, SSD 120GB, W10 Pro, Anydesk: 1059488938', 'NB-DON-003', 1, 1, true),
(9, 36, 2, 'Notebook Eberdhart German', 'Dell', 'Inspiron 15 3511', 'S/N: 4PND7K3, i5-1135G7, 8GB RAM, SSD 240GB, W11 Pro', 'NB-DON-004', 1, 1, true),
(9, 36, 2, 'Notebook Cristian Marto - CMARTO-NTBK', 'HP', '15-Gw0004la', 'S/N: CND1190CYX, AMD Athlon Silver 3050U, 8GB RAM, 240GB, W10 Pro, Anydesk: 1616851997, User GP: CMarto, OBS: Marco pantalla roto sup derecha', 'NB-DON-005', 1, 1, true),
(9, 36, 2, 'Notebook Debora Molina - Mostrador5', 'Acer', 'Aspire A315-56', 'S/N: NXHS5EM00J018075E53400, Intel i3-1005G1, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 499752493', 'NB-DON-006', 1, 1, true),
(9, 36, 2, 'Notebook Camila Mena - DESKTOP-808E3OI', 'Asus', 'X515EA', 'S/N: R5N0GP000175219, Intel i3-1115G4, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 1872540630', 'NB-DON-007', 1, 1, true),
(9, 36, 2, 'Notebook Nicolas Fornaciari - NTBK-NFORNACIARI', 'Asus', 'Inspiron 15 3000', 'S/N: 3X4HHK3, i3 1115, 8GB RAM, Anydesk: 966178626, User GP: NFornaciari, OBS: Golpe esquina superior derecha', 'NB-DON-008', 1, 1, true),
(9, 36, 2, 'Notebook Marcos Oyola - DESKTOP-DR3OUIA', 'Asus', 'X515EA', 'S/N: R5N0GP000753207, i5 1135, 8GB RAM, SSD 240GB, Anydesk: 1310401066, User GP: MOyola, OBS: Rota en bisagras', 'NB-DON-009', 1, 1, true),
(9, 36, 2, 'Notebook Lucas Bogdanov - TESORERIA', 'Dell', 'Inspiron 15 3511', 'S/N: BSDM7K3, Intel i5-1135G7, 8GB RAM, KBG NVMe KIOXIA 256GB, W10 Pro, Anydesk: 750180143', 'NB-DON-010', 1, 1, true),
(9, 36, 2, 'Notebook Ariel Gatti - ARIEL-NB', 'HP', 'Pavilion 15', 'S/N: 5CD204BDPC, AMD Ryzen 7 4700U, 8GB RAM, SSD 512GB, W11 Pro, TeamViewer: 1074780067', 'NB-DON-011', 1, 1, true),
(9, 36, 2, 'Notebook Noelia Donadio', 'Asus', 'X515EA', 'S/N: R3N0GP000831115, i5-1135G7, 8GB RAM, 240GB, W11 Pro', 'NB-DON-012', 1, 1, true),
(9, 36, 2, 'Notebook Juan Toledo', 'HP', '250 G7', 'S/N: CND92744NS, i3-7020U, 8GB RAM', 'NB-DON-013', 1, 1, true),
(9, 36, 2, 'Notebook Marcelo Bono - DESKTOP-MBONO', NULL, NULL, 'Intel i7-1065G7, 12GB RAM, W11 Pro, Anydesk: 562187334', 'NB-DON-014', 1, 1, true),
(9, 36, 2, 'Notebook Rodolfo Donadio', NULL, NULL, 'Sin datos técnicos', 'NB-DON-015', 1, 1, true),
(9, 36, 2, 'Notebook Alejandro Donadio', NULL, NULL, 'Sin datos técnicos', 'NB-DON-016', 1, 1, true),
(9, 36, 2, 'Notebook Libre Donadio', 'Lenovo', '80SY', 'S/N: LR09FRNX, i5-6200U, 12GB RAM, 240GB, W10 Pro', 'NB-DON-017', 1, 1, true);

-- Notebook sin ubicación ADLS
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(13, 60, 1, 'PC Libre - PC-TECNICA02', NULL, NULL, 'Intel I3 2120, 6GB DDR3, 120GB, W10, TeamViewer: 501691926', 'PC-ADLS-001', 1, 1, true),
(13, 60, 1, 'PC Estribadora 1', NULL, NULL, 'Intel Celeron J1900, 4GB RAM', 'PC-ADLS-002', 1, 1, true),
(13, 60, 1, 'PC Sebastian Nobile', 'CX', 'Slim', 'i3 10100, 8GB DDR4, SSD 240GB, MSI H410M Pro, W10 Pro, Anydesk: 1940593125, TeamViewer: 1776591395, User GP: SNobile, OBS: Ex de Cecilia Corte. Disco de notebook de Nobile', 'PC-ADLS-003', 1, 1, true);

-- Notebook sin ubicación Corsider
INSERT INTO materiales (empresa_id, sucursal_id, categoria_id, nombre, marca, modelo, descripcion, codigo, stock_actual, stock_minimo, activo)
VALUES
(12, 57, 2, 'Notebook Anto Campetella - NTBK-VCIUDAD4', NULL, NULL, 'i3 1115, 8GB RAM, SSD 240GB, W10 Pro, Anydesk: 415452169', 'NB-COR-001', 1, 1, true);

-- Verificación final
SELECT 
  e.nombre as empresa,
  s.nombre as sucursal,
  m.nombre as equipo,
  m.codigo
FROM materiales m
JOIN empresas e ON m.empresa_id = e.id
JOIN sucursales s ON m.sucursal_id = s.id
WHERE m.codigo LIKE 'PC-%' OR m.codigo LIKE 'NB-%'
ORDER BY e.nombre, s.nombre, m.nombre;
