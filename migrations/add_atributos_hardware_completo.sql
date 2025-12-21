-- Agregar atributos completos para Notebooks y PCs
-- Ejecutar este script para preparar el inventario

DO $$
DECLARE
    v_notebook_id INTEGER;
    v_pc_escritorio_id INTEGER;
    v_pcs_id INTEGER;
BEGIN
    -- Obtener IDs de categorías
    SELECT id INTO v_notebook_id FROM categorias_materiales WHERE nombre = 'Notebooks';
    SELECT id INTO v_pc_escritorio_id FROM categorias_materiales WHERE nombre = 'PC de Escritorio';
    SELECT id INTO v_pcs_id FROM categorias_materiales WHERE nombre = 'PCs';
    
    -- Atributos para Notebooks
    IF v_notebook_id IS NOT NULL THEN
        INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, requerido, orden, opciones) VALUES
        (v_notebook_id, 'Serial/UUID', 'texto', false, 100, 'Identificador único de la máquina'),
        (v_notebook_id, 'MAC Address', 'texto', false, 101, 'Dirección MAC principal'),
        (v_notebook_id, 'IP Local', 'texto', false, 102, 'Dirección IP en la red local'),
        (v_notebook_id, 'BIOS', 'texto', false, 103, 'Fabricante y versión del BIOS'),
        (v_notebook_id, 'Placa Base', 'texto', false, 104, 'Fabricante y modelo de motherboard'),
        (v_notebook_id, 'Hostname', 'texto', false, 105, 'Nombre del equipo en la red'),
        (v_notebook_id, 'Núcleos CPU', 'numero', false, 106, 'Cantidad de núcleos físicos'),
        (v_notebook_id, 'Threads CPU', 'numero', false, 107, 'Cantidad de hilos lógicos'),
        (v_notebook_id, 'Frecuencia CPU MHz', 'numero', false, 108, 'Frecuencia máxima del procesador'),
        (v_notebook_id, 'RAM Velocidad MHz', 'numero', false, 109, 'Velocidad de la memoria RAM'),
        (v_notebook_id, 'Módulos RAM', 'texto', false, 110, 'Cantidad y capacidad de módulos'),
        (v_notebook_id, 'Tipo Almacenamiento', 'texto', false, 111, 'SSD, HDD, NVMe, etc.'),
        (v_notebook_id, 'Interface Almacenamiento', 'texto', false, 112, 'SATA, NVMe, M.2, etc.'),
        (v_notebook_id, 'GPU RAM MB', 'numero', false, 113, 'Memoria de la tarjeta gráfica'),
        (v_notebook_id, 'Driver GPU', 'texto', false, 114, 'Versión del driver de video'),
        (v_notebook_id, 'Resolución Pantalla', 'texto', false, 115, 'Resolución actual (ej: 1920x1080)'),
        (v_notebook_id, 'Adaptadores Red', 'texto', false, 116, 'Lista de interfaces de red'),
        (v_notebook_id, 'Fecha Registro', 'fecha', false, 117, 'Fecha de registro automático'),
        (v_notebook_id, 'Última Actualización', 'fecha', false, 118, 'Última vez que se actualizó')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✓ Atributos agregados a categoría Notebooks';
    END IF;
    
    -- Atributos para PC de Escritorio
    IF v_pc_escritorio_id IS NOT NULL THEN
        INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, requerido, orden, opciones) VALUES
        (v_pc_escritorio_id, 'Serial/UUID', 'texto', false, 100, 'Identificador único de la máquina'),
        (v_pc_escritorio_id, 'MAC Address', 'texto', false, 101, 'Dirección MAC principal'),
        (v_pc_escritorio_id, 'IP Local', 'texto', false, 102, 'Dirección IP en la red local'),
        (v_pc_escritorio_id, 'BIOS', 'texto', false, 103, 'Fabricante y versión del BIOS'),
        (v_pc_escritorio_id, 'Placa Base', 'texto', false, 104, 'Fabricante y modelo de motherboard'),
        (v_pc_escritorio_id, 'Hostname', 'texto', false, 105, 'Nombre del equipo en la red'),
        (v_pc_escritorio_id, 'Núcleos CPU', 'numero', false, 106, 'Cantidad de núcleos físicos'),
        (v_pc_escritorio_id, 'Threads CPU', 'numero', false, 107, 'Cantidad de hilos lógicos'),
        (v_pc_escritorio_id, 'Frecuencia CPU MHz', 'numero', false, 108, 'Frecuencia máxima del procesador'),
        (v_pc_escritorio_id, 'RAM Velocidad MHz', 'numero', false, 109, 'Velocidad de la memoria RAM'),
        (v_pc_escritorio_id, 'Módulos RAM', 'texto', false, 110, 'Cantidad y capacidad de módulos'),
        (v_pc_escritorio_id, 'Tipo Almacenamiento', 'texto', false, 111, 'SSD, HDD, NVMe, etc.'),
        (v_pc_escritorio_id, 'Interface Almacenamiento', 'texto', false, 112, 'SATA, NVMe, M.2, etc.'),
        (v_pc_escritorio_id, 'GPU RAM MB', 'numero', false, 113, 'Memoria de la tarjeta gráfica'),
        (v_pc_escritorio_id, 'Driver GPU', 'texto', false, 114, 'Versión del driver de video'),
        (v_pc_escritorio_id, 'Resolución Pantalla', 'texto', false, 115, 'Resolución actual (ej: 1920x1080)'),
        (v_pc_escritorio_id, 'Adaptadores Red', 'texto', false, 116, 'Lista de interfaces de red'),
        (v_pc_escritorio_id, 'Fecha Registro', 'fecha', false, 117, 'Fecha de registro automático'),
        (v_pc_escritorio_id, 'Última Actualización', 'fecha', false, 118, 'Última vez que se actualizó')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✓ Atributos agregados a categoría PC de Escritorio';
    END IF;
    
    -- Atributos para PCs
    IF v_pcs_id IS NOT NULL THEN
        INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, requerido, orden, opciones) VALUES
        (v_pcs_id, 'Serial/UUID', 'texto', false, 100, 'Identificador único de la máquina'),
        (v_pcs_id, 'MAC Address', 'texto', false, 101, 'Dirección MAC principal'),
        (v_pcs_id, 'IP Local', 'texto', false, 102, 'Dirección IP en la red local'),
        (v_pcs_id, 'BIOS', 'texto', false, 103, 'Fabricante y versión del BIOS'),
        (v_pcs_id, 'Placa Base', 'texto', false, 104, 'Fabricante y modelo de motherboard'),
        (v_pcs_id, 'Hostname', 'texto', false, 105, 'Nombre del equipo en la red'),
        (v_pcs_id, 'Núcleos CPU', 'numero', false, 106, 'Cantidad de núcleos físicos'),
        (v_pcs_id, 'Threads CPU', 'numero', false, 107, 'Cantidad de hilos lógicos'),
        (v_pcs_id, 'Frecuencia CPU MHz', 'numero', false, 108, 'Frecuencia máxima del procesador'),
        (v_pcs_id, 'RAM Velocidad MHz', 'numero', false, 109, 'Velocidad de la memoria RAM'),
        (v_pcs_id, 'Módulos RAM', 'texto', false, 110, 'Cantidad y capacidad de módulos'),
        (v_pcs_id, 'Tipo Almacenamiento', 'texto', false, 111, 'SSD, HDD, NVMe, etc.'),
        (v_pcs_id, 'Interface Almacenamiento', 'texto', false, 112, 'SATA, NVMe, M.2, etc.'),
        (v_pcs_id, 'GPU RAM MB', 'numero', false, 113, 'Memoria de la tarjeta gráfica'),
        (v_pcs_id, 'Driver GPU', 'texto', false, 114, 'Versión del driver de video'),
        (v_pcs_id, 'Resolución Pantalla', 'texto', false, 115, 'Resolución actual (ej: 1920x1080)'),
        (v_pcs_id, 'Adaptadores Red', 'texto', false, 116, 'Lista de interfaces de red'),
        (v_pcs_id, 'Fecha Registro', 'fecha', false, 117, 'Fecha de registro automático'),
        (v_pcs_id, 'Última Actualización', 'fecha', false, 118, 'Última vez que se actualizó')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✓ Atributos agregados a categoría PCs';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migración completada exitosamente!';
    RAISE NOTICE '📋 Se agregaron 19 atributos nuevos a cada categoría de equipos';
END $$;
