const pool = require('../database');

// Listar contadores de impresoras
// SKN: Ve todos los contadores de todas las empresas
// Empresa: Solo ve contadores de sus propias impresoras
exports.index = async (req, res) => {
  try {
    const { rol, empresa_id } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    let query;
    let params = [];

    if (esSKN) {
      // SKN ve todos los contadores con datos de empresa
      query = `
        SELECT 
          ic.*,
          m.nombre as impresora_nombre,
          m.marca,
          m.modelo,
          e.nombre as empresa_nombre,
          u.nombre as registrado_por_nombre
        FROM impresoras_contadores ic
        JOIN materiales m ON ic.material_id = m.id
        JOIN empresas e ON m.empresa_id = e.id
        LEFT JOIN usuarios u ON ic.registrado_por = u.id
        ORDER BY ic.fecha_lectura DESC, e.nombre, m.nombre
      `;
    } else {
      // Empresa solo ve sus propios contadores
      query = `
        SELECT 
          ic.*,
          m.nombre as impresora_nombre,
          m.marca,
          m.modelo,
          u.nombre as registrado_por_nombre
        FROM impresoras_contadores ic
        JOIN materiales m ON ic.material_id = m.id
        LEFT JOIN usuarios u ON ic.registrado_por = u.id
        WHERE m.empresa_id = $1
        ORDER BY ic.fecha_lectura DESC, m.nombre
      `;
      params = [empresa_id];
    }

    const result = await pool.query(query, params);

    res.render('contadores/index', {
      title: 'Contadores de Impresoras',
      user: req.session.user,
      contadores: result.rows,
      esSKN
    });
  } catch (error) {
    console.error('Error al listar contadores:', error);
    res.status(500).send('Error al cargar contadores');
  }
};

// Mostrar formulario de nuevo contador (solo SKN)
exports.showNuevo = async (req, res) => {
  try {
    const { rol, empresa_id } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).send('Solo usuarios SKN pueden crear contadores');
    }

    // Obtener todas las impresoras de todas las empresas
    const impresorasQuery = `
      SELECT 
        m.id,
        m.nombre,
        m.marca,
        m.modelo,
        e.nombre as empresa_nombre,
        e.id as empresa_id
      FROM materiales m
      JOIN categorias_materiales c ON m.categoria_id = c.id
      JOIN empresas e ON m.empresa_id = e.id
      WHERE c.nombre = 'Impresoras' AND m.activo = true
      ORDER BY e.nombre, m.nombre
    `;

    const impresoras = await pool.query(impresorasQuery);

    res.render('contadores/nuevo', {
      title: 'Registrar Contador',
      user: req.session.user,
      impresoras: impresoras.rows,
      error: null
    });
  } catch (error) {
    console.error('Error al mostrar formulario:', error);
    res.status(500).send('Error al cargar formulario');
  }
};

// Crear nuevo contador (solo SKN)
exports.crear = async (req, res) => {
  try {
    const { rol, id: usuario_id } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).send('Solo usuarios SKN pueden crear contadores');
    }

    const { material_id, fecha_lectura, contador_byn, contador_color, observaciones } = req.body;

    // Verificar que la impresora existe
    const impresoraCheck = await pool.query(
      'SELECT id FROM materiales WHERE id = $1',
      [material_id]
    );

    if (impresoraCheck.rows.length === 0) {
      return res.status(404).send('Impresora no encontrada');
    }

    // Insertar contador
    await pool.query(
      `INSERT INTO impresoras_contadores 
       (material_id, fecha_lectura, contador_byn, contador_color, observaciones, registrado_por)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [material_id, fecha_lectura, contador_byn || 0, contador_color || 0, observaciones, usuario_id]
    );

    res.redirect('/contadores');
  } catch (error) {
    console.error('Error al crear contador:', error);
    
    if (error.code === '23505') {
      // Violación de constraint único
      return res.render('contadores/nuevo', {
        title: 'Registrar Contador',
        user: req.session.user,
        impresoras: [],
        error: 'Ya existe un registro para esta impresora en esta fecha'
      });
    }
    
    res.status(500).send('Error al crear contador');
  }
};

// Ver detalle de contador
exports.detalle = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, empresa_id } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    let query;
    let params;

    if (esSKN) {
      // SKN puede ver cualquier contador
      query = `
        SELECT 
          ic.*,
          m.nombre as impresora_nombre,
          m.marca,
          m.modelo,
          e.nombre as empresa_nombre,
          e.id as empresa_id,
          u.nombre as registrado_por_nombre
        FROM impresoras_contadores ic
        JOIN materiales m ON ic.material_id = m.id
        JOIN empresas e ON m.empresa_id = e.id
        LEFT JOIN usuarios u ON ic.registrado_por = u.id
        WHERE ic.id = $1
      `;
      params = [id];
    } else {
      // Empresa solo puede ver sus propios contadores
      query = `
        SELECT 
          ic.*,
          m.nombre as impresora_nombre,
          m.marca,
          m.modelo,
          u.nombre as registrado_por_nombre
        FROM impresoras_contadores ic
        JOIN materiales m ON ic.material_id = m.id
        LEFT JOIN usuarios u ON ic.registrado_por = u.id
        WHERE ic.id = $1 AND m.empresa_id = $2
      `;
      params = [id, empresa_id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).render('404', {
        title: 'Contador no encontrado',
        user: req.session.user
      });
    }

    // Obtener histórico de la misma impresora
    const historicoQuery = `
      SELECT 
        fecha_lectura,
        contador_byn,
        contador_color,
        total_paginas
      FROM impresoras_contadores
      WHERE material_id = $1
      ORDER BY fecha_lectura DESC
      LIMIT 10
    `;
    const historico = await pool.query(historicoQuery, [result.rows[0].material_id]);

    res.render('contadores/detalle', {
      title: 'Detalle de Contador',
      user: req.session.user,
      contador: result.rows[0],
      historico: historico.rows,
      esSKN
    });
  } catch (error) {
    console.error('Error al obtener detalle:', error);
    res.status(500).send('Error al cargar detalle');
  }
};

// Editar contador (solo SKN)
exports.showEditar = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).send('Solo usuarios SKN pueden editar contadores');
    }

    const contadorQuery = `
      SELECT 
        ic.*,
        m.nombre as impresora_nombre,
        m.marca,
        m.modelo,
        e.nombre as empresa_nombre
      FROM impresoras_contadores ic
      JOIN materiales m ON ic.material_id = m.id
      JOIN empresas e ON m.empresa_id = e.id
      WHERE ic.id = $1
    `;

    const result = await pool.query(contadorQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Contador no encontrado');
    }

    res.render('contadores/editar', {
      title: 'Editar Contador',
      user: req.session.user,
      contador: result.rows[0],
      error: null
    });
  } catch (error) {
    console.error('Error al mostrar formulario de edición:', error);
    res.status(500).send('Error al cargar formulario');
  }
};

// Actualizar contador (solo SKN)
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).send('Solo usuarios SKN pueden editar contadores');
    }

    const { fecha_lectura, contador_byn, contador_color, observaciones } = req.body;

    await pool.query(
      `UPDATE impresoras_contadores 
       SET fecha_lectura = $1, 
           contador_byn = $2, 
           contador_color = $3, 
           observaciones = $4,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [fecha_lectura, contador_byn || 0, contador_color || 0, observaciones, id]
    );

    res.redirect('/contadores/' + id);
  } catch (error) {
    console.error('Error al actualizar contador:', error);
    res.status(500).send('Error al actualizar contador');
  }
};
