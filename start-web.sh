#!/bin/bash

echo "========================================"
echo "  Minecraft Server Manager - Setup"
echo "========================================"
echo ""

cd web

echo "[1/3] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ ERRO: Node.js não encontrado!"
    echo "Por favor, instale Node.js: https://nodejs.org/"
    exit 1
fi
echo "✅ OK: Node.js instalado!"

echo ""
echo "[2/3] Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ ERRO: Falha ao instalar dependências!"
    exit 1
fi

echo ""
echo "[3/3] Iniciando servidor de desenvolvimento..."
echo ""
echo "🌐 Dashboard disponível em: http://localhost:3000"
echo ""
npm run dev
