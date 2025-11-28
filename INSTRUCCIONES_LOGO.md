# Instrucciones para Agregar el Logo

## Ubicación del Logo

El sistema está configurado para mostrar el logo de la empresa en varias ubicaciones:

1. **Header** (navegación principal)
2. **Páginas de Login y Registro**

## Pasos para Agregar el Logo

### 1. Preparar el Archivo del Logo

- **Nombre del archivo**: `logo.png`
- **Formato recomendado**: PNG con fondo transparente
- **Dimensiones recomendadas**: 
  - Ancho: 150-200px
  - Alto: 40-60px
  - Relación de aspecto: aproximadamente 3:1 o 4:1

### 2. Colocar el Archivo

Copie su archivo `logo.png` en la siguiente carpeta:

```
skn stock/
└── public/
    └── images/
        └── logo.png  ← Coloque su logo aquí
```

### 3. Reiniciar el Servidor

Si el servidor ya está corriendo, reinícielo para que cargue el nuevo logo:

```bash
# Presione Ctrl+C para detener el servidor
# Luego ejecute:
npm start
```

## Verificación

El logo debe aparecer en:

- ✅ Barra de navegación superior (todas las páginas después de login)
- ✅ Página de inicio de sesión
- ✅ Página de registro

## Personalización Adicional

Si desea ajustar el tamaño del logo, puede modificar el archivo CSS:

**Para el header**: `public/css/header.css`
```css
.logo-img {
  max-height: 50px;  /* Ajuste este valor */
  width: auto;
}
```

**Para las páginas de autenticación**: `public/css/auth.css`
```css
.auth-logo img {
  max-width: 200px;  /* Ajuste este valor */
  height: auto;
}
```

## Colores del Sistema

El sistema utiliza la siguiente paleta de colores para coordinar con su marca:

- **Naranja Principal**: #E85D04
- **Naranja Oscuro**: #DC2F02
- **Negro**: #1A1A1A
- **Blanco**: #FFFFFF

Estos colores están definidos en `public/css/variables.css` y pueden ser ajustados según su identidad corporativa.

## Notas Importantes

- Si el logo no aparece después de colocarlo, verifique que el nombre del archivo sea exactamente `logo.png` (minúsculas)
- El navegador puede tener el logo en caché; presione Ctrl+F5 para recargar completamente
- Si su logo tiene colores diferentes, considere ajustar los colores del sistema en `variables.css` para mejor coordinación visual
