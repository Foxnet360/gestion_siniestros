#!/bin/bash

# ============================================================================
# SGS Deployment Script
# ============================================================================
# Uso: ./deploy.sh [usuario@servidor] [ruta_destino]
# Ejemplo: ./deploy.sh admin@192.168.1.100 /var/www/sgs
# ============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración por defecto
DEFAULT_SERVER="user@your-server.com"
DEFAULT_PATH="/var/www/sgs"
DIST_DIR="./dist"

# Obtener parámetros
SERVER=${1:-$DEFAULT_SERVER}
REMOTE_PATH=${2:-$DEFAULT_PATH}

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  SGS - Script de Despliegue${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Verificar que existe el build
if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}❌ Error: No se encontró la carpeta $DIST_DIR/${NC}"
    echo -e "${YELLOW}💡 Ejecuta primero: npm run build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build encontrado en: $DIST_DIR/${NC}"
echo -e "${BLUE}📤 Desplegando a: $SERVER:$REMOTE_PATH${NC}"
echo ""

# Método 1: rsync (recomendado si está disponible)
if command -v rsync &> /dev/null; then
    echo -e "${YELLOW}🔄 Usando rsync...${NC}"
    rsync -avz --delete --progress \
        --exclude='.git' \
        --exclude='node_modules' \
        "$DIST_DIR/" "$SERVER:$REMOTE_PATH/"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
        echo -e "${BLUE}🌐 Aplicación disponible en tu servidor${NC}"
    else
        echo -e "${RED}❌ Error en el despliegue${NC}"
        exit 1
    fi

# Método 2: scp (alternativa)
elif command -v scp &> /dev/null; then
    echo -e "${YELLOW}🔄 Usando scp...${NC}"
    echo -e "${YELLOW}⚠️  Nota: scp no elimina archivos antiguos automáticamente${NC}"
    
    # Crear backup en el servidor
    echo -e "${BLUE}📦 Creando backup en servidor...${NC}"
    ssh "$SERVER" "cd $REMOTE_PATH && tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz . --exclude='backup_*.tar.gz' 2>/dev/null || true"
    
    # Copiar archivos
    scp -r "$DIST_DIR/"* "$SERVER:$REMOTE_PATH/"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Despliegue completado!${NC}"
        echo -e "${YELLOW}⚠️  Recuerda eliminar archivos antiguos manualmente si es necesario${NC}"
    else
        echo -e "${RED}❌ Error en el despliegue${NC}"
        exit 1
    fi

else
    echo -e "${RED}❌ Error: No se encontró rsync ni scp${NC}"
    echo -e "${YELLOW}💡 Instala una de estas herramientas o usa FTP manualmente${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}🎉 Despliegue finalizado!${NC}"
echo -e "${BLUE}============================================${NC}"
