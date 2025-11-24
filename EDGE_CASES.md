# Edge Cases e Tratamento de Erros - Minecraft Server Dashboard

## 📋 Edge Cases Identificados e Tratados

### 1. **Configuração e Ambiente**

#### 1.1 Variáveis de Ambiente Ausentes
- **Problema**: AWS credentials ou Instance ID não configurados
- **Tratamento**: Validação centralizada em `aws-client.ts`
- **Resposta**: HTTP 500 com detalhes das credenciais faltantes
- **Impacto**: Previne chamadas AWS sem credenciais

#### 1.2 Tipos de Instância Inválidos
- **Problema**: Instance ID não existe na conta AWS
- **Tratamento**: Verificação após DescribeInstances
- **Resposta**: HTTP 404 com Instance ID especificado
- **Impacto**: Feedback claro ao usuário

### 2. **Estados da Instância EC2**

#### 2.1 Estados Transicionais
- **Problema**: Instância em estado "pending", "stopping", "shutting-down"
- **Tratamento**: Detecção do estado antes de verificar Minecraft
- **Comportamento**: Não executa comandos SSM se não estiver "running"
- **Impacto**: Economiza recursos e evita erros SSM

#### 2.2 Instância Stopped
- **Problema**: Tentar verificar Minecraft em instância parada
- **Tratamento**: Skip automático da verificação SSM
- **Resposta**: Retorna status offline imediatamente
- **Impacto**: Resposta mais rápida para usuário

### 3. **Comandos SSM**

#### 3.1 Timeout de Comando
- **Problema**: SSM command não completa no tempo esperado
- **Tratamento**: Sistema de retry com até 5 tentativas
- **Delays**: 5s inicial + 2s entre tentativas
- **Impacto**: Maior confiabilidade em redes lentas

#### 3.2 Comando Falha
- **Problema**: SSM retorna status "Failed"
- **Tratamento**: Aceita "Failed" como resposta válida e analisa output
- **Comportamento**: Extrai informações disponíveis do output parcial
- **Impacto**: Não bloqueia se apenas um comando falhar

#### 3.3 Sem Command ID
- **Problema**: SendCommand não retorna Command ID
- **Tratamento**: Log do erro e continua com status offline
- **Impacto**: Graceful degradation

#### 3.4 Erro de Rede Durante Polling
- **Problema**: Conexão perdida ao verificar status do comando
- **Tratamento**: Retry com backoff, aceita falha após max attempts
- **Impacto**: Sistema resiliente a problemas de rede temporários

### 4. **Parsing de Output**

#### 4.1 Output Vazio
- **Problema**: StandardOutputContent vazio ou null
- **Tratamento**: Default para string vazia em `extractCommandOutput`
- **Resposta**: Retorna status offline
- **Impacto**: Sem crashes por dados ausentes

#### 4.2 Output Parcial
- **Problema**: Apenas alguns comandos retornam dados
- **Tratamento**: Parsing individual com fallbacks
- **Exemplo**: Se VERSION falha, usa "Unknown"
- **Impacto**: Dados parciais melhor que nenhum dado

#### 4.3 Múltiplos Jogadores com Vírgulas
- **Problema**: "player1, player2, player3" precisa ser parseado
- **Tratamento**: Split por vírgula + trim + filter empty
- **Validação**: Verifica length <= 16 caracteres (limite Minecraft)
- **Impacto**: Suporta qualquer número de jogadores

#### 4.4 Caracteres Especiais em Nomes
- **Problema**: Jogadores com underscores, números
- **Tratamento**: Regex não-greedy `([^\n\r]*)` captura tudo
- **Validação**: Length check previne dados corrompidos
- **Impacto**: Suporta todos nomes válidos Minecraft

### 5. **Inconsistência de Dados**

#### 5.1 Contagem vs Lista de Jogadores
- **Problema**: "PLAYERS:2/20" mas playerNames tem 3 nomes
- **Tratamento**: `validatePlayerCount` detecta discrepância
- **Comportamento**: Log warning + usa length de playerNames
- **Impacto**: Dados mais precisos, fácil debug

#### 5.2 Versão do Servidor Ausente
- **Problema**: Log não contém linha de versão
- **Tratamento**: Fallback para "Unknown"
- **Impacto**: UI não quebra, apenas mostra "Unknown"

### 6. **Estado do Minecraft**

#### 6.1 Servidor Crashou mas EC2 Rodando
- **Problema**: EC2 running mas Java process morto
- **Tratamento**: Verifica ambos screen session E pgrep
- **Comportamento**: Só marca online se ambos confirmarem
- **Impacto**: Detecção precisa de crashes

#### 6.2 Screen Session Sem Processo
- **Problema**: Screen existe mas Java não está rodando
- **Tratamento**: Dupla verificação com pgrep
- **Impacto**: Evita falsos positivos

#### 6.3 Servidor Iniciando
- **Problema**: EC2 ligou mas Minecraft ainda não está pronto
- **Tratamento**: Status atual não detecta "starting" automaticamente
- **TODO**: Adicionar verificação de arquivo eula.txt ou logs recentes

### 7. **Logs do Minecraft**

#### 7.1 Arquivo de Log Ausente
- **Problema**: latest.log não existe ou foi rotacionado
- **Tratamento**: Redirect stderr to /dev/null + fallback values
- **Resposta**: PLAYERS:0/20, VERSION:Unknown
- **Impacto**: Sem erros, degradação graciosa

#### 7.2 Log Muito Antigo
- **Problema**: Última entrada "list" tem horas de idade
- **Tratamento**: `screen -X stuff 'list\n'` força novo output
- **Delay**: Sleep 1 segundo antes de ler
- **Impacto**: Dados sempre atualizados

#### 7.3 Formato de Log Mudou (Versão Minecraft)
- **Problema**: Nova versão Minecraft muda formato output
- **Tratamento**: Regex flexível com fallback
- **TODO**: Adicionar testes para versões 1.20+

### 8. **Frontend**

#### 8.1 API Não Responde
- **Problema**: Vercel function timeout ou erro
- **Tratamento**: Axios catch mostra erro genérico
- **TODO**: Adicionar retry no frontend com exponential backoff

#### 8.2 Status Poll Durante Transição
- **Problema**: Poll a cada 30s pode pegar estado intermediário
- **Tratamento**: Estado "starting" é respeitado
- **TODO**: Reduzir intervalo para 10s quando pending/starting

#### 8.3 Modal Aberto Durante Update
- **Problema**: Dados mudam enquanto modal está aberto
- **Tratamento**: Botão "Atualizar" manual no modal
- **Melhoria**: Auto-refresh poderia atualizar modal também

### 9. **Segurança**

#### 9.1 Credenciais AWS Expostas
- **Problema**: Env vars em código
- **Tratamento**: Apenas process.env, validação server-side
- **Proteção**: Nunca envia credentials para frontend
- **Boas práticas**: IAM roles com mínimos privilégios

#### 9.2 Command Injection em SSM
- **Problema**: Input do usuário em shell commands
- **Mitigação**: Sem inputs do usuário nos comandos SSM
- **Comandos**: Todos hardcoded no código
- **TODO**: Se adicionar parâmetros, sanitizar rigorosamente

### 10. **Performance**

#### 10.1 Timeout de Vercel (10s)
- **Problema**: SSM pode demorar > 10s
- **Tratamento**: Total < 10s (5s initial + 5x retry com 2s)
- **Risco**: Em latência alta pode timeout
- **TODO**: Considerar async pattern com webhook

#### 10.2 Múltiplas Chamadas Simultâneas
- **Problema**: Vários users acessando ao mesmo tempo
- **Comportamento**: Cada request cria novo SSM command
- **Impacto**: Pode sobrecarregar instância
- **TODO**: Cache de 5-10 segundos no servidor

## 🔧 Melhorias Futuras

### Prioridade Alta
1. ✅ Implementar validação de contagem de jogadores
2. ✅ Separar lógica em módulos (aws-client, minecraft-parser, ssm-helper)
3. ⏳ Adicionar retry no frontend para chamadas de API
4. ⏳ Cache de status no servidor (5-10s)

### Prioridade Média
5. ⏳ Detectar estado "starting" do Minecraft
6. ⏳ Reduzir polling quando em transição
7. ⏳ Testes unitários para parsers
8. ⏳ Métricas de uptime e disponibilidade

### Prioridade Baixa
9. ⏳ Suporte a múltiplas versões de formato de log
10. ⏳ Histórico de jogadores conectados
11. ⏳ Notificações quando servidor cai
12. ⏳ Auto-restart em caso de crash

## 📊 Matriz de Tratamento

| Edge Case | Detectado | Tratado | Logged | Testado |
|-----------|-----------|---------|--------|---------|
| Env vars ausentes | ✅ | ✅ | ✅ | ⏳ |
| Instance não encontrada | ✅ | ✅ | ✅ | ⏳ |
| EC2 em transição | ✅ | ✅ | ✅ | ⏳ |
| SSM timeout | ✅ | ✅ | ✅ | ⏳ |
| Output vazio | ✅ | ✅ | ✅ | ⏳ |
| Múltiplos jogadores | ✅ | ✅ | ✅ | ✅ |
| Contagem inconsistente | ✅ | ✅ | ✅ | ⏳ |
| Servidor crashado | ✅ | ✅ | ✅ | ⏳ |
| Log ausente | ✅ | ✅ | ⏳ | ⏳ |
| Command injection | ✅ | ✅ | N/A | N/A |
| Vercel timeout | ✅ | ⚠️ | ✅ | ⏳ |

**Legenda:**
- ✅ Implementado
- ⏳ Pendente
- ⚠️ Parcialmente implementado
- N/A Não aplicável
