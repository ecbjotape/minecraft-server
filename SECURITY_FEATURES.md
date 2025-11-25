# 🔒 Funcionalidades de Segurança Dinâmicas

## 📋 Resumo

Transformamos o guia de segurança estático (`MINECRAFT_SECURITY.md`) em funcionalidades dinâmicas acessíveis através da interface web. Agora você pode gerenciar a segurança do servidor diretamente pelo dashboard!

## ✨ Funcionalidades Implementadas

### 1. **Gerenciamento de Whitelist** 🎮

**Endpoint:** `POST /api/whitelist`

**Ações disponíveis:**
- ✅ **Adicionar jogador**: `{ action: "add", player: "nome" }`
- ❌ **Remover jogador**: `{ action: "remove", player: "nome" }`
- 📋 **Listar jogadores**: `{ action: "list" }`
- 🔒 **Ativar whitelist**: `{ action: "enable" }`
- 🔓 **Desativar whitelist**: `{ action: "disable" }`

**Segurança:**
- Protegido com JWT authentication
- Executa comandos via SSM no servidor
- Aguarda confirmação de execução
- Retorna output do comando

**Interface:**
- Toggle para ativar/desativar whitelist com badge de status
- Campo de input + botão para adicionar jogadores
- Lista de jogadores com botão de remoção individual
- Botão de atualizar para recarregar a lista
- Feedback visual de sucesso/erro

---

### 2. **Backups Manuais** 💾

**Endpoint:** `POST /api/backup`

**Funcionalidades:**
- Cria backup tar.gz com timestamp
- Notifica jogadores in-game durante o backup
- Executa `save-off` e `save-all` para garantir consistência
- Mantém apenas os últimos 7 backups
- Timeout de 5 minutos para operações longas

**Segurança:**
- Protegido com JWT authentication
- Executa script bash via SSM
- Garante que o mundo está salvo antes do backup

**Interface:**
- Botão "Criar Backup Manual"
- Informação sobre retenção de backups
- Feedback de sucesso/erro

---

### 3. **Visualizador de Logs** 📊

**Endpoint:** `GET /api/logs?lines=50`

**Funcionalidades:**
- Busca últimas N linhas do log do servidor
- Parâmetro `lines` configurável (50, 100, 200, 500)
- Retorna array de linhas de log
- Detecta se arquivo de log não existe

**Segurança:**
- Protegido com JWT authentication
- Read-only access aos logs
- Executa via SSM

**Interface:**
- Dropdown para selecionar quantidade de linhas
- Botão de atualização manual
- Container scrollável com tema escuro
- Fonte monospace para melhor legibilidade
- Auto-carrega ao abrir o painel

---

## 🎨 Interface de Usuário

### **Navegação por Abas**

Adicionamos um sistema de abas na interface principal:

1. **🎮 Dashboard**: Interface original com controles do servidor
2. **🔒 Segurança**: Novo painel com todas as funcionalidades de segurança

### **SecurityPanel Component**

Componente Vue completo com três seções:

#### **Whitelist Section**
- Status visual (Ativo/Inativo)
- Toggle para ativar/desativar
- Input + botão para adicionar jogadores
- Lista com todos os jogadores
- Botão de remover por jogador
- Atualização manual

#### **Backup Section**
- Botão grande para criar backup
- Informações sobre política de retenção
- Feedback imediato

#### **Logs Section**
- Dropdown para quantidade de linhas
- Container com scroll
- Estilização de terminal (fundo escuro, fonte mono)
- Auto-refresh opcional

---

## 🔐 Segurança

Todas as novas funcionalidades estão protegidas:

- ✅ **JWT Authentication obrigatória**
- ✅ **Middleware `requireAuth` em todos os endpoints**
- ✅ **Execução via AWS SSM** (não SSH direto)
- ✅ **Validação de comandos**
- ✅ **Timeout para operações longas**
- ✅ **Error handling completo**

---

## 📁 Arquivos Criados

### **Backend (API)**
```
api/
├── whitelist.ts     # Gerenciamento de whitelist
├── backup.ts        # Criação de backups manuais
└── logs.ts          # Visualização de logs
```

### **Frontend (Web)**
```
web/src/components/
└── SecurityPanel.vue    # Painel de segurança completo
```

### **Utilitários**
```
api/utils/
└── ssm-helper.ts    # Atualizado com overload para extractCommandOutput
```

---

## 🚀 Como Usar

### **1. Acessar Painel de Segurança**

1. Faça login no dashboard
2. Clique na aba **"🔒 Segurança"**

### **2. Gerenciar Whitelist**

**Ativar whitelist:**
```
1. Clique em "🔒 Ativar Whitelist"
2. Status muda para "Ativo" (verde)
```

**Adicionar jogador:**
```
1. Digite o nome do jogador no campo
2. Clique em "➕ Adicionar" ou pressione Enter
3. Aguarde confirmação
4. Jogador aparece na lista
```

**Remover jogador:**
```
1. Encontre o jogador na lista
2. Clique no "❌" ao lado do nome
3. Aguarde confirmação
```

**Listar jogadores:**
```
1. Clique em "🔄 Atualizar Lista"
2. Lista é recarregada do servidor
```

### **3. Criar Backup**

```
1. Clique em "💾 Criar Backup Manual"
2. Jogadores online são notificados
3. Sistema cria backup tar.gz
4. Aguarde confirmação de sucesso
```

### **4. Ver Logs**

```
1. Selecione quantidade de linhas (50-500)
2. Logs aparecem automaticamente
3. Clique em "🔄 Atualizar" para refresh manual
4. Scroll pelo container para ver tudo
```

---

## 🎯 Próximos Passos (Opcionais)

### **Funcionalidades Adicionais Possíveis:**

1. **📊 Lista de Backups**
   - GET /api/backups
   - Mostrar tamanho, data, e idade
   - Botão para baixar backup específico

2. **⚙️ Restaurar Backup**
   - POST /api/restore-backup
   - Selecionar backup da lista
   - Confirmar restauração

3. **🔌 Instalador de Plugins**
   - POST /api/install-plugin
   - Lista de plugins recomendados
   - One-click install

4. **🛡️ Status do Firewall**
   - GET /api/firewall-status
   - Mostrar regras UFW ativas
   - Habilitar/desabilitar regras

5. **📝 Logs em Tempo Real**
   - WebSocket connection
   - Stream de logs ao vivo
   - Filtros por tipo de evento

6. **👥 Gerenciamento de OPs**
   - Adicionar/remover operadores
   - Níveis de permissão
   - Interface similar à whitelist

---

## 📊 Status do Deployment

- ✅ **Código commitado**: `8e1b6b1`
- ✅ **Push realizado**: Deployed to GitHub
- ✅ **Vercel deployment**: Automático via GitHub integration
- ✅ **APIs disponíveis**: `/api/whitelist`, `/api/backup`, `/api/logs`
- ✅ **UI atualizada**: Aba Segurança adicionada

---

## 🐛 Troubleshooting

### **Whitelist não atualiza:**
```bash
# Verificar se servidor está online
# Verificar logs do SSM no AWS Console
# Tentar comando manual via SSH para debug
```

### **Backup falha:**
```bash
# Verificar espaço em disco: df -h
# Verificar permissões: ls -la /home/ubuntu/backups/
# Verificar se screen session está ativa
```

### **Logs não aparecem:**
```bash
# Verificar se arquivo existe:
ls -la /home/ubuntu/minecraft-server/logs/latest.log

# Ver últimas linhas:
tail -n 50 /home/ubuntu/minecraft-server/logs/latest.log
```

---

## 📚 Referências

- **Documentação completa**: `MINECRAFT_SECURITY.md`
- **Autenticação**: `AUTHENTICATION.md`
- **Segurança geral**: `SECURITY.md`
- **Deployment**: `web/DEPLOY.md`

---

**🎉 Agora você tem um sistema completo de gerenciamento de segurança para seu servidor Minecraft!**
