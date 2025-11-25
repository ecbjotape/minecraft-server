# 🔐 Sistema de Autenticação

## Visão Geral

O dashboard do Minecraft Server possui um sistema de autenticação opcional que permite controlar quem pode gerenciar as instâncias EC2 e o servidor Minecraft.

## Características

- ✅ **Autenticação baseada em senha** com hash SHA-256
- ✅ **Sessions de 24 horas** com tokens seguros
- ✅ **Totalmente opcional** - pode ser desabilitado
- ✅ **Múltiplos usuários** suportados
- ✅ **Proteção de todas as APIs críticas** (start, stop)
- ✅ **UI de login moderna** e responsiva
- ✅ **Logout automático** em caso de token expirado

## Como Habilitar

### 1. Gerar Hash de Senha

Use o script fornecido para gerar o hash da senha:

```bash
node scripts/generate-password-hash.js <username> <password>
```

**Exemplo:**

```bash
node scripts/generate-password-hash.js admin minhasenha123
```

**Saída:**

```
=== Password Hash Generated ===

Username: admin
Hashed Password: a1b2c3d4e5f6...

=== Add to .env.vercel ===

AUTH_ENABLED=true
AUTH_USERS=admin:a1b2c3d4e5f6...
```

### 2. Configurar Variáveis de Ambiente no Vercel

No painel da Vercel (Settings → Environment Variables), adicione:

```env
AUTH_ENABLED=true
AUTH_USERS=admin:salt:hash
```

**Para múltiplos usuários:**

```env
AUTH_USERS=admin:salt1:hash1,user2:salt2:hash2,user3:salt3:hash3
```

### 3. Fazer Deploy

Após adicionar as variáveis:

```bash
git push
```

O Vercel automaticamente fará o deploy com a autenticação habilitada.

## Estrutura do Sistema

### Arquivos Criados

```
api/
├── utils/
│   └── auth.ts          # Lógica de autenticação e middleware
├── login.ts             # Endpoint de login
├── logout.ts            # Endpoint de logout
└── auth-check.ts        # Verificação de autenticação

web/src/components/
└── Login.vue            # Componente de UI de login

scripts/
└── generate-password-hash.js  # Gerador de hash
```

### Endpoints Protegidos

Os seguintes endpoints requerem autenticação quando `AUTH_ENABLED=true`:

- `POST /api/start-ec2` - Iniciar instância EC2
- `POST /api/start-server` - Iniciar servidor Minecraft
- `POST /api/stop-ec2` - Parar instância EC2

### Endpoints Públicos

Estes endpoints permanecem públicos:

- `GET /api/status` - Ver status do servidor
- `GET /api/config` - Ver configurações básicas
- `POST /api/login` - Fazer login
- `POST /api/logout` - Fazer logout
- `GET /api/auth-check` - Verificar autenticação

## Como Usar

### Login

1. Acesse o dashboard
2. Se a autenticação estiver habilitada, verá a tela de login
3. Digite seu usuário e senha
4. Clique em "Entrar"

### Logout

- Clique no botão 🚪 no canto superior direito do header

### Sessão Expirada

- As sessões duram 24 horas
- Após expirar, você será automaticamente deslogado
- Faça login novamente para continuar

## Segurança

### Boas Práticas

✅ **Use senhas fortes**

- Mínimo de 12 caracteres
- Combine letras maiúsculas, minúsculas, números e símbolos
- Não reutilize senhas de outros serviços

✅ **Proteja suas credenciais**

- Nunca commit o arquivo `.env` com senhas
- Use variáveis de ambiente no Vercel
- Não compartilhe os hashes gerados

✅ **Gerencie usuários**

- Remova usuários inativos das variáveis de ambiente
- Regenere senhas periodicamente
- Use usuários separados para cada pessoa

### Implementação

- **Hashing**: SHA-256 com salt aleatório de 16 bytes
- **Tokens**: 32 bytes aleatórios em hexadecimal
- **Cookies**: HttpOnly, Secure, SameSite=Strict
- **Headers**: Authorization Bearer token
- **Armazenamento**: In-memory sessions (serverless-friendly)

## Desabilitar Autenticação

Para desabilitar completamente:

1. No Vercel, vá em Settings → Environment Variables
2. Mude `AUTH_ENABLED` para `false` ou remova a variável
3. Faça um novo deploy ou aguarde o próximo

**Ou remova completamente:**

```bash
# Remove as variáveis no Vercel
AUTH_ENABLED
AUTH_USERS
```

## Troubleshooting

### "Usuário ou senha inválidos"

- Verifique se o hash foi gerado corretamente
- Confirme se a variável `AUTH_USERS` está configurada no Vercel
- Certifique-se de que o formato está correto: `username:salt:hash`

### "Sessão expirada"

- Faça login novamente
- Tokens duram 24 horas por padrão

### "Não autorizado"

- Verifique se `AUTH_ENABLED=true` no Vercel
- Confirme se você está logado
- Tente fazer logout e login novamente

### API retorna 401

- Token pode estar expirado ou inválido
- Limpe localStorage e faça login novamente
- Verifique se as cookies estão habilitadas no navegador

## Exemplo Completo

```bash
# 1. Gerar hash para usuário "admin"
node scripts/generate-password-hash.js admin minhaSenhaForte123!

# Output:
# AUTH_USERS=admin:a1b2c3d4e5f6789...:abc123def456...

# 2. Adicionar no Vercel:
# Settings → Environment Variables → Add New
# Name: AUTH_ENABLED
# Value: true

# Name: AUTH_USERS
# Value: admin:a1b2c3d4e5f6789...:abc123def456...

# 3. Deploy
git add .
git commit -m "Enable authentication"
git push

# 4. Aguarde deploy e acesse o dashboard
# Você verá a tela de login
```

## API Reference

### POST /api/login

Autentica um usuário e retorna um token.

**Request:**

```json
{
  "username": "admin",
  "password": "minhasenha123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "token": "abc123def456...",
  "username": "admin"
}
```

**Response (401):**

```json
{
  "error": "Usuário ou senha inválidos"
}
```

### POST /api/logout

Invalida o token atual.

**Response (200):**

```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

### GET /api/auth-check

Verifica se o usuário está autenticado.

**Response (200):**

```json
{
  "authenticated": true,
  "authEnabled": true
}
```

## Suporte

Para problemas ou dúvidas:

1. Verifique este README
2. Confira os logs do Vercel
3. Abra uma issue no repositório
