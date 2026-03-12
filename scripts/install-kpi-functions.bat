@echo off
chcp 65001 > nul
REM ============================================================
REM Script de instalación de funciones SQL optimizadas (Windows)
REM ============================================================
REM Uso: .\scripts\install-kpi-functions.bat
REM ============================================================

echo.
echo ═══════════════════════════════════════════════════════════
echo   INSTALACIÓN DE FUNCIONES SQL OPTIMIZADAS PARA KPIs
echo ═══════════════════════════════════════════════════════════
echo.

REM Verificar variables de entorno
if "%VITE_SUPABASE_URL%"=="" (
    echo ❌ Error: Falta VITE_SUPABASE_URL
    echo.
    echo Asegúrate de tener configuradas las variables en .env
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ❌ Error: Falta SUPABASE_SERVICE_ROLE_KEY
    echo.
    echo Asegúrate de tener configuradas las variables en .env
    exit /b 1
)

echo ✅ Variables de entorno encontradas
echo.

REM Verificar Supabase CLI
where supabase > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Supabase CLI encontrado
    set USE_CLI=true
) else (
    echo ⚠️  Supabase CLI no encontrado
    echo.
    echo Para instalar: npm install -g supabase
    echo.
    set USE_CLI=false
)

echo.
echo ═══════════════════════════════════════════════════════════
echo   INSTRUCCIONES DE INSTALACIÓN
echo ═══════════════════════════════════════════════════════════
echo.

if "%USE_CLI%"=="true" (
    echo Opción 1: Usar Supabase CLI (Automático)
    echo Opción 2: Usar SQL Editor (Manual)
    echo.
    set /p choice="Selecciona opción (1 o 2): "
    
    if "%choice%"=="1" (
        echo.
        echo Ejecutando migración con Supabase CLI...
        supabase db execute --file migrations/008_optimize_kpi_queries.sql
        
        if %errorlevel% == 0 (
            echo.
            echo ✅ Migración ejecutada exitosamente
        ) else (
            echo.
            echo ❌ Error al ejecutar migración
            echo Intentando con SQL Editor manual...
            set choice=2
        )
    )
)

if "%USE_CLI%"=="false" (
    set choice=2
)

if "%choice%"=="2" (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo   INSTRUCCIONES PARA SQL EDITOR
echo ═══════════════════════════════════════════════════════════
    echo.
    echo 1. Abre el SQL Editor:
    echo    https://supabase.com/dashboard/project/_/sql/new
    echo.
    echo 2. Copia el contenido de:
    echo    migrations/008_optimize_kpi_queries.sql
    echo.
    echo 3. Pega en el SQL Editor y ejecuta (Ctrl+Enter)
    echo.
    echo 4. Verifica que los tests al final muestren resultados
    echo.
    
    REM Abrir archivo en VS Code si está disponible
    where code > nul 2>&1
    if %errorlevel% == 0 (
        set /p open_file="¿Abrir archivo en VS Code? (s/n): "
        if "%open_file%"=="s" (
            code migrations/008_optimize_kpi_queries.sql
        )
    )
)

echo.
echo ═══════════════════════════════════════════════════════════
echo   VERIFICACIÓN POST-INSTALACIÓN
echo ═══════════════════════════════════════════════════════════
echo.
echo Una vez ejecutado el SQL, verifica con:
echo.
echo   npx ts-node scripts/verify-kpi-functions.ts
echo.
echo O ejecuta directamente en SQL Editor:
echo   SELECT get_kpi_overview_v2();
echo.

pause
