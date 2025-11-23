#!/bin/bash

# Carrega as variáveis de ambiente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/load_env.sh"
load_env

echo "===> Parando instância EC2 ($INSTANCE_ID)..."
aws ec2 stop-instances --instance-ids "$INSTANCE_ID"

if [ $? -eq 0 ]; then
    echo "✓ Instância EC2 parada com sucesso!"
    echo "Lembre-se: você não será cobrado enquanto a instância estiver parada."
else
    echo "✗ Erro ao parar a instância EC2."
    exit 1
fi