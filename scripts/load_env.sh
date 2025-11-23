#!/bin/bash

# ==============================================
# CARREGA E VALIDA VARIÁVEIS DE AMBIENTE
# ==============================================

load_env() {
    # Encontra o diretório raiz do projeto (onde está o .env)
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_dir="$(cd "$script_dir/.." && pwd)"
    local env_file="$project_dir/.env"
    
    echo "🔍 Procurando .env em: $env_file"
    
    # Verifica se o arquivo .env existe
    if [ ! -f "$env_file" ]; then
        echo "❌ Erro: Arquivo .env não encontrado!"
        echo ""
        echo "📋 Configure seu ambiente seguindo estes passos:"
        echo "   1. Copie o arquivo de exemplo:"
        echo "      cp .env.example .env"
        echo ""
        echo "   2. Edite o arquivo .env com suas configurações:"
        echo "      - INSTANCE_ID: ID da sua instância EC2"
        echo "      - PEM_PATH: Caminho para sua chave .pem"
        echo "      - EIP: Elastic IP da instância"
        echo "      - USER: Usuário SSH (geralmente 'ubuntu')"
        echo ""
        exit 1
    fi
    
    echo "🔧 Carregando configurações do .env..."
    
    # Carrega as variáveis do .env de forma segura
    set -a  # Automaticamente exporta todas as variáveis
    source "$env_file" 2>/dev/null || {
        # Fallback: carrega manualmente linha por linha
        while IFS= read -r line; do
            # Ignora comentários e linhas vazias
            [[ "$line" =~ ^#.*$ ]] && continue
            [[ -z "$line" ]] && continue
            
            # Exporta a variável
            export "$line"
        done < "$env_file"
    }
    set +a  # Desativa auto-export
    
    # Validação: INSTANCE_ID
    if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "i-xxxxxxxxxxxxxxxxx" ]; then
        echo "❌ Erro: INSTANCE_ID não configurado ou inválido em .env"
        echo "   Configure o ID da sua instância EC2"
        exit 1
    fi
    
    # Validação: PEM_PATH
    if [ -z "$PEM_PATH" ] || [ "$PEM_PATH" = "/caminho/para/sua-chave.pem" ]; then
        echo "❌ Erro: PEM_PATH não configurado em .env"
        echo "   Configure o caminho para seu arquivo .pem"
        exit 1
    fi
    
    if [ ! -f "$PEM_PATH" ]; then
        echo "❌ Erro: Arquivo PEM não encontrado: $PEM_PATH"
        echo "   Verifique se o caminho está correto"
        exit 1
    fi
    
    # Validação: EIP
    if [ -z "$EIP" ] || [ "$EIP" = "0.0.0.0" ]; then
        echo "❌ Erro: EIP (Elastic IP) não configurado em .env"
        echo "   Configure o IP público da sua instância EC2"
        exit 1
    fi
    
    # Validação: USER
    if [ -z "$USER" ]; then
        echo "❌ Erro: USER não configurado em .env"
        echo "   Configure o usuário SSH (geralmente 'ubuntu' ou 'ec2-user')"
        exit 1
    fi
    
    echo "✅ Configurações carregadas com sucesso!"
    echo ""
}
