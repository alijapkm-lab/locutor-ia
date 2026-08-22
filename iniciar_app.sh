#!/usr/bin/env bash

echo "======================================================="
echo "    ESTUDIO DE LOCUCIÓN Y NARRACIÓN CON IA PROFESIONAL"
echo "======================================================="
echo ""

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] No se encontró Node.js en tu sistema."
    echo "Por favor instala Node.js (versión 18 o superior) desde https://nodejs.org/"
    exit 1
fi

# 2. Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "[1/3] Instalando dependencias por primera vez..."
    npm install
fi

# 3. Compilar aplicación si no existe el bundle
if [ ! -f "dist/server.cjs" ]; then
    echo "[2/3] Compilando la aplicación..."
    npm run build
fi

# 4. Iniciar y abrir navegador
echo "[3/3] Iniciando el servidor en http://localhost:3000..."
echo "Abre tu navegador en: http://localhost:3000"
echo "Presiona Ctrl+C para detener."

if which xdg-open > /dev/null; then
  xdg-open http://localhost:3000 &
elif which open > /dev/null; then
  open http://localhost:3000 &
fi

npm start
