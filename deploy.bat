@echo off
chcp 65001 >nul
REM ============================================================================
REM SGS Deployment Script for Windows
REM ============================================================================
REM Uso: deploy.bat [servidor] [ruta_destino]
REM Ejemplo: deploy.bat 192.168.1.100 C:\inetpub\wwwroot\sgs
REM ============================================================================

echo ============================================
echo   SGS - Script de Despliegue (Windows)
echo ============================================
echo.

set "DIST_DIR=.\dist"
set "SERVER=%~1"
set "REMOTE_PATH=%~2"

if "%~1"=="" (
    echo ❌ Error: Debes especificar el servidor
    echo.
    echo Uso: deploy.bat [servidor] [ruta_destino]
    echo Ejemplo: deploy.bat 192.168.1.100 C:\inetpub\wwwroot\sgs
    exit /b 1
)

if "%~2"=="" (
    echo ❌ Error: Debes especificar la ruta destino
    echo.
    echo Uso: deploy.bat [servidor] [ruta_destino]
    echo Ejemplo: deploy.bat 192.168.1.100 C:\inetpub\wwwroot\sgs
    exit /b 1
)

REM Verificar que existe el build
if not exist "%DIST_DIR%\" (
    echo ❌ Error: No se encontró la carpeta %DIST_DIR%\
    echo 💡 Ejecuta primero: npm run build
    exit /b 1
)

echo ✅ Build encontrado en: %DIST_DIR%\
echo 📤 Desplegando a: %SERVER%:%REMOTE_PATH%
echo.

REM Verificar si tenemos acceso a PowerShell
powershell -Command "Get-Command" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: PowerShell no está disponible
    exit /b 1
)

echo 🔄 Copiando archivos via PowerShell...
powershell -Command "
    $server = '%SERVER%';
    $remotePath = '%REMOTE_PATH%';
    $distDir = '%DIST_DIR%';
    
    try {
        # Crear sesión remota si es posible
        $session = New-PSSession -ComputerName $server -ErrorAction SilentlyContinue;
        
        if ($session) {
            Write-Host '✅ Conexión remota establecida';
            # Copiar archivos
            Copy-Item -Path (Join-Path $distDir '*') -Destination $remotePath -Recurse -Force -ToSession $session;
            Remove-PSSession $session;
            Write-Host '✅ Archivos copiados exitosamente';
        } else {
            Write-Host '⚠️  No se pudo establecer sesión remota. Intentando xcopy...';
            $source = Join-Path $distDir '*';
            $dest = "\\$server\$(($remotePath -replace ':', '$'))";
            xcopy /E /I /Y "$source" "$dest";
        }
    } catch {
        Write-Host ('❌ Error: ' + $_.Exception.Message);
        exit 1;
    }
"

if %errorlevel% neq 0 (
    echo ❌ Error en el despliegue
    exit /b 1
)

echo.
echo ============================================
echo 🎉 Despliegue finalizado!
echo ============================================
echo.
echo 💡 Si el despliegue falló, considera usar:
echo    - FTP manual con FileZilla
echo    - Compartir carpeta de red
echo    - Robocopy: robocopy .\dist \\servidor\carpeta /MIR

pause
