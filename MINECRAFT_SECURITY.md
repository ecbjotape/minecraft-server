# 🛡️ Guia Completo de Segurança para Minecraft Server

## 📋 Índice

1. [Whitelist e Controle de Acesso](#1-whitelist-e-controle-de-acesso)
2. [Configurações de Segurança](#2-configurações-de-segurança)
3. [Plugins de Segurança](#3-plugins-de-segurança)
4. [Proteção Contra Bots e Scanners](#4-proteção-contra-bots-e-scanners)
5. [Backup Automático](#5-backup-automático)
6. [Boas Práticas](#6-boas-práticas)

---

## 1. Whitelist e Controle de Acesso

### 1.1 Ativar Whitelist

**Via Comando (servidor rodando):**

```bash
# Conecte via SSH
ssh -i minecraft-key.pem ubuntu@3.133.214.110

# Entre na sessão do Minecraft
screen -r minecraft

# Ative a whitelist
whitelist on

# Saia do screen (Ctrl+A, D)
```

**Via server.properties (requer restart):**

```bash
# Edite o arquivo
nano ~/minecraft-server/server.properties

# Mude a linha:
white-list=true
enforce-whitelist=true

# Salve (Ctrl+O, Enter, Ctrl+X)
```

### 1.2 Gerenciar Whitelist

```bash
# Adicionar jogadores
whitelist add ecbjotape
whitelist add edu
whitelist add jgmonteiro

# Listar jogadores na whitelist
whitelist list

# Remover jogador
whitelist remove NomeJogador

# Recarregar whitelist (após editar manualmente)
whitelist reload
```

**Editar whitelist.json manualmente:**

```bash
nano ~/minecraft-server/whitelist.json
```

```json
[
  {
    "uuid": "uuid-do-jogador",
    "name": "ecbjotape"
  },
  {
    "uuid": "uuid-do-jogador",
    "name": "edu"
  },
  {
    "uuid": "uuid-do-jogador",
    "name": "jgmonteiro"
  }
]
```

### 1.3 Modo Online vs Offline

**⚠️ IMPORTANTE: Riscos do Modo Offline**

**Modo Online (Recomendado):**

- ✅ Verifica contas legítimas da Mojang
- ✅ Protege contra falsificação de nomes
- ✅ Mais seguro
- ❌ Requer contas originais

**Modo Offline:**

- ✅ Permite contas piratas
- ❌ Qualquer um pode usar qualquer nome
- ❌ Vulnerável a ataques
- ❌ **NÃO RECOMENDADO SEM AUTHME**

**Para usar modo offline COM SEGURANÇA:**

```properties
# server.properties
online-mode=false
```

**OBRIGATÓRIO: Instale AuthMe (ver seção 3.1)**

---

## 2. Configurações de Segurança

### 2.1 server.properties

```bash
nano ~/minecraft-server/server.properties
```

**Configurações de Segurança:**

```properties
# === CONTROLE DE ACESSO ===
white-list=true
enforce-whitelist=true
online-mode=true

# === PROTEÇÃO CONTRA BOTS ===
max-players=20
network-compression-threshold=256
rate-limit=0

# === PROTEÇÃO DO MUNDO ===
spawn-protection=16
allow-flight=false
enable-command-block=false

# === PERFORMANCE E ANTI-LAG ===
max-world-size=10000
view-distance=8
simulation-distance=8

# === LOGGING ===
enable-query=false
enable-rcon=false
```

### 2.2 spigot.yml

```bash
nano ~/minecraft-server/spigot.yml
```

**Configurações Anti-Bot:**

```yaml
settings:
  # Limites de conexão
  connection-throttle: 4000
  timeout-time: 60
  restart-on-crash: true

  # Anti-bot protection
  bungeecord: false
  sample-count: 12

  # Filtro de mensagens
  spam-exclusions:
    - /login
    - /register

messages:
  # Mensagens personalizadas
  whitelist: "§cVocê não está na whitelist deste servidor!"
  unknown-command: "§cComando desconhecido."
  server-full: "§cServidor cheio! Tente novamente mais tarde."

world-settings:
  default:
    # Anti-exploits
    mob-spawn-range: 6
    entity-activation-range:
      animals: 32
      monsters: 32
      raiders: 48
      misc: 16
      water: 16
      villagers: 32
      flying-monsters: 32

    # Performance
    max-entity-collisions: 8
    merge-radius:
      item: 2.5
      exp: 3.0
```

### 2.3 bukkit.yml

```bash
nano ~/minecraft-server/bukkit.yml
```

**Configurações de Segurança:**

```yaml
settings:
  # Limites de spawn
  monster-spawns: 70
  animal-spawns: 10
  water-animal-spawns: 5
  water-ambient-spawns: 20
  ambient-spawns: 15

  # Chunk loading
  chunk-gc:
    period-in-ticks: 600

  # Anti-lag
  ticks-per:
    animal-spawns: 400
    monster-spawns: 1
    water-spawns: 1
    water-ambient-spawns: 1
    ambient-spawns: 1
    autosave: 6000

spawn-limits:
  monsters: 70
  animals: 10
  water-animals: 5
  water-ambient: 20
  ambient: 15
```

---

## 3. Plugins de Segurança

### 3.1 AuthMe Reloaded (Autenticação para modo offline)

**⚠️ ESSENCIAL se usar online-mode=false**

**Instalação:**

```bash
cd ~/minecraft-server/plugins
wget https://github.com/AuthMe/AuthMeReloaded/releases/download/5.6.0/AuthMe-5.6.0.jar
```

**Configuração básica (config.yml):**

```yaml
DataSource:
  backend: SQLITE

settings:
  # Tempo para fazer login
  timeoutInSeconds: 30

  # Força registro
  isRegistrationEnabled: true
  forceRegisterCommandsAsConsole:
    - ""

  # Segurança de senha
  passwordMinLen: 6
  passwordMaxLength: 30
  unsafePasswords:
    - "123456"
    - "password"
    - "12345"

  # Proteção durante login
  protectInventoryBeforeLogIn: true
  denyTabCompleteBeforeLogin: true
  hideTablistBeforeLogin: true

Security:
  # IP restriction
  useSessionRestriction: true
  sessionTimeout: 10

  # Anti-bot
  captchaLength: 5
  maxLoginPerIp: 3
  maxJoinPerIp: 3
```

**Comandos importantes:**

```bash
# Jogadores usam:
/register senha senha
/login senha

# Admin:
/authme register jogador senha
/authme unregister jogador
/authme changepassword jogador novasenha
```

### 3.2 CoreProtect (Rollback e Anti-Grief)

**Instalação:**

```bash
cd ~/minecraft-server/plugins
wget https://github.com/PlayPro/CoreProtect/releases/download/22.4/CoreProtect-22.4.jar
```

**Configuração:**

```yaml
# config.yml
database:
  # SQLite (default) ou MySQL
  use-mysql: false

lookup:
  # Tempo de retenção de logs (dias)
  max-time: 60

blacklist:
  # Logs que você não precisa
  - minecraft:water
  - minecraft:lava
```

**Comandos essenciais:**

```bash
# Inspecionar bloco (clique com madeira)
/co inspect

# Ver histórico de um jogador
/co lookup u:NomeJogador t:7d

# Rollback (desfazer ações)
/co rollback u:Griefer t:24h r:100

# Restore (refazer)
/co restore u:NomeJogador t:1h r:50

# Purge (limpar logs antigos)
/co purge t:30d
```

### 3.3 ExploitFixer (Anti-Exploits e Anti-Crash)

**Instalação:**

```bash
cd ~/minecraft-server/plugins
wget https://github.com/Xdavide03/ExploitFixer/releases/download/1.3.8/ExploitFixer-1.3.8.jar
```

**Funcionalidades automáticas:**

- ✅ Bloqueia packet exploits
- ✅ Previne crashes causados por livros
- ✅ Protege contra command block exploits
- ✅ Anti-creative mode exploits
- ✅ Bloqueia NBT exploits

**Configuração (config.yml):**

```yaml
modules:
  book-limit: true
  creative-listener: true
  packet-limiter: true
  command-blocker: true

settings:
  max-book-pages: 50
  max-packet-per-second: 200

punishments:
  book-exploit: "kick"
  packet-flood: "kick"
```

### 3.4 AntiPopup (Anti-Bot Básico)

**Instalação:**

```bash
cd ~/minecraft-server/plugins
wget https://www.spigotmc.org/resources/antipopup.xxx/download # Substitua pelo link correto
```

**Funcionalidades:**

- Bloqueia conexões em massa
- Rate limiting automático
- Detecta padrões de bot

### 3.5 EssentialsX (Gerenciamento + Anti-Grief)

**Instalação:**

```bash
cd ~/minecraft-server/plugins
wget https://github.com/EssentialsX/Essentials/releases/download/2.20.1/EssentialsX-2.20.1.jar
```

**Proteções úteis:**

```yaml
# config.yml
protect:
  disable:
    # Previne exploits
    item-frame-remove: true
    armor-stand-remove: true

  signs:
    # Limita comandos em placas
    enable: true

general:
  # Anti-spam
  spam-limit: 3

  # Proteção de comandos
  command-cooldowns:
    tpa: 10
    home: 5
```

---

## 4. Proteção Contra Bots e Scanners

### 4.1 Firewall (UFW)

**Configure o firewall para aceitar apenas conexões legítimas:**

```bash
# Instalar UFW
sudo apt update
sudo apt install ufw

# Configurar regras
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir Minecraft apenas de IPs específicos (RECOMENDADO)
sudo ufw allow from SeuIPCasa to any port 25565 proto tcp

# OU permitir de todos (menos seguro)
sudo ufw allow 25565/tcp

# Ativar firewall
sudo ufw enable

# Ver status
sudo ufw status verbose
```

### 4.2 Fail2Ban (Bloqueio Automático)

**Instalar:**

```bash
sudo apt install fail2ban
```

**Criar filtro para Minecraft:**

```bash
sudo nano /etc/fail2ban/filter.d/minecraft.conf
```

```ini
[Definition]
failregex = \[.*\]: Disconnecting .*<HOST>.*: Too Many Requests
            \[.*\]: <HOST> lost connection: Timed out
            \[.*\]: <HOST>.*logged in with entity id
ignoreregex =
```

**Configurar jail:**

```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[minecraft]
enabled = true
port = 25565
protocol = tcp
filter = minecraft
logpath = /home/ubuntu/minecraft-server/logs/latest.log
maxretry = 5
bantime = 3600
findtime = 600
action = iptables-allports[name=minecraft]
```

**Reiniciar Fail2Ban:**

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status minecraft
```

### 4.3 Rate Limiting com IPTables

**Limitar conexões por IP:**

```bash
# Criar regra de rate limiting
sudo iptables -A INPUT -p tcp --dport 25565 -m connlimit --connlimit-above 3 -j REJECT

# Limitar novas conexões por minuto
sudo iptables -A INPUT -p tcp --dport 25565 -m state --state NEW -m recent --set
sudo iptables -A INPUT -p tcp --dport 25565 -m state --state NEW -m recent --update --seconds 60 --hitcount 10 -j DROP

# Salvar regras
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

### 4.4 Proteção Contra "matscan" e Scanners

**1. Use whitelist:**

```bash
whitelist on
```

**2. Oculte informações do servidor:**

```properties
# server.properties
enable-query=false
hide-online-players=true
```

```yaml
# spigot.yml
settings:
  sample-count: 0 # Não mostra jogadores online no ping
```

**3. Plugin AntiBot avançado:**

Instale **AntiBot** ou **AntiVPN**:

```bash
cd ~/minecraft-server/plugins
# AntiBot detecta padrões de bot
wget https://www.spigotmc.org/resources/antibot.xxx/download
```

**4. Reverse Proxy com HAProxy (avançado):**

Adicione uma camada de proxy que filtra conexões antes de chegarem no Minecraft:

```bash
sudo apt install haproxy
```

---

## 5. Backup Automático

### 5.1 Script de Backup

**Criar script:**

```bash
nano ~/backup-minecraft.sh
```

```bash
#!/bin/bash

# Configurações
SERVER_DIR="/home/ubuntu/minecraft-server"
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="minecraft_backup_${DATE}.tar.gz"

# Criar diretório de backups
mkdir -p "$BACKUP_DIR"

# Avisar jogadores (se servidor estiver rodando)
if screen -list | grep -q "minecraft"; then
    screen -S minecraft -p 0 -X stuff "say §eBackup iniciando em 30 segundos...^M"
    sleep 30
    screen -S minecraft -p 0 -X stuff "save-off^M"
    screen -S minecraft -p 0 -X stuff "save-all^M"
    sleep 10
fi

# Criar backup
echo "Criando backup: $BACKUP_NAME"
cd "$SERVER_DIR"
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
    --exclude='logs' \
    --exclude='crash-reports' \
    --exclude='cache' \
    .

# Reativar salvamento
if screen -list | grep -q "minecraft"; then
    screen -S minecraft -p 0 -X stuff "save-on^M"
    screen -S minecraft -p 0 -X stuff "say §aBackup concluído!^M"
fi

# Manter apenas últimos 7 backups
cd "$BACKUP_DIR"
ls -t minecraft_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup concluído: $BACKUP_NAME"
```

**Dar permissão de execução:**

```bash
chmod +x ~/backup-minecraft.sh
```

### 5.2 Automatizar com Cron

```bash
crontab -e
```

**Adicionar linhas:**

```bash
# Backup diário às 3h da manhã
0 3 * * * /home/ubuntu/backup-minecraft.sh >> /home/ubuntu/backup.log 2>&1

# Backup a cada 6 horas
0 */6 * * * /home/ubuntu/backup-minecraft.sh >> /home/ubuntu/backup.log 2>&1
```

### 5.3 Backup para S3 (AWS)

**Instalar AWS CLI:**

```bash
sudo apt install awscli
aws configure
```

**Modificar script para enviar para S3:**

```bash
# Adicionar ao final do script
aws s3 cp "$BACKUP_DIR/$BACKUP_NAME" s3://seu-bucket/minecraft-backups/
```

### 5.4 Restaurar Backup

```bash
# Parar servidor
screen -S minecraft -X quit

# Ir para diretório do servidor
cd ~/minecraft-server

# Fazer backup do estado atual (precaução)
mv world world_old_$(date +%Y%m%d)

# Extrair backup
tar -xzf ~/backups/minecraft_backup_YYYYMMDD_HHMMSS.tar.gz

# Iniciar servidor
screen -dmS minecraft java -Xmx1024M -Xms1024M -jar minecraft_server.jar nogui
```

---

## 6. Boas Práticas

### 6.1 Checklist de Segurança

- ✅ **Whitelist ativa** e enforce-whitelist=true
- ✅ **Online-mode=true** (se possível) ou AuthMe instalado
- ✅ **Firewall configurado** (UFW)
- ✅ **Fail2Ban ativo** para bloquear IPs maliciosos
- ✅ **CoreProtect instalado** para rollback
- ✅ **ExploitFixer ativo** contra exploits
- ✅ **Backups automáticos** diários
- ✅ **Logs monitorados** regularmente
- ✅ **Plugins atualizados** sempre na última versão
- ✅ **Permissions bem configurados** (apenas ops necessários)
- ✅ **Query desabilitado** para ocultar informações

### 6.2 Monitoramento

**Verificar logs em tempo real:**

```bash
# Ver últimas linhas do log
tail -f ~/minecraft-server/logs/latest.log

# Procurar por ataques
grep -i "connection" ~/minecraft-server/logs/latest.log | tail -20
grep -i "disconnect" ~/minecraft-server/logs/latest.log | tail -20
```

**Script de alerta:**

```bash
nano ~/monitor-attacks.sh
```

```bash
#!/bin/bash
LOG_FILE="/home/ubuntu/minecraft-server/logs/latest.log"
ALERT_EMAIL="seu@email.com"

# Detectar múltiplas conexões do mesmo IP
awk '/logged in with entity/ {print $6}' "$LOG_FILE" | sort | uniq -c | \
while read count ip; do
    if [ "$count" -gt 5 ]; then
        echo "Possível ataque detectado do IP: $ip ($count conexões)" | \
        mail -s "Alerta Minecraft Server" "$ALERT_EMAIL"
    fi
done
```

### 6.3 Operadores Seguros

**Gerenciar OPs com cuidado:**

```bash
# Dar OP apenas quando necessário
op jogador

# Remover OP
deop jogador

# Ver lista de OPs
cat ~/minecraft-server/ops.json
```

**Limitar permissões com LuckPerms:**

```bash
cd ~/minecraft-server/plugins
wget https://download.luckperms.net/1556/bukkit/loader/LuckPerms-Bukkit-5.4.139.jar
```

### 6.4 Atualizar Servidor

**Manter tudo atualizado:**

```bash
# Sistema operacional
sudo apt update && sudo apt upgrade -y

# Minecraft server
cd ~/minecraft-server
wget https://papermc.io/api/v2/projects/paper/versions/1.20.1/builds/XXX/downloads/paper-1.20.1-XXX.jar -O minecraft_server.jar

# Plugins (verificar manualmente)
```

### 6.5 Teste de Penetração

**Teste sua segurança:**

```bash
# Simular múltiplas conexões
for i in {1..10}; do
    echo "Teste $i"
    nc -zv IP_SERVIDOR 25565
done

# Verificar portas abertas
nmap -p 1-65535 IP_SERVIDOR

# Verificar se informações vazam
nmap -sV -p 25565 IP_SERVIDOR
```

---

## 7. Comandos Rápidos de Emergência

### 7.1 Em Caso de Ataque

```bash
# 1. Ativar whitelist imediatamente
screen -r minecraft
whitelist on
kick @a[name=!ecbjotape,name=!edu,name=!jgmonteiro]

# 2. Bloquear IP específico
sudo ufw deny from IP_ATACANTE to any port 25565

# 3. Ver IPs conectados
netstat -tn | grep :25565 | awk '{print $5}' | cut -d: -f1 | sort | uniq -c

# 4. Kickar todos exceto você
kick @a[name=!SeuNome]

# 5. Fazer backup emergencial
tar -czf ~/emergency_backup_$(date +%s).tar.gz ~/minecraft-server/world
```

### 7.2 Recuperação Após Grief

```bash
# Usando CoreProtect
/co rollback u:Griefer t:24h r:#global

# Restaurar backup
cd ~/minecraft-server
screen -S minecraft -X quit
mv world world_griefed
tar -xzf ~/backups/minecraft_backup_ULTIMO.tar.gz world
screen -dmS minecraft java -Xmx1024M -Xms1024M -jar minecraft_server.jar nogui
```

---

## 8. Resumo de Instalação Completa

**Script único para configurar tudo:**

```bash
#!/bin/bash

echo "=== Instalando Plugins de Segurança ==="

cd ~/minecraft-server/plugins

# AuthMe
wget -O AuthMe.jar https://github.com/AuthMe/AuthMeReloaded/releases/download/5.6.0/AuthMe-5.6.0.jar

# CoreProtect
wget -O CoreProtect.jar https://github.com/PlayPro/CoreProtect/releases/download/22.4/CoreProtect-22.4.jar

# ExploitFixer
wget -O ExploitFixer.jar https://github.com/Xdavide03/ExploitFixer/releases/download/1.3.8/ExploitFixer-1.3.8.jar

# EssentialsX
wget -O EssentialsX.jar https://github.com/EssentialsX/Essentials/releases/download/2.20.1/EssentialsX-2.20.1.jar

echo "=== Configurando Firewall ==="
sudo ufw allow 22
sudo ufw allow 25565
sudo ufw --force enable

echo "=== Instalando Fail2Ban ==="
sudo apt install -y fail2ban

echo "=== Criando script de backup ==="
cat > ~/backup-minecraft.sh << 'EOF'
#!/bin/bash
SERVER_DIR="/home/ubuntu/minecraft-server"
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/minecraft_backup_${DATE}.tar.gz" -C "$SERVER_DIR" .
ls -t "$BACKUP_DIR"/minecraft_backup_*.tar.gz | tail -n +8 | xargs -r rm
EOF

chmod +x ~/backup-minecraft.sh

echo "=== Configurando cron para backup ==="
(crontab -l 2>/dev/null; echo "0 3 * * * /home/ubuntu/backup-minecraft.sh") | crontab -

echo "=== Configuração completa! ==="
echo "Reinicie o servidor Minecraft para aplicar as mudanças."
```

**Executar:**

```bash
chmod +x install-security.sh
./install-security.sh
```

---

## 9. Suporte e Recursos

### Documentação Oficial:

- **AuthMe**: https://github.com/AuthMe/AuthMeReloaded/wiki
- **CoreProtect**: https://docs.coreprotect.net/
- **ExploitFixer**: https://github.com/Xdavide03/ExploitFixer
- **Paper MC**: https://docs.papermc.io/

### Comunidade:

- SpigotMC Forums: https://www.spigotmc.org/
- Paper Discord: https://discord.gg/papermc
- r/admincraft: https://reddit.com/r/admincraft

---

## ⚠️ NOTAS IMPORTANTES

1. **Sempre teste em ambiente de desenvolvimento** antes de aplicar em produção
2. **Faça backup antes de qualquer mudança**
3. **Monitore logs após implementar mudanças**
4. **Mantenha plugins e servidor atualizados**
5. **Whitelist é sua primeira linha de defesa**
6. **Online-mode=true é mais seguro que offline**
7. **Use AuthMe SE E SOMENTE SE usar online-mode=false**

---

**Última atualização:** 25/11/2025
**Versão do guia:** 1.0
**Compatível com:** Minecraft Java 1.19.x - 1.20.x
