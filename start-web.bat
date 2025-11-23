@echo off
echo ========================================
echo   Minecraft Server Manager - Setup
echo ========================================
echo.

cd web

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo OK: Node.js instalado!

echo.
echo [2/3] Instalando dependencias...
call npm install

if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [3/3] Iniciando servidor de desenvolvimento...
echo.
echo Dashboard disponivel em: http://localhost:3000
echo.
call npm run dev

pause
