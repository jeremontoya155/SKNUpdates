const db = require('../database');
const bcrypt = require('bcrypt');

const usuariosController = {
  // Listar usuarios
  index: async (req, res) => {
    try {
      const user = req.session.user;
      
      // Obtener filtros
      const filtros = {
        buscar: req.query.buscar || '',
        empresa: req.query.empresa || '',
        rol: req.query.rol || '',
        estado: req.query.estado || '',
        orden: req.query.orden || 'fecha_desc'
      };

      // Obtener estadísticas generales
      let statsQuery;
      let statsParams = [];
      
      if (user.rol === 'skn_admin') {
        statsQuery = `
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE activo = true) as activos,
            COUNT(*) FILTER (WHERE activo = false) as pendientes,
            COUNT(*) FILTER (WHERE rol LIKE 'skn_%') as skn_users,
            COUNT(*) FILTER (WHERE rol LIKE 'empresa_%') as empresa_users
          FROM usuarios
        `;
      } else if (user.rol === 'empresa_admin') {
        statsQuery = `
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE activo = true) as activos,
            COUNT(*) FILTER (WHERE activo = false) as pendientes,
            COUNT(*) FILTER (WHERE rol LIKE 'skn_%') as skn_users,
            COUNT(*) FILTER (WHERE rol LIKE 'empresa_%') as empresa_users
          FROM usuarios
          WHERE empresa_id = $1
        `;
        statsParams = [user.empresa_id];
      }
      
      const statsResult = await db.query(statsQuery, statsParams);
      const stats = statsResult.rows[0];

      // Construir query principal
      let query, params;
      let whereConditions = [];
      let paramCounter = 1;
      let queryParams = [];

      // Base query con JOINs
      const baseSelect = `
        SELECT u.*, 
               e.nombre as empresa_nombre,
               s.nombre as sucursal_nombre,
               s.direccion as sucursal_direccion,
               s.ciudad as sucursal_ciudad,
               s.provincia as sucursal_provincia
        FROM usuarios u 
        LEFT JOIN empresas e ON u.empresa_id = e.id
        LEFT JOIN sucursales s ON u.sucursal_id = s.id
      `;

      // Filtro por rol del usuario (permisos)
      if (user.rol === 'empresa_admin') {
        whereConditions.push(`u.empresa_id = $${paramCounter}`);
        queryParams.push(user.empresa_id);
        paramCounter++;
      }

      // Filtro de búsqueda
      if (filtros.buscar) {
        whereConditions.push(`(LOWER(u.nombre) LIKE $${paramCounter} OR LOWER(u.email) LIKE $${paramCounter})`);
        queryParams.push(`%${filtros.buscar.toLowerCase()}%`);
        paramCounter++;
      }

      // Filtro por empresa (solo para SKN admin)
      if (filtros.empresa && user.rol === 'skn_admin') {
        whereConditions.push(`u.empresa_id = $${paramCounter}`);
        queryParams.push(filtros.empresa);
        paramCounter++;
      }

      // Filtro por rol
      if (filtros.rol) {
        whereConditions.push(`u.rol = $${paramCounter}`);
        queryParams.push(filtros.rol);
        paramCounter++;
      }

      // Filtro por estado
      if (filtros.estado === 'activo') {
        whereConditions.push('u.activo = true');
      } else if (filtros.estado === 'pendiente') {
        whereConditions.push('u.activo = false');
      }

      // Construir WHERE clause
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ') 
        : '';

      // Ordenamiento
      let orderBy;
      switch(filtros.orden) {
        case 'nombre':
          orderBy = 'u.nombre ASC';
          break;
        case 'empresa':
          orderBy = 'e.nombre ASC, u.nombre ASC';
          break;
        case 'rol':
          orderBy = 'u.rol ASC, u.nombre ASC';
          break;
        case 'fecha_asc':
          orderBy = 'u.fecha_registro ASC';
          break;
        case 'fecha_desc':
        default:
          orderBy = 'u.fecha_registro DESC';
          break;
      }

      query = `${baseSelect} ${whereClause} ORDER BY ${orderBy}`;
      params = queryParams;

      const result = await db.query(query, params);
      
      // Obtener lista de empresas para filtro (solo SKN admin)
      let empresas = [];
      if (user.rol === 'skn_admin') {
        const empresasResult = await db.query('SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre');
        empresas = empresasResult.rows;
      }

      res.render('usuarios/index', { 
        title: 'Usuarios', 
        usuarios: result.rows,
        stats: stats,
        filtros: filtros,
        empresas: empresas
      });
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      res.render('usuarios/index', { 
        title: 'Usuarios', 
        usuarios: [],
        stats: { total: 0, activos: 0, pendientes: 0, skn_users: 0, empresa_users: 0 },
        filtros: { buscar: '', empresa: '', rol: '', estado: '', orden: 'fecha_desc' },
        empresas: []
      });
    }
  },

  // Aprobar usuario (solo SKN admin puede aprobar cualquier usuario)
  aprobar: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      // Solo SKN admin puede aprobar usuarios
      if (user.rol !== 'skn_admin') {
        return res.status(403).send('Solo administradores de SKN pueden aprobar usuarios');
      }

      await db.query(
        "UPDATE usuarios SET activo = true, fecha_aprobacion = TIMEZONE('America/Argentina/Buenos_Aires', NOW()) WHERE id = $1",
        [id]
      );

      req.session.message = 'Usuario aprobado exitosamente';
      res.redirect('/usuarios');
    } catch (error) {
      console.error('Error al aprobar usuario:', error);
      req.session.error = 'Error al aprobar usuario';
      res.redirect('/usuarios');
    }
  },

  // Desactivar usuario
  desactivar: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      // SKN admin puede desactivar a cualquiera
      // Empresa admin solo puede desactivar usuarios de su empresa
      if (user.rol === 'empresa_admin') {
        const usuarioDesactivar = await db.query('SELECT empresa_id FROM usuarios WHERE id = $1', [id]);
        if (usuarioDesactivar.rows.length === 0 || usuarioDesactivar.rows[0].empresa_id !== user.empresa_id) {
          return res.status(403).send('No tienes permisos');
        }
      }

      await db.query('UPDATE usuarios SET activo = false WHERE id = $1', [id]);

      req.session.message = 'Usuario desactivado';
      res.redirect('/usuarios');
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      req.session.error = 'Error al desactivar usuario';
      res.redirect('/usuarios');
    }
  },

  // Cambiar rol (solo SKN admin)
  cambiarRol: async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;
    const user = req.session.user;

    try {
      // Solo SKN admin puede cambiar roles
      if (user.rol !== 'skn_admin') {
        return res.status(403).send('Solo administradores de SKN pueden cambiar roles');
      }

      // Validar que el rol sea válido
      const rolesValidos = ['skn_admin', 'skn_user', 'skn_subadmin', 'empresa_admin', 'empresa_user'];
      if (!rolesValidos.includes(rol)) {
        req.session.error = 'Rol inválido';
        return res.redirect('/usuarios');
      }

      await db.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, id]);

      req.session.message = 'Rol actualizado';
      res.redirect('/usuarios');
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      req.session.error = 'Error al cambiar rol';
      res.redirect('/usuarios');
    }
  },

  // Mostrar formulario de edición
  mostrarEditar: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      // Obtener usuario a editar
      let usuarioQuery;
      if (user.rol === 'skn_admin') {
        usuarioQuery = await db.query(
          'SELECT u.*, e.nombre as empresa_nombre FROM usuarios u LEFT JOIN empresas e ON u.empresa_id = e.id WHERE u.id = $1',
          [id]
        );
      } else if (user.rol === 'empresa_admin') {
        usuarioQuery = await db.query(
          'SELECT u.*, e.nombre as empresa_nombre FROM usuarios u LEFT JOIN empresas e ON u.empresa_id = e.id WHERE u.id = $1 AND u.empresa_id = $2',
          [id, user.empresa_id]
        );
      } else {
        return res.status(403).send('No tienes permisos');
      }

      if (usuarioQuery.rows.length === 0) {
        req.session.error = 'Usuario no encontrado';
        return res.redirect('/usuarios');
      }

      const usuarioEditar = usuarioQuery.rows[0];

      // Obtener empresas (solo para SKN admin)
      let empresas = [];
      if (user.rol === 'skn_admin') {
        const empresasQuery = await db.query('SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre');
        empresas = empresasQuery.rows;
      }

      res.render('usuarios/editar', {
        title: 'Editar Usuario',
        usuario: usuarioEditar,
        empresas: empresas
      });
    } catch (error) {
      console.error('Error al mostrar edición:', error);
      req.session.error = 'Error al cargar usuario';
      res.redirect('/usuarios');
    }
  },

  // Guardar cambios de edición
  editar: async (req, res) => {
    const { id } = req.params;
    const { nombre, email, rol, empresa_id, password } = req.body;
    const user = req.session.user;

    try {
      // Validar permisos
      if (user.rol === 'empresa_admin') {
        const usuarioEditar = await db.query('SELECT empresa_id FROM usuarios WHERE id = $1', [id]);
        if (usuarioEditar.rows.length === 0 || usuarioEditar.rows[0].empresa_id !== user.empresa_id) {
          return res.status(403).send('No tienes permisos');
        }
      }

      // Construir query dinámicamente
      let updates = [];
      let params = [];
      let paramIndex = 1;

      if (nombre && nombre.trim()) {
        updates.push(`nombre = $${paramIndex}`);
        params.push(nombre.trim());
        paramIndex++;
      }

      if (email && email.trim()) {
        updates.push(`email = $${paramIndex}`);
        params.push(email.trim().toLowerCase());
        paramIndex++;
      }

      // Solo SKN admin puede cambiar rol y empresa
      if (user.rol === 'skn_admin') {
        if (rol) {
          const rolesValidos = ['skn_admin', 'skn_subadmin', 'skn_user', 'empresa_admin', 'empresa_user'];
          if (rolesValidos.includes(rol)) {
            updates.push(`rol = $${paramIndex}`);
            params.push(rol);
            paramIndex++;
          }
        }

        if (empresa_id) {
          updates.push(`empresa_id = $${paramIndex}`);
          params.push(empresa_id === 'null' ? null : empresa_id);
          paramIndex++;
        }
      }

      // Si se proporciona nueva contraseña
      if (password && password.trim()) {
        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        updates.push(`password = $${paramIndex}`);
        params.push(hashedPassword);
        paramIndex++;
      }

      if (updates.length === 0) {
        req.session.error = 'No hay cambios para guardar';
        return res.redirect(`/usuarios/${id}/editar`);
      }

      // Agregar ID al final
      params.push(id);

      const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      await db.query(query, params);

      req.session.message = 'Usuario actualizado exitosamente';
      res.redirect('/usuarios');
    } catch (error) {
      console.error('Error al editar usuario:', error);
      req.session.error = 'Error al actualizar usuario';
      res.redirect(`/usuarios/${id}/editar`);
    }
  },

  // Mostrar formulario de nuevo usuario
  mostrarNuevo: async (req, res) => {
    const user = req.session.user;

    try {
      // Obtener empresas (solo para SKN admin)
      let empresas = [];
      if (user.rol === 'skn_admin') {
        const empresasQuery = await db.query('SELECT id, nombre FROM empresas WHERE activo = true ORDER BY nombre');
        empresas = empresasQuery.rows;
      }

      res.render('usuarios/nuevo', {
        title: 'Nuevo Usuario',
        empresas: empresas
      });
    } catch (error) {
      console.error('Error al mostrar formulario:', error);
      req.session.error = 'Error al cargar formulario';
      res.redirect('/usuarios');
    }
  },

  // Crear nuevo usuario
  crear: async (req, res) => {
    const { nombre, email, password, rol, empresa_id } = req.body;
    const user = req.session.user;

    try {
      // Validar campos requeridos
      if (!nombre || !email || !password) {
        req.session.error = 'Nombre, email y contraseña son obligatorios';
        return res.redirect('/usuarios/nuevo');
      }

      // Validar email único
      const emailExiste = await db.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
      if (emailExiste.rows.length > 0) {
        req.session.error = 'El email ya está registrado';
        return res.redirect('/usuarios/nuevo');
      }

      // Determinar rol y empresa
      let rolFinal = rol;
      let empresaIdFinal = empresa_id;

      if (user.rol === 'empresa_admin') {
        // Admin de empresa solo puede crear usuarios de su empresa
        rolFinal = 'empresa_user'; // Por defecto usuario normal
        empresaIdFinal = user.empresa_id;
      } else if (user.rol === 'skn_admin') {
        // SKN admin puede crear cualquier tipo de usuario
        const rolesValidos = ['skn_admin', 'skn_subadmin', 'skn_user', 'empresa_admin', 'empresa_user'];
        if (!rolesValidos.includes(rol)) {
          rolFinal = 'empresa_user';
        }
        
        // Si es usuario SKN, empresa_id debe ser null
        if (rolFinal.startsWith('skn_')) {
          empresaIdFinal = null;
        } else if (!empresaIdFinal || empresaIdFinal === 'null') {
          req.session.error = 'Debes seleccionar una empresa para usuarios tipo empresa';
          return res.redirect('/usuarios/nuevo');
        }
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar usuario
      await db.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol, empresa_id, activo, fecha_registro) 
         VALUES ($1, $2, $3, $4, $5, true, TIMEZONE('America/Argentina/Buenos_Aires', NOW()))`,
        [nombre.trim(), email.toLowerCase().trim(), hashedPassword, rolFinal, empresaIdFinal]
      );

      req.session.message = `Usuario ${nombre} creado exitosamente`;
      res.redirect('/usuarios');
    } catch (error) {
      console.error('Error al crear usuario:', error);
      req.session.error = 'Error al crear usuario';
      res.redirect('/usuarios/nuevo');
    }
  }
};

module.exports = usuariosController;
