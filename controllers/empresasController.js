const pool = require('../database');

// Listar empresas (SOLO SKN)
exports.index = async (req, res) => {
  try {
    const { rol } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).send('Solo usuarios SKN pueden gestionar empresas');
    }

    const result = await pool.query(
      `SELECT 
        e.*,
        COUNT(DISTINCT u.id) as total_usuarios,
        COUNT(DISTINCT m.id) as total_materiales,
        COUNT(DISTINCT s.id) as total_sucursales
       FROM empresas e
       LEFT JOIN usuarios u ON e.id = u.empresa_id
       LEFT JOIN materiales m ON e.id = m.empresa_id
       LEFT JOIN sucursales s ON e.id = s.empresa_id
       GROUP BY e.id
       ORDER BY e.nombre`
    );

    res.render('empresas/index', {
      title: 'Gestión de Empresas',
      user: req.session.user,
      empresas: result.rows
    });
  } catch (error) {
    console.error('Error al listar empresas:', error);
    res.status(500).send('Error al cargar empresas');
  }
};

// Mostrar formulario de nueva empresa (SOLO SKN)
exports.showNueva = (req, res) => {
  const { rol } = req.session.user;
  const esSKN = rol === 'skn_admin' || rol === 'skn_user';

  if (!esSKN) {
    return res.status(403).send('Solo usuarios SKN pueden crear empresas');
  }

  res.render('empresas/nueva', {
    title: 'Nueva Empresa',
    user: req.session.user,
    error: null
  });
};

// Crear empresa (SOLO SKN)
exports.crear = async (req, res) => {
  try {
    const { rol } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).send('Solo usuarios SKN pueden crear empresas');
    }

    const { nombre, cuit, direccion, ciudad, provincia, codigo_postal, telefono, email, sitio_web } = req.body;

    // Verificar que no exista
    const existe = await pool.query(
      'SELECT id FROM empresas WHERE nombre = $1',
      [nombre]
    );

    if (existe.rows.length > 0) {
      return res.render('empresas/nueva', {
        title: 'Nueva Empresa',
        user: req.session.user,
        error: 'Ya existe una empresa con ese nombre'
      });
    }

    await pool.query(
      `INSERT INTO empresas (nombre, cuit, direccion, ciudad, provincia, codigo_postal, telefono, email, sitio_web, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
      [nombre, cuit, direccion, ciudad, provincia, codigo_postal, telefono, email, sitio_web]
    );

    req.session.message = 'Empresa creada exitosamente';
    res.redirect('/empresas');
  } catch (error) {
    console.error('Error al crear empresa:', error);
    res.render('empresas/nueva', {
      title: 'Nueva Empresa',
      user: req.session.user,
      error: 'Error al crear empresa'
    });
  }
};

// Ver detalle de empresa (SOLO SKN)
exports.detalle = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).send('Solo usuarios SKN pueden ver detalles de empresas');
    }

    const empresa = await pool.query('SELECT * FROM empresas WHERE id = $1', [id]);

    if (empresa.rows.length === 0) {
      return res.status(404).send('Empresa no encontrada');
    }

    // Obtener usuarios de la empresa
    const usuarios = await pool.query(
      `SELECT id, nombre, email, rol, activo FROM usuarios WHERE empresa_id = $1 ORDER BY nombre`,
      [id]
    );

    // Obtener materiales/inventario
    const materiales = await pool.query(
      `SELECT m.*, c.nombre as categoria_nombre 
       FROM materiales m 
       LEFT JOIN categorias_materiales c ON m.categoria_id = c.id
       WHERE m.empresa_id = $1 
       ORDER BY m.nombre 
       LIMIT 50`,
      [id]
    );

    // Obtener servidores
    const servidores = await pool.query(
      `SELECT * FROM servidores WHERE empresa_id = $1 ORDER BY nombre`,
      [id]
    );

    // Obtener tickets
    const tickets = await pool.query(
      `SELECT t.*, u.nombre as solicitante_nombre 
       FROM tickets t 
       LEFT JOIN usuarios u ON t.usuario_solicitante = u.id
       WHERE t.empresa_id = $1 
       ORDER BY t.fecha_creacion DESC 
       LIMIT 20`,
      [id]
    );

    // Obtener impresoras (contadores)
    const impresoras = await pool.query(
      `SELECT DISTINCT m.*, c.nombre as categoria_nombre
       FROM materiales m
       JOIN categorias_materiales c ON m.categoria_id = c.id
       WHERE m.empresa_id = $1 AND c.nombre = 'Impresoras'
       ORDER BY m.nombre`,
      [id]
    );

    // Obtener visitas
    const visitas = await pool.query(
      `SELECT v.* 
       FROM visitas v 
       WHERE v.empresa_id = $1 
       ORDER BY v.fecha_visita DESC 
       LIMIT 20`,
      [id]
    );

    // Obtener sucursales
    const sucursales = await pool.query(
      `SELECT * FROM sucursales 
       WHERE empresa_id = $1 
       ORDER BY es_principal DESC, nombre`,
      [id]
    );

    // Estadísticas generales
    const stats = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE empresa_id = $1) as total_usuarios,
        (SELECT COUNT(*) FROM materiales WHERE empresa_id = $1) as total_materiales,
        (SELECT COUNT(*) FROM tickets WHERE empresa_id = $1) as total_tickets,
        (SELECT COUNT(*) FROM tickets WHERE empresa_id = $1 AND estado = 'pendiente') as tickets_pendientes,
        (SELECT COUNT(*) FROM servidores WHERE empresa_id = $1) as total_servidores,
        (SELECT COUNT(*) FROM visitas WHERE empresa_id = $1) as total_visitas,
        (SELECT COUNT(*) FROM sucursales WHERE empresa_id = $1) as total_sucursales
      `,
      [id]
    );

    res.render('empresas/detalle', {
      title: empresa.rows[0].nombre,
      user: req.session.user,
      empresa: empresa.rows[0],
      usuarios: usuarios.rows,
      materiales: materiales.rows,
      servidores: servidores.rows,
      tickets: tickets.rows,
      impresoras: impresoras.rows,
      visitas: visitas.rows,
      sucursales: sucursales.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Error al ver detalle:', error);
    res.status(500).send('Error al cargar detalle');
  }
};

// Activar/Desactivar empresa (SOLO SKN)
exports.toggleActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).send('Solo usuarios SKN pueden activar/desactivar empresas');
    }

    await pool.query(
      'UPDATE empresas SET activo = NOT activo WHERE id = $1',
      [id]
    );

    req.session.message = 'Estado de empresa actualizado';
    res.redirect('/empresas');
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.redirect('/empresas');
  }
};

// ========== GESTIÓN DE SUCURSALES ==========

// Crear sucursal
exports.crearSucursal = async (req, res) => {
  try {
    const { empresa_id } = req.params;
    const { rol } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).json({ error: 'Solo usuarios SKN pueden crear sucursales' });
    }

    const {
      nombre,
      codigo,
      direccion,
      ciudad,
      provincia,
      codigo_postal,
      telefono,
      email,
      es_principal,
      observaciones
    } = req.body;

    // Si es principal, desmarcar las demás
    if (es_principal === 'on' || es_principal === true) {
      await pool.query(
        'UPDATE sucursales SET es_principal = false WHERE empresa_id = $1',
        [empresa_id]
      );
    }

    await pool.query(
      `INSERT INTO sucursales 
       (empresa_id, nombre, codigo, direccion, ciudad, provincia, codigo_postal, telefono, email, es_principal, observaciones) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        empresa_id,
        nombre,
        codigo,
        direccion,
        ciudad,
        provincia,
        codigo_postal,
        telefono,
        email,
        es_principal === 'on' || es_principal === true,
        observaciones
      ]
    );

    req.session.message = 'Sucursal creada exitosamente';
    res.redirect(`/empresas/${empresa_id}`);
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    req.session.error = 'Error al crear sucursal';
    res.redirect(`/empresas/${req.params.empresa_id}`);
  }
};

// Editar sucursal
exports.editarSucursal = async (req, res) => {
  try {
    const { empresa_id, sucursal_id } = req.params;
    const { rol } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).json({ error: 'Solo usuarios SKN pueden editar sucursales' });
    }

    const {
      nombre,
      codigo,
      direccion,
      ciudad,
      provincia,
      codigo_postal,
      telefono,
      email,
      es_principal,
      observaciones
    } = req.body;

    // Si es principal, desmarcar las demás
    if (es_principal === 'on' || es_principal === true) {
      await pool.query(
        'UPDATE sucursales SET es_principal = false WHERE empresa_id = $1 AND id != $2',
        [empresa_id, sucursal_id]
      );
    }

    await pool.query(
      `UPDATE sucursales 
       SET nombre = $1, codigo = $2, direccion = $3, ciudad = $4, provincia = $5, 
           codigo_postal = $6, telefono = $7, email = $8, es_principal = $9, observaciones = $10
       WHERE id = $11 AND empresa_id = $12`,
      [
        nombre,
        codigo,
        direccion,
        ciudad,
        provincia,
        codigo_postal,
        telefono,
        email,
        es_principal === 'on' || es_principal === true,
        observaciones,
        sucursal_id,
        empresa_id
      ]
    );

    req.session.message = 'Sucursal actualizada exitosamente';
    res.redirect(`/empresas/${empresa_id}`);
  } catch (error) {
    console.error('Error al editar sucursal:', error);
    req.session.error = 'Error al editar sucursal';
    res.redirect(`/empresas/${empresa_id}`);
  }
};

// Eliminar/desactivar sucursal
exports.eliminarSucursal = async (req, res) => {
  try {
    const { empresa_id, sucursal_id } = req.params;
    const { rol } = req.session.user;
    const esSKN = rol === 'skn_admin' || rol === 'skn_user';

    if (!esSKN) {
      return res.status(403).json({ error: 'Solo usuarios SKN pueden eliminar sucursales' });
    }

    await pool.query(
      'UPDATE sucursales SET activo = false WHERE id = $1 AND empresa_id = $2',
      [sucursal_id, empresa_id]
    );

    req.session.message = 'Sucursal desactivada exitosamente';
    res.redirect(`/empresas/${empresa_id}`);
  } catch (error) {
    console.error('Error al eliminar sucursal:', error);
    req.session.error = 'Error al eliminar sucursal';
    res.redirect(`/empresas/${empresa_id}`);
  }
};
