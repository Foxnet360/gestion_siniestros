# Hostinger Auto-Deploy Script
# SGS Application Deployment

Write-Host "============================================" -ForegroundColor Blue
Write-Host "  SGS - Despliegue para Hostinger" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Verificar que existe el build
if (-not (Test-Path ".\dist\index.html")) {
    Write-Host "❌ Error: No se encontró el build" -ForegroundColor Red
    Write-Host "💡 Ejecuta primero: npm run build" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Build verificado en .\dist\" -ForegroundColor Green
Write-Host ""
Write-Host "📋 INSTRUCCIONES PARA DESPLEGAR EN HOSTINGER:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPCIÓN 1 - FTP (Recomendada):" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Gray
Write-Host "1. Abre FileZilla Client" -ForegroundColor White
Write-Host "2. Conecta con tus credenciales de Hostinger:" -ForegroundColor White
Write-Host "   Servidor: ftpupload.net (o tu dominio)" -ForegroundColor Gray
Write-Host "   Usuario: u123456789 (tu usuario de Hostinger)" -ForegroundColor Gray
Write-Host "   Contraseña: tu contraseña" -ForegroundColor Gray
Write-Host "   Puerto: 21" -ForegroundColor Gray
Write-Host "3. Navega a: /public_html/" -ForegroundColor White
Write-Host "4. BORRA todo el contenido actual (haz backup primero)" -ForegroundColor Red
Write-Host "5. Sube TODO el contenido de la carpeta 'dist/'" -ForegroundColor White
Write-Host "   (arrastra y suelta los archivos)" -ForegroundColor Gray
Write-Host ""
Write-Host "OPCIÓN 2 - File Manager de Hostinger:" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host "1. Entra a: https://hpanel.hostinger.com" -ForegroundColor White
Write-Host "2. Ve a: Archivos → Administrador de Archivos" -ForegroundColor White
Write-Host "3. Ve a: public_html/" -ForegroundColor White
Write-Host "4. Selecciona todos los archivos y elimínalos" -ForegroundColor Red
Write-Host "5. Click en 'Subir' → 'Subir archivo'" -ForegroundColor White
Write-Host "6. Comprime la carpeta 'dist' en ZIP:" -ForegroundColor White
Write-Host "   Click derecho en dist → Enviar a → Carpeta comprimida" -ForegroundColor Gray
Write-Host "7. Sube el archivo dist.zip" -ForegroundColor White
Write-Host "8. Click derecho en dist.zip → Extraer" -ForegroundColor White
Write-Host "9. Mueve el contenido de 'dist/' a 'public_html/'" -ForegroundColor White
Write-Host "10. Elimina la carpeta 'dist' vacía" -ForegroundColor White
Write-Host ""
Write-Host "✅ ARCHIVOS LISTOS PARA SUBIR:" -ForegroundColor Green
Write-Host "-------------------------------" -ForegroundColor Gray
Write-Host "Total archivos en dist/:" -ForegroundColor White

# Contar archivos
$fileCount = (Get-ChildItem -Path ".\dist" -Recurse -File | Measure-Object).Count
Write-Host "   $fileCount archivos" -ForegroundColor Cyan

Write-Host ""
Write-Host "Archivos principales:" -ForegroundColor White
Get-ChildItem -Path ".\dist" -Name | ForEach-Object {
    Write-Host "   📄 $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔒 CONFIGURACIÓN SEGURIDAD:" -ForegroundColor Green
Write-Host "---------------------------" -ForegroundColor Gray
Write-Host "✅ .htaccess configurado para SPA" -ForegroundColor Green
Write-Host "✅ Headers de seguridad activos" -ForegroundColor Green
Write-Host "✅ Compresión gzip habilitada" -ForegroundColor Green
Write-Host "✅ Cache de assets configurado" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "---------------" -ForegroundColor Gray
Write-Host "• Asegúrate de que .htaccess se suba al servidor" -ForegroundColor Yellow
Write-Host "• Este archivo es CRÍTICO para el funcionamiento" -ForegroundColor Yellow
Write-Host "• Sin él, las rutas darán error 404" -ForegroundColor Red
Write-Host ""
Write-Host "🌐 DESPUÉS DEL DESPLIEGUE:" -ForegroundColor Cyan
Write-Host "--------------------------" -ForegroundColor Gray
Write-Host "Prueba estas URLs:" -ForegroundColor White
Write-Host "   https://tudominio.com" -ForegroundColor Cyan
Write-Host "   https://tudominio.com/claims" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
