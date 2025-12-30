const pool = require('../database');
const path = require('path');
const fs = require('fs');

// Middleware para verificar que SOLO fnalbandian@gmail.com pueda acceder
function soloAdminSKN(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  // SOLO el email fnalbandian@gmail.com puede acceder
  if (req.session.user.email !== 'fnalbandian@gmail.com') {
    return res.status(403).render('404', {
      usuario: req.session.user,
      mensaje: '❌ Acceso denegado. Solo fnalbandian@gmail.com puede acceder a las evaluaciones internas.'
    });
  }
  
  next();
}

// Listar todas las evaluaciones internas
exports.index = async (req, res) => {
  try {
    // Filtros
    const { buscar, usuario, recomendacion, periodo_inicio, periodo_fin } = req.query;
    
    let query = `
      SELECT 
        e.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        emp.nombre as empresa_nombre,
        ev.nombre as evaluador_nombre
      FROM evaluaciones_internas e
      INNER JOIN usuarios u ON e.usuario_evaluado_id = u.id
      LEFT JOIN empresas emp ON u.empresa_id = emp.id
      INNER JOIN usuarios ev ON e.evaluador_id = ev.id
      WHERE e.activo = true
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Filtro por búsqueda
    if (buscar) {
      query += ` AND (
        e.titulo ILIKE $${paramCount} OR 
        e.descripcion ILIKE $${paramCount} OR
        u.nombre ILIKE $${paramCount}
      )`;
      params.push(`%${buscar}%`);
      paramCount++;
    }
    
    // Filtro por usuario
    if (usuario) {
      query += ` AND e.usuario_evaluado_id = $${paramCount}`;
      params.push(usuario);
      paramCount++;
    }
    
    // Filtro por recomendación
    if (recomendacion) {
      query += ` AND e.recomendacion = $${paramCount}`;
      params.push(recomendacion);
      paramCount++;
    }
    
    // Filtro por período
    if (periodo_inicio) {
      query += ` AND e.periodo_inicio >= $${paramCount}`;
      params.push(periodo_inicio);
      paramCount++;
    }
    
    if (periodo_fin) {
      query += ` AND e.periodo_fin <= $${paramCount}`;
      params.push(periodo_fin);
      paramCount++;
    }
    
    query += ` ORDER BY e.fecha_creacion DESC`;
    
    const result = await pool.query(query, params);
    
    // Obtener lista de usuarios de SKN para el filtro
    const usuariosSKN = await pool.query(`
      SELECT u.id, u.nombre, u.email, emp.nombre as empresa_nombre
      FROM usuarios u
      LEFT JOIN empresas emp ON u.empresa_id = emp.id
      WHERE u.activo = true
      ORDER BY u.nombre
    `);
    
    res.render('evaluaciones/index', {
      usuario: req.session.user,
      evaluaciones: result.rows,
      usuariosSKN: usuariosSKN.rows,
      filtros: { buscar, usuario, recomendacion, periodo_inicio, periodo_fin }
    });
  } catch (error) {
    console.error('Error al listar evaluaciones:', error);
    res.status(500).send('Error al cargar evaluaciones');
  }
};

// Mostrar formulario de nueva evaluación
exports.nuevo = async (req, res) => {
  try {
    // Obtener todos los usuarios para evaluar
    const usuarios = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.rol, emp.nombre as empresa_nombre
      FROM usuarios u
      LEFT JOIN empresas emp ON u.empresa_id = emp.id
      WHERE u.activo = true
      ORDER BY u.nombre
    `);
    
    res.render('evaluaciones/nuevo', {
      usuario: req.session.user,
      usuarios: usuarios.rows
    });
  } catch (error) {
    console.error('Error al mostrar formulario:', error);
    res.status(500).send('Error al cargar formulario');
  }
};

// Crear nueva evaluación
exports.crear = async (req, res) => {
  try {
    const {
      usuario_evaluado_id,
      titulo,
      descripcion,
      tipo,
      puntaje_desempeno,
      puntaje_actitud,
      puntaje_puntualidad,
      puntaje_trabajo_equipo,
      puntaje_general,
      notas_confidenciales,
      contraseñas_accesos,
      recomendacion,
      monto_sugerido,
      aprobado_para_premio,
      periodo_inicio,
      periodo_fin
    } = req.body;
    
    // Procesar imágenes subidas
    let imagenes = [];
    if (req.files && req.files.length > 0) {
      imagenes = req.files.map(file => {
        // Si es Cloudinary, devuelve la URL, si no, la ruta local
        return file.path.includes('cloudinary') ? file.path : `/uploads/evaluaciones/${file.filename}`;
      });
    }
    
    const result = await pool.query(
      `INSERT INTO evaluaciones_internas (
        usuario_evaluado_id, evaluador_id, titulo, descripcion, tipo,
        puntaje_desempeno, puntaje_actitud, puntaje_puntualidad, 
        puntaje_trabajo_equipo, puntaje_general,
        notas_confidenciales, contraseñas_accesos, imagenes,
        recomendacion, monto_sugerido, aprobado_para_premio,
        periodo_inicio, periodo_fin, es_confidencial
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
      RETURNING id`,
      [
        usuario_evaluado_id,
        req.session.user.id, // evaluador_id (siempre el admin logueado)
        titulo,
        descripcion || null,
        tipo || 'general',
        puntaje_desempeno || null,
        puntaje_actitud || null,
        puntaje_puntualidad || null,
        puntaje_trabajo_equipo || null,
        puntaje_general || null,
        notas_confidenciales || null,
        contraseñas_accesos || null,
        imagenes.length > 0 ? imagenes : null,
        recomendacion || null,
        monto_sugerido || null,
        aprobado_para_premio === 'on',
        periodo_inicio || null,
        periodo_fin || null
      ]
    );
    
    res.redirect('/evaluaciones');
  } catch (error) {
    console.error('Error al crear evaluación:', error);
    res.status(500).send('Error al crear evaluación');
  }
};

// Ver detalle de evaluación
exports.detalle = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        e.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        u.rol as usuario_rol,
        emp.nombre as empresa_nombre,
        ev.nombre as evaluador_nombre,
        ev.email as evaluador_email
      FROM evaluaciones_internas e
      INNER JOIN usuarios u ON e.usuario_evaluado_id = u.id
      LEFT JOIN empresas emp ON u.empresa_id = emp.id
      INNER JOIN usuarios ev ON e.evaluador_id = ev.id
      WHERE e.id = $1 AND e.activo = true`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).render('404', {
        usuario: req.session.user,
        mensaje: 'Evaluación no encontrada'
      });
    }
    
    res.render('evaluaciones/detalle', {
      usuario: req.session.user,
      evaluacion: result.rows[0]
    });
  } catch (error) {
    console.error('Error al ver evaluación:', error);
    res.status(500).send('Error al cargar evaluación');
  }
};

// Mostrar formulario de edición
exports.editar = async (req, res) => {
  try {
    const { id } = req.params;
    
    const evaluacion = await pool.query(
      `SELECT e.*, u.nombre as usuario_nombre
      FROM evaluaciones_internas e
      INNER JOIN usuarios u ON e.usuario_evaluado_id = u.id
      WHERE e.id = $1 AND e.activo = true`,
      [id]
    );
    
    if (evaluacion.rows.length === 0) {
      return res.status(404).send('Evaluación no encontrada');
    }
    
    const usuarios = await pool.query(`
      SELECT u.id, u.nombre, u.email, emp.nombre as empresa_nombre
      FROM usuarios u
      LEFT JOIN empresas emp ON u.empresa_id = emp.id
      WHERE u.activo = true
      ORDER BY u.nombre
    `);
    
    res.render('evaluaciones/editar', {
      usuario: req.session.user,
      evaluacion: evaluacion.rows[0],
      usuarios: usuarios.rows
    });
  } catch (error) {
    console.error('Error al editar evaluación:', error);
    res.status(500).send('Error al cargar formulario');
  }
};

// Actualizar evaluación
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      usuario_evaluado_id,
      titulo,
      descripcion,
      tipo,
      puntaje_desempeno,
      puntaje_actitud,
      puntaje_puntualidad,
      puntaje_trabajo_equipo,
      puntaje_general,
      notas_confidenciales,
      contraseñas_accesos,
      recomendacion,
      monto_sugerido,
      aprobado_para_premio,
      periodo_inicio,
      periodo_fin
    } = req.body;
    
    // Obtener imágenes actuales
    const current = await pool.query('SELECT imagenes FROM evaluaciones_internas WHERE id = $1', [id]);
    let imagenes = current.rows[0]?.imagenes || [];
    
    // Agregar nuevas imágenes
    if (req.files && req.files.length > 0) {
      const nuevasImagenes = req.files.map(file => {
        return file.path.includes('cloudinary') ? file.path : `/uploads/evaluaciones/${file.filename}`;
      });
      imagenes = [...imagenes, ...nuevasImagenes];
    }
    
    await pool.query(
      `UPDATE evaluaciones_internas SET
        usuario_evaluado_id = $1, titulo = $2, descripcion = $3, tipo = $4,
        puntaje_desempeno = $5, puntaje_actitud = $6, puntaje_puntualidad = $7,
        puntaje_trabajo_equipo = $8, puntaje_general = $9,
        notas_confidenciales = $10, contraseñas_accesos = $11, imagenes = $12,
        recomendacion = $13, monto_sugerido = $14, aprobado_para_premio = $15,
        periodo_inicio = $16, periodo_fin = $17,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $18`,
      [
        usuario_evaluado_id,
        titulo,
        descripcion || null,
        tipo || 'general',
        puntaje_desempeno || null,
        puntaje_actitud || null,
        puntaje_puntualidad || null,
        puntaje_trabajo_equipo || null,
        puntaje_general || null,
        notas_confidenciales || null,
        contraseñas_accesos || null,
        imagenes.length > 0 ? imagenes : null,
        recomendacion || null,
        monto_sugerido || null,
        aprobado_para_premio === 'on',
        periodo_inicio || null,
        periodo_fin || null,
        id
      ]
    );
    
    res.redirect(`/evaluaciones/${id}`);
  } catch (error) {
    console.error('Error al actualizar evaluación:', error);
    res.status(500).send('Error al actualizar evaluación');
  }
};

// Eliminar evaluación (soft delete)
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      'UPDATE evaluaciones_internas SET activo = false WHERE id = $1',
      [id]
    );
    
    res.redirect('/evaluaciones');
  } catch (error) {
    console.error('Error al eliminar evaluación:', error);
    res.status(500).send('Error al eliminar evaluación');
  }
};

// Exportar middleware
exports.soloAdminSKN = soloAdminSKN;
