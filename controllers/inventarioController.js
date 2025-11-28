const db = require('../database');

const inventarioController = {
  // Listar materiales
  index: async (req, res) => {
    try {
      const user = req.session.user;
      const result = await db.query(
        `SELECT m.*, c.nombre as categoria_nombre 
         FROM materiales m 
         LEFT JOIN categorias_materiales c ON m.categoria_id = c.id 
         WHERE m.empresa_id = $1 AND m.activo = true 
         ORDER BY m.nombre`,
        [user.empresa_id]
      );

      res.render('inventario/index', { title: 'Inventario', materiales: result.rows });
    } catch (error) {
      console.error('Error al listar materiales:', error);
      res.render('inventario/index', { title: 'Inventario', materiales: [] });
    }
  },

  // Mostrar formulario de nuevo material
  showNuevo: async (req, res) => {
    try {
      const user = req.session.user;
      const categorias = await db.query(
        'SELECT * FROM categorias_materiales WHERE empresa_id = $1 AND activo = true ORDER BY nombre',
        [user.empresa_id]
      );

      // Obtener atributos si se seleccionó una categoría
      let atributos = [];
      const categoriaId = req.query.categoria_id;
      if (categoriaId) {
        const atributosResult = await db.query(
          'SELECT * FROM atributos_categoria WHERE categoria_id = $1 AND activo = true ORDER BY orden',
          [categoriaId]
        );
        atributos = atributosResult.rows;
      }

      res.render('inventario/nuevo', { 
        title: 'Nuevo Material', 
        categorias: categorias.rows,
        atributos: atributos,
        categoriaId: categoriaId
      });
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      res.render('inventario/nuevo', { title: 'Nuevo Material', categorias: [], atributos: [] });
    }
  },

  // Crear material
  crear: async (req, res) => {
    const { nombre, descripcion, codigo, categoria_id, stock_actual, stock_minimo, precio_unitario, unidad_medida } = req.body;
    const user = req.session.user;

    try {
      // Insertar material
      const materialResult = await db.query(
        `INSERT INTO materiales (empresa_id, categoria_id, nombre, descripcion, codigo, stock_actual, stock_minimo, precio_unitario, unidad_medida) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [user.empresa_id, categoria_id, nombre, descripcion, codigo, stock_actual || 0, stock_minimo || 0, precio_unitario || 0, unidad_medida]
      );

      const materialId = materialResult.rows[0].id;

      // Guardar atributos dinámicos si existen
      const atributoKeys = Object.keys(req.body).filter(key => key.startsWith('atributo_'));
      
      for (const key of atributoKeys) {
        const atributoId = key.replace('atributo_', '');
        const valor = req.body[key];
        
        if (valor && valor.trim() !== '') {
          await db.query(
            'INSERT INTO valores_atributos_material (material_id, atributo_id, valor) VALUES ($1, $2, $3)',
            [materialId, atributoId, valor]
          );
        }
      }

      req.session.message = 'Material creado exitosamente';
      res.redirect('/inventario');
    } catch (error) {
      console.error('Error al crear material:', error);
      req.session.error = 'Error al crear material';
      res.redirect('/inventario/nuevo');
    }
  },

  // Ver detalle de material
  detalle: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      // Obtener material
      const material = await db.query(
        `SELECT m.*, c.nombre as categoria_nombre 
         FROM materiales m 
         LEFT JOIN categorias_materiales c ON m.categoria_id = c.id 
         WHERE m.id = $1 AND m.empresa_id = $2`,
        [id, user.empresa_id]
      );

      if (material.rows.length === 0) {
        return res.status(404).send('Material no encontrado');
      }

      // Obtener atributos dinámicos del material
      const atributos = await db.query(
        `SELECT va.*, ac.nombre as atributo_nombre, ac.tipo_dato 
         FROM valores_atributos_material va
         INNER JOIN atributos_categoria ac ON va.atributo_id = ac.id
         WHERE va.material_id = $1
         ORDER BY ac.orden`,
        [id]
      );

      // Obtener últimos movimientos
      const movimientos = await db.query(
        `SELECT m.*, u.nombre as usuario_nombre 
         FROM movimientos_inventario m 
         LEFT JOIN usuarios u ON m.usuario_id = u.id 
         WHERE m.material_id = $1 
         ORDER BY m.fecha_movimiento DESC 
         LIMIT 20`,
        [id]
      );

      res.render('inventario/detalle', {
        title: 'Detalle Material',
        material: material.rows[0],
        atributos: atributos.rows,
        movimientos: movimientos.rows
      });
    } catch (error) {
      console.error('Error al ver detalle:', error);
      res.redirect('/inventario');
    }
  },

  // Registrar movimiento
  registrarMovimiento: async (req, res) => {
    const { material_id, tipo_movimiento, cantidad, motivo } = req.body;
    const user = req.session.user;

    try {
      // Obtener stock actual
      const material = await db.query(
        'SELECT stock_actual FROM materiales WHERE id = $1 AND empresa_id = $2',
        [material_id, user.empresa_id]
      );

      if (material.rows.length === 0) {
        return res.status(404).json({ error: 'Material no encontrado' });
      }

      const stockAnterior = parseInt(material.rows[0].stock_actual);
      let stockNuevo = stockAnterior;

      // Calcular nuevo stock
      if (tipo_movimiento === 'entrada') {
        stockNuevo = stockAnterior + parseInt(cantidad);
      } else if (tipo_movimiento === 'salida') {
        stockNuevo = stockAnterior - parseInt(cantidad);
        if (stockNuevo < 0) {
          return res.status(400).json({ error: 'Stock insuficiente' });
        }
      } else if (tipo_movimiento === 'ajuste') {
        stockNuevo = parseInt(cantidad);
      }

      // Actualizar stock
      await db.query('UPDATE materiales SET stock_actual = $1 WHERE id = $2', [stockNuevo, material_id]);

      // Registrar movimiento
      await db.query(
        `INSERT INTO movimientos_inventario (material_id, usuario_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, motivo) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [material_id, user.id, tipo_movimiento, Math.abs(cantidad), stockAnterior, stockNuevo, motivo]
      );

      req.session.message = 'Movimiento registrado exitosamente';
      res.redirect(`/inventario/${material_id}`);
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      req.session.error = 'Error al registrar movimiento';
      res.redirect('/inventario');
    }
  },

  // Listar categorías
  categorias: async (req, res) => {
    try {
      const user = req.session.user;
      const result = await db.query(
        'SELECT * FROM categorias_materiales WHERE empresa_id = $1 ORDER BY nombre',
        [user.empresa_id]
      );

      res.render('inventario/categorias', { title: 'Categorías', categorias: result.rows });
    } catch (error) {
      console.error('Error al listar categorías:', error);
      res.render('inventario/categorias', { title: 'Categorías', categorias: [] });
    }
  },

  // Crear categoría
  crearCategoria: async (req, res) => {
    const { nombre, descripcion } = req.body;
    const user = req.session.user;

    try {
      await db.query(
        'INSERT INTO categorias_materiales (empresa_id, nombre, descripcion) VALUES ($1, $2, $3)',
        [user.empresa_id, nombre, descripcion]
      );

      req.session.message = 'Categoría creada exitosamente';
      res.redirect('/inventario/categorias');
    } catch (error) {
      console.error('Error al crear categoría:', error);
      req.session.error = 'Error al crear categoría';
      res.redirect('/inventario/categorias');
    }
  },

  // Mostrar atributos de una categoría
  atributosCategoria: async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    try {
      // Verificar que la categoría pertenece a la empresa
      const categoria = await db.query(
        'SELECT * FROM categorias_materiales WHERE id = $1 AND empresa_id = $2',
        [id, user.empresa_id]
      );

      if (categoria.rows.length === 0) {
        return res.status(404).send('Categoría no encontrada');
      }

      // Obtener atributos de la categoría
      const atributos = await db.query(
        'SELECT * FROM atributos_categoria WHERE categoria_id = $1 ORDER BY orden',
        [id]
      );

      res.render('inventario/atributos', {
        title: 'Atributos de Categoría',
        categoria: categoria.rows[0],
        atributos: atributos.rows
      });
    } catch (error) {
      console.error('Error al cargar atributos:', error);
      res.redirect('/inventario/categorias');
    }
  },

  // Crear atributo para categoría
  crearAtributo: async (req, res) => {
    const { categoria_id, nombre, tipo_dato, requerido, opciones } = req.body;
    const user = req.session.user;

    try {
      // Verificar que la categoría pertenece a la empresa
      const categoria = await db.query(
        'SELECT id FROM categorias_materiales WHERE id = $1 AND empresa_id = $2',
        [categoria_id, user.empresa_id]
      );

      if (categoria.rows.length === 0) {
        return res.status(403).send('No tienes permisos');
      }

      await db.query(
        'INSERT INTO atributos_categoria (categoria_id, nombre, tipo_dato, requerido, opciones) VALUES ($1, $2, $3, $4, $5)',
        [categoria_id, nombre, tipo_dato, requerido === 'on', opciones]
      );

      req.session.message = 'Atributo creado exitosamente';
      res.redirect(`/inventario/categorias/${categoria_id}/atributos`);
    } catch (error) {
      console.error('Error al crear atributo:', error);
      req.session.error = 'Error al crear atributo';
      res.redirect(`/inventario/categorias/${categoria_id}/atributos`);
    }
  }
};

module.exports = inventarioController;
