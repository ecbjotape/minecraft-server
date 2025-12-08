#!/bin/bash

# Carrega as variáveis de ambiente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/load_env.sh"
load_env

echo "===> Conectando à instância EC2 ($EIP) via SSH..."

# Comando remoto a ser executado na EC2
REMOTE_COMMAND='
echo "-> Acessando a pasta do servidor Minecraft..."
cd ~/minecraft-server || { echo "ERRO: Pasta ~/minecraft-server não encontrada!"; exit 1; }
echo "-> Verificando se já existe uma sessão screen chamada minecraft..."
if screen -list | grep -q "minecraft"; then
  echo "AVISO: O servidor Minecraft já está rodando na sessão screen!"
else
  echo "-> Iniciando servidor Minecraft em uma nova sessão screen..."
  screen -dmS minecraft java -Xmx3072M -Xms3072M -jar minecraft_server.jar nogui
  echo "OK: Screen iniciada e servidor Minecraft rodando!"
fi
'

# Executa o comando remoto via SSH
ssh -i "$PEM_PATH" $USER@$EIP "$REMOTE_COMMAND"