# Despliegue en Hostinger

## Requisitos Previos

- Acceso al panel de Hostinger (hPanel)
- Acceso FTP o File Manager de Hostinger
- Node.js instalado localmente

## Pasos de Despliegue

### 1. Construir la Aplicación

```bash
npm run build
```

Este comando generará la carpeta `dist/` con todos los archivos optimizados.

### 2. Subir Archivos a Hostinger

#### Opción A: File Manager (Recomendado)

1. Inicia sesión en tu hPanel de Hostinger
2. Ve a **Websites** → **Manage** → **File Manager**
3. Navega al directorio `public_html/` (o el subdirectorio deseado)
4. Elimina todos los archivos existentes (haz backup primero)
5. Sube el contenido de la carpeta `dist/` local

#### Opción B: FTP

1. Obtén tus credenciales FTP desde hPanel → **Files** → **FTP Accounts**
2. Usa FileZilla o similar:
   - Host: ftp.tudominio.com (o IP del servidor)
   - Usuario: tu_usuario_ftp
   - Contraseña: tu_contraseña
   - Puerto: 21
3. Navega a `public_html/`
4. Sube todo el contenido de `dist/`

### 3. Configurar Variables de Entorno (Si es necesario)

Las variables de entorno ya están compiladas en el build. Si necesitas cambiarlas:

1. Modifica `.env.production`
2. Reconstruye: `npm run build`
3. Vuelve a subir los archivos

### 4. Verificar Despliegue

- Visita tu dominio: `https://tudominio.com`
- Verifica que todas las rutas funcionen
- Comprueba la conexión con Supabase

## Configuración de Supabase

Asegúrate de agregar tu dominio de Hostinger en Supabase:

1. Ve a Supabase Dashboard → **Authentication** → **URL Configuration**
2. En **Site URL**, agrega: `https://tudominio.com`
3. En **Redirect URLs**, agrega: `https://tudominio.com/*`

## Solución de Problemas

### Error 404 en rutas de React Router

El archivo `.htaccess` ya está configurado en `public/.htaccess` y se copiará a `dist/` durante el build. Si tienes problemas:

1. Verifica que `.htaccess` exista en `dist/`
2. Asegúrate de que mod_rewrite esté habilitado en Hostinger

### Variables de entorno no funcionan

En Vite, las variables deben comenzar con `VITE_`. Ya están configuradas correctamente en el proyecto.

### Problemas de CORS con Supabase

Verifica en Supabase:

- **Settings** → **API** → **RESTRICCIÓN DE IP** debe permitir tu servidor
- **Authentication** → **URL Configuration** debe incluir tu dominio

## Scripts Útiles

```bash
# Construir para producción
npm run build

# Verificar tipos antes de desplegar
npm run typecheck

# Lint antes de desplegar
npm run lint

# Vista previa local del build
npm run preview
```

## Estructura de Archivos en Hostinger

```
public_html/
├── .htaccess
├── index.html
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── ...
└── ...otros archivos estáticos
```

## Contacto y Soporte

- Hostinger Support: https://www.hostinger.com/support
- Documentación Vite: https://vitejs.dev/guide/static-deploy.html
