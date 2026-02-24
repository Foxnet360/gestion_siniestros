# SGS Deployment - Hostinger

## Opción 1: Despliegue Manual (Recomendado)

### Paso 1: Preparar archivos

El build ya está listo en la carpeta `dist/`

### Paso 2: Subir a Hostinger

**Método A - FTP (FileZilla):**

1. Abre FileZilla
2. Conecta a tu servidor Hostinger:
   - Host: `ftp.tudominio.com` o IP del servidor
   - Usuario: tu usuario de Hostinger
   - Contraseña: tu contraseña
   - Puerto: 21 (FTP) o 22 (SFTP)
3. Navega a `public_html/` (o subcarpeta si es necesario)
4. **Elimina** todo el contenido anterior (backup primero)
5. Sube TODO el contenido de `dist/` (arrastra y suelta)

**Método B - File Manager de Hostinger:**

1. Entra a tu panel de Hostinger (hPanel)
2. Ve a "Archivos" → "Administrador de Archivos"
3. Navega a `public_html/`
4. Elimina archivos antiguos
5. Sube el archivo `dist.zip` (comprime la carpeta dist primero)
6. Extrae el ZIP

**Método C - Git (si tienes Git en Hostinger):**

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
npm install
npm run build
cp -r dist/* ~/public_html/
```

### Paso 3: Configurar .htaccess (IMPORTANTE)

El archivo `.htaccess` ya está creado en `dist/`. Asegúrate de que se subió.

Si no está, crea uno en `public_html/` con este contenido:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Cache control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

## Opción 2: Script de Despliegue Automático

Usa el script incluido:

```bash
# En Windows (con PowerShell):
./deploy-hostinger.ps1 -Server "ftp.tudominio.com" -User "tu_usuario"

# O manual con lftp (si lo tienes instalado):
lftp -u usuario,contraseña ftp.tudominio.com -e "mirror -R --delete --verbose ./dist /public_html; quit"
```

## Configuración de Variables de Entorno

Asegúrate de configurar estas variables en tu panel de Hostinger:

1. Ve a "Avanzado" → "Variables de entorno" (o crea un archivo `.env`)
2. Configura:
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_key_de_supabase
   ```

**Nota:** Las variables deben configurarse ANTES de hacer el build, o hardcodearlas en el código (no recomendado para producción).

## Verificación Post-Despliegue

1. Abre tu dominio en el navegador
2. Verifica que:
   - ✅ La página carga sin errores 404
   - ✅ La navegación funciona (rutas como /claims)
   - ✅ Conexión a Supabase funciona
   - ✅ Filtros y búsqueda funcionan

## Solución de Problemas

### Error 404 en rutas:

Verifica que `.htaccess` está en `public_html/`

### Error 500:

Verifica permisos de archivos (deben ser 644) y carpetas (755)

### Variables de entorno no funcionan:

Hostinger compartido no soporta variables de entorno en tiempo de ejecución para SPAs. Debes:

- Hardcodear las URLs en el build (no seguro)
- O usar un backend proxy
- O usar Hostinger VPS en lugar de compartido

## Estructura final en Hostinger:

```
public_html/
├── .htaccess          ← Importante para SPA
├── index.html         ← Punto de entrada
├── assets/
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
└── ...otros archivos
```
