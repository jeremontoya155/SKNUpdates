# 🔍 Sistema de Filtros y Búsqueda

## Filtros Implementados por Módulo

### 📋 1. TICKETS (`/tickets`)

**Filtros disponibles:**
- 🔍 **Búsqueda por texto**: Busca en título y descripción del ticket
- 📊 **Estado**: Abierto, En Proceso, Cerrado, Cancelado
- 🎯 **Prioridad**: Baja, Media, Alta, Urgente
- 🏢 **Empresa** (solo para usuarios SKN): Filtrar por empresa específica
- 📅 **Fecha desde**: Tickets desde una fecha específica
- 📅 **Fecha hasta**: Tickets hasta una fecha específica

**Cómo usar:**
1. Ingresa a `/tickets`
2. Usa el formulario de filtros arriba de la tabla
3. Combina múltiples filtros para búsquedas más precisas
4. Haz clic en "Limpiar" para resetear todos los filtros

**Ejemplos de uso:**
- Ver solo tickets urgentes abiertos: Estado = "Abierto" + Prioridad = "Urgente"
- Buscar tickets de un cliente: Buscar = "nombre del cliente"
- Ver tickets del último mes: Fecha desde = hace 30 días
- Tickets cerrados de TechSolutions: Empresa = "TechSolutions" + Estado = "Cerrado"

---

### 👥 2. VISITAS (`/visitas`)

**Filtros disponibles:**
- 🔍 **Búsqueda por texto**: Busca en nombre del visitante y empresa
- 📊 **Estado**: Pendiente, En Curso, Finalizada, Cancelada
- 📅 **Fecha desde**: Visitas desde una fecha específica
- 📅 **Fecha hasta**: Visitas hasta una fecha específica

**Cómo usar:**
1. Ingresa a `/visitas`
2. Usa el formulario de filtros arriba de la tabla
3. Haz clic en "Buscar" para aplicar
4. Haz clic en "Limpiar" para resetear

**Ejemplos de uso:**
- Ver visitas de hoy: Fecha desde = hoy + Fecha hasta = hoy
- Buscar visitas de una empresa: Buscar = "nombre empresa"
- Visitas pendientes del mes: Estado = "Pendiente" + Fecha desde = inicio mes

---

### 🖨️ 3. CONTADORES DE IMPRESORAS (`/contadores`)

**Filtros disponibles:**
- 🔍 **Búsqueda por texto**: Busca en nombre de impresora, marca y modelo
- 🏢 **Empresa** (solo para usuarios SKN): Filtrar por empresa específica
- 📅 **Fecha desde**: Lecturas desde una fecha específica
- 📅 **Fecha hasta**: Lecturas hasta una fecha específica

**Cómo usar:**
1. Ingresa a `/contadores`
2. Usa el formulario de filtros arriba de la tabla
3. Combina filtros para encontrar lecturas específicas
4. Haz clic en "Limpiar" para resetear

**Ejemplos de uso:**
- Ver contadores de una impresora: Buscar = "HP LaserJet"
- Lecturas del último trimestre: Fecha desde = hace 3 meses
- Contadores de una empresa (SKN): Empresa = "TechSolutions"

---

### 📦 4. INVENTARIO (`/inventario`)

**Filtros existentes (ya implementados):**
- 🔍 **Búsqueda por texto**: Busca en nombre o código
- 📁 **Categoría**: Filtrar por categoría de material
- 🏢 **Empresa** (solo para usuarios SKN): Filtrar por empresa
- 📊 **Stock**: Stock bajo, Agotado

---

## 💡 Características Generales

### ✨ Funcionalidades:
- **Filtros combinables**: Puedes usar múltiples filtros a la vez
- **Búsqueda en tiempo real**: Los filtros se aplican al hacer clic en "Buscar"
- **Limpieza rápida**: Botón "Limpiar" resetea todos los filtros
- **Preservación de filtros**: Los filtros seleccionados se mantienen después de aplicarlos
- **Rangos de fechas**: Busca datos entre dos fechas específicas

### 🎯 Permisos:
- **Usuarios SKN**: Ven todos los datos y pueden filtrar por empresa
- **Usuarios Empresa**: Solo ven datos de su propia empresa
- Los filtros respetan automáticamente estos permisos

### 📱 Responsive:
- Los formularios de filtros se adaptan a diferentes tamaños de pantalla
- En móviles, los campos se apilan verticalmente

---

## 🚀 Próximas Mejoras Sugeridas

1. **Exportar resultados filtrados**: Descargar CSV/Excel con los datos filtrados
2. **Guardar filtros favoritos**: Guardar combinaciones de filtros frecuentes
3. **Filtros avanzados**: Operadores AND/OR para búsquedas complejas
4. **Autocompletado**: Sugerencias mientras escribes en búsqueda
5. **Estadísticas de filtros**: Mostrar cantidad de resultados encontrados

---

## 📝 Notas para Desarrolladores

### Estructura de filtros en controladores:
```javascript
const { buscar, estado, fecha_desde, fecha_hasta } = req.query;

// Construir query dinámicamente
let query = "SELECT * FROM tabla WHERE 1=1";
const params = [];
let paramIndex = 1;

if (buscar) {
  query += ` AND LOWER(columna) LIKE LOWER($${paramIndex})`;
  params.push(`%${buscar}%`);
  paramIndex++;
}

// ... más filtros

const result = await db.query(query, params);
```

### Pasar filtros a la vista:
```javascript
res.render('vista', {
  datos: result.rows,
  filtros: { buscar, estado, fecha_desde, fecha_hasta }
});
```

### Preservar valores en formularios:
```html
<input name="buscar" value="<%= filtros?.buscar || '' %>">
<select name="estado">
  <option value="abierto" <%= filtros?.estado === 'abierto' ? 'selected' : '' %>>
```
