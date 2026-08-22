@echo off
title Iniciar Estudio de Locucion con IA
echo =======================================================
echo     ESTUDIO DE LOCUCION Y NARRACION CON IA PROFESIONAL
echo =======================================================
echo.

:: 1. Verificar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro Node.js en tu sistema.
    echo Por favor descarga e instala Node.js (version 18 o superior) desde:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Instalar dependencias si no existen
if not exist "node_modules\" (
    echo [1/3] Instalando dependencias necesarias por primera vez...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Ocurrio un error al instalar las dependencias.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencias listas.
)

:: 3. Compilar la aplicacion si no esta compilada
if not exist "dist\server.cjs" (
    echo [2/3] Compilando la aplicacion web y el motor de sonido...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Ocurrio un error durante la compilacion.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Archivos de compilacion verificados.
)

:: 4. Iniciar la aplicacion
echo [3/3] Iniciando el servidor local en http://localhost:3000...
echo.
echo =======================================================
echo  La aplicacion esta lista. Abriendo en tu navegador...
echo  Para cerrar el servidor, presiona Ctrl + C en esta ventana.
echo =======================================================
echo.

:: Abrir navegador automaticamente
start http://localhost:3000

:: Ejecutar la aplicacion
call npm start
pause
