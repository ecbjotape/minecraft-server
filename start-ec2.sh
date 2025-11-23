#!/bin/bash

# Carrega as variáveis de ambiente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/load_env.sh"
load_env

echo "===> Iniciando instância EC2 ($INSTANCE_ID)..."
aws ec2 start-instances --instance-ids "$INSTANCE_ID"

if [ $? -eq 0 ]; then
    echo "✓ Instância EC2 iniciada com sucesso!"
    echo "Aguarde alguns segundos antes de conectar via SSH."
else
    echo "✗ Erro ao iniciar a instância EC2."
    exit 1
fi