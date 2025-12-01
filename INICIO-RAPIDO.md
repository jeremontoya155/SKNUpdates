# 🚀 INICIO RÁPIDO - 3 Pasos

## ⚡ Para Demostrar AHORA (el servidor ya está corriendo)

### Paso 1: Abrir en el navegador
```
http://localhost:3000/auth/login
```

### Paso 2: Login como Usuario de Empresa
```
Email:    juan@techsolutions.com.ar
Password: demo123
```

### Paso 3: ¡Explorar!
- **Dashboard**: Ver contadores "Tickets en Curso: 3" y "Tickets Resueltos: 2"
- **Tickets**: Ver los 5 tickets con diferentes estados
- **Inventario**: Ver los 3 PCs (1 con stock bajo)
- **Crear Nuevo Ticket**: Probar la funcionalidad

---

## 🔄 Si el servidor NO está corriendo

```bash
node server.js
```

Luego ir a: http://localhost:3000

---

## 👨‍💼 Para ver como Administrador SKN

**Cerrar sesión** (botón 🚪 arriba a la derecha)

Luego login con:
```
Email:    admin@skn.com
Password: admin123
```

**Diferencias que verás**:
- Dashboard con estadísticas GLOBALES
- Menú "Empresas" visible
- En Tickets: columna "Empresa"
- Al abrir un ticket: botones para Asignar y Cambiar Estado

---

## 📊 Lo que verás en el Dashboard de Juan López

```
┌─────────────────────────────────────────────────────┐
│              📊 DASHBOARD                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📦 Materiales: 3        ⚠️ Stock Bajo: 1          │
│  🔄 Tickets en Curso: 3  ✅ Tickets Resueltos: 2   │
│  📅 Visitas Programadas: 1                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Flujo de Demostración Sugerido (5 min)

1. **Login** como Juan López
2. **Dashboard** → Señalar "Tickets en Curso" y "Tickets Resueltos"
3. **Tickets** → Mostrar los 5 tickets con badges de color
4. **Abrir Ticket #1** (Urgente) → Mostrar que NO puede cambiar estado
5. **Crear Nuevo Ticket** → Completar y crear
6. **Logout** y **Login como admin@skn.com**
7. **Tickets** → Mostrar columna "Empresa" y más opciones
8. **Abrir el ticket nuevo** → Asignarse y cambiar a "En Proceso"
9. **Cambiar a "Cerrado"**
10. **Logout** y **Login como Juan López otra vez**
11. **Dashboard** → Verificar que "Tickets Resueltos" ahora dice: 3

---

## ✅ Checklist Rápido

- [ ] Servidor corriendo en http://localhost:3000
- [ ] Login como juan@techsolutions.com.ar funciona
- [ ] Dashboard muestra 5 tarjetas
- [ ] "Tickets en Curso: 3" visible
- [ ] "Tickets Resueltos: 2" visible
- [ ] Listado de tickets muestra 5 tickets
- [ ] Crear ticket funciona
- [ ] Login como admin@skn.com funciona
- [ ] Menú "Empresas" visible para admin
- [ ] Puede asignar y cambiar estados de tickets

---

## 🆘 Si algo no funciona

### Problema: No carga la página
**Solución**: Verificar que el servidor esté corriendo
```bash
node server.js
```

### Problema: No puede hacer login
**Solución**: Verificar credenciales:
- juan@techsolutions.com.ar / demo123
- admin@skn.com / admin123

### Problema: No hay datos de ejemplo
**Solución**: Ejecutar script de carga
```bash
node cargar-datos-ejemplo.js
```

### Problema: Error de base de datos
**Solución**: Verificar .env tiene DATABASE_URL correcto

---

## 📱 URLs Importantes

- **Login**: http://localhost:3000/auth/login
- **Dashboard**: http://localhost:3000/dashboard
- **Tickets**: http://localhost:3000/tickets
- **Inventario**: http://localhost:3000/inventario
- **Empresas** (solo SKN): http://localhost:3000/empresas

---

## 🎨 Colores de Estados (para reconocer)

- **⏳ Abierto** = Badge Naranja
- **🔄 En Proceso** = Badge Azul
- **✅ Cerrado** = Badge Verde
- **⛔ Cancelado** = Badge Gris

---

## 📞 Credenciales Completas

```
═══════════════════════════════════════════════
         USUARIOS DE PRUEBA
═══════════════════════════════════════════════

👨‍💼 ADMINISTRADOR SKN:
   Email:    admin@skn.com
   Password: admin123
   Empresa:  SKN (ID: 1)
   Rol:      skn_admin

👤 USUARIO EMPRESA:
   Email:    juan@techsolutions.com.ar
   Password: demo123
   Empresa:  TechSolutions (ID: 3 o 4)
   Rol:      empresa_user

═══════════════════════════════════════════════
```

---

## 🎉 ¡LISTO PARA DEMOSTRAR!

Todo funciona. Solo abre el navegador y empieza a explorar.

**URL de inicio**: http://localhost:3000/auth/login
