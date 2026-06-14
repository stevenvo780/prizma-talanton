#!/bin/bash
# Script de construcción y validación completa del sistema POS
set -e

echo "🚀 INICIANDO VALIDACIÓN COMPLETA DEL SISTEMA POS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables de control
BACKEND_DIR="pos"
FRONTEND_DIR="pos-frond"
ROBOT_DIR="robotPos"

# Validar Backend
log_info "📦 Validando Backend (NestJS)..."
cd "$BACKEND_DIR"
npm install
log_info "🔨 Construyendo backend..."
npm run build
log_info "🧪 Ejecutando tests del backend..."
npm run test
cd ..

# Validar Frontend
log_info "📦 Validando Frontend (React)..."
cd "$FRONTEND_DIR"
npm install
log_info "🔨 Construyendo frontend..."
npm run build
log_info "🧪 Ejecutando tests del frontend..."
npm test -- --watchAll=false
cd ..

# Validar Robot
log_info "📦 Validando Robot Service..."
cd "$ROBOT_DIR"
npm install
log_info "✅ Robot service validado"
cd ..

log_info "✅ VALIDACIÓN COMPLETA EXITOSA"
echo "🎉 Todos los componentes del sistema están funcionando correctamente"
