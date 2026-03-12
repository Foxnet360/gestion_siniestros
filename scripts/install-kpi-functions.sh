#!/bin/bash
# ============================================================
# Script de instalación de funciones SQL optimizadas
# ============================================================
# Uso: ./scripts/install-kpi-functions.sh
# Requiere: Supabase CLI instalado o acceso al SQL Editor
# ============================================================

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  INSTALACIÓN DE FUNCIONES SQL OPTIMIZADAS PARA KPIs"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar variables de entorno
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Faltan variables de entorno"
    echo ""
    echo "Asegúrate de tener en .env:"
    echo "  VITE_SUPABASE_URL=https://..."
    echo "  SUPABASE_SERVICE_ROLE_KEY=eyJ..."
    exit 1
fi

echo "✅ Variables de entorno encontradas"
echo ""

# Verificar Supabase CLI
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI encontrado"
    USE_CLI=true
else
    echo "⚠️  Supabase CLI no encontrado"
    echo ""
    echo "Para instalar: npm install -g supabase"
    echo ""
    USE_CLI=false
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  MÉTODO DE INSTALACIÓN"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$USE_CLI" = true ]; then
    echo "Opción 1: Usar Supabase CLI (Automático)"
    echo "Opción 2: Usar SQL Editor (Manual)"
    echo ""
    read -p "Selecciona opción (1 o 2): " choice
    
    if [ "$choice" = "1" ]; then
        echo ""
        echo "Ejecutando migración con Supabase CLI..."
        supabase db execute --file migrations/008_optimize_kpi_queries.sql
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Migración ejecutada exitosamente"
        else
            echo ""
            echo "❌ Error al ejecutar migración"
            echo "Intentando con SQL Editor manual..."
            choice="2"
        fi
    fi
fi

if [ "$USE_CLI" = false ] || [ "$choice" = "2" ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  INSTRUCCIONES PARA SQL EDITOR"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "1. Abre el SQL Editor:"
    echo "   https://supabase.com/dashboard/project/_/sql/new"
    echo ""
    echo "2. Copia el contenido de:"
    echo "   migrations/008_optimize_kpi_queries.sql"
    echo ""
    echo "3. Pega en el SQL Editor y ejecuta (Ctrl+Enter)"
    echo ""
    echo "4. Verifica que los tests al final muestren resultados"
    echo ""
    
    # Abrir archivo en editor (si es posible)
    if command -v code &> /dev/null; then
        read -p "¿Abrir archivo en VS Code? (s/n): " open_file
        if [ "$open_file" = "s" ] || [ "$open_file" = "S" ]; then
            code migrations/008_optimize_kpi_queries.sql
        fi
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  VERIFICACIÓN POST-INSTALACIÓN"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "Una vez ejecutado el SQL, verifica con:"
echo ""
echo "  npx ts-node scripts/verify-kpi-function.ts"
echo ""
echo "O ejecuta directamente en SQL Editor:"
echo "  SELECT get_kpi_overview_v2();"
echo ""
