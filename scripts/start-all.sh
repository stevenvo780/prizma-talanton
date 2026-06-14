#!/bin/bash
# Script para iniciar todos los servicios del sistema POS en desarrollo
set -e

echo "🚀 INICIANDO TODOS LOS SERVICIOS DEL SISTEMA POS..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_service() {
    echo -e "${BLUE}[SERVICE]${NC} $1"
}

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    log_warn "🛑 Deteniendo todos los servicios..."
    kill 0
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

# Iniciar Backend (NestJS) en puerto 3000
log_service "🔧 Iniciando Backend (NestJS) en puerto 3000..."
cd pos
npm run start:dev &
BACKEND_PID=$!
cd ..

# Esperar un poco para que el backend inicie
sleep 3

# Iniciar Frontend (React) en puerto 4002
log_service "🎨 Iniciando Frontend (React) en puerto 4002..."
cd pos-frond
PORT=4002 npm start &
FRONTEND_PID=$!
cd ..

# Esperar un poco para que el frontend inicie
sleep 3

# Iniciar Robot Service en puerto 3005
log_service "🤖 Iniciando Robot Service en puerto 3005..."
cd robotPos
node index.js &
ROBOT_PID=$!
cd ..

# Mostrar información de servicios
echo ""
log_info "✅ TODOS LOS SERVICIOS INICIADOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Backend (NestJS):    http://localhost:3000"
echo "🎨 Frontend (React):    http://localhost:4002"
echo "🤖 Robot Service:       http://localhost:3005"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "📝 Presiona Ctrl+C para detener todos los servicios"

# Esperar indefinidamente
wait
