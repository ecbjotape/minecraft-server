# Minecraft Server Manager - Guia de Deploy na Vercel

Este guia explica como fazer o deploy da aplicação na Vercel.

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. [Vercel CLI](https://vercel.com/cli) instalado (opcional)
3. Credenciais AWS configuradas

## 🚀 Deploy via Interface Web

### Passo 1: Conectar Repositório

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe seu repositório GitHub
3. Configure o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: deixe vazio (usa a raiz)
   - **Build Command**: `cd web && npm install && npm run build`
   - **Output Directory**: `web/dist`

### Passo 2: Configurar Variáveis de Ambiente

No painel da Vercel, vá em **Settings > Environment Variables** e adicione:

```
INSTANCE_ID=i-xxxxxxxxxxxxxxxxx
EIP=0.0.0.0
USER=ubuntu
AWS_ACCESS_KEY_ID=sua_chave_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
AWS_REGION=us-east-1
```

**Para PEM_CONTENT:**

```bash
# No terminal, converta seu .pem para uma linha:
cat minecraft-key.pem | tr '\n' '\\n'
# Cole o resultado na variável PEM_CONTENT
```

### Passo 3: Deploy

1. Clique em **Deploy**
2. Aguarde o build completar
3. Acesse sua aplicação!

## 💻 Deploy via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd minecraft-server
vercel

# Configurar variáveis de ambiente
vercel env add INSTANCE_ID
vercel env add EIP
vercel env add USER
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION
vercel env add PEM_CONTENT

# Deploy para produção
vercel --prod
```

## 🔐 Segurança

⚠️ **IMPORTANTE:**

1. Nunca commite as variáveis de ambiente
2. Use IAM roles com permissões mínimas
3. Considere usar AWS Systems Manager Parameter Store
4. Implemente autenticação na aplicação para produção

## 📝 Estrutura do Projeto

```
minecraft-server/
├── web/                  # Frontend Vue.js
│   ├── src/
│   │   ├── App.vue      # Componente principal
│   │   ├── main.ts      # Entry point
│   │   └── style.css    # Estilos globais
│   ├── package.json
│   └── vite.config.ts
├── api/                  # Serverless Functions
│   ├── start-ec2.ts     # Inicia EC2
│   ├── stop-ec2.ts      # Para EC2
│   └── start-server.ts  # Inicia Minecraft
├── vercel.json          # Configuração Vercel
└── README.md
```

## 🐛 Troubleshooting

### Build falha

- Verifique se todas as dependências estão no `package.json`
- Confirme que o caminho do `outputDirectory` está correto

### API não funciona

- Verifique se as variáveis de ambiente estão configuradas
- Confirme que AWS CLI está disponível no ambiente Vercel
- Verifique os logs em **Deployments > Function Logs**

### SSH não conecta

- Verifique se `PEM_CONTENT` está corretamente formatado
- Confirme que o security group permite conexões SSH
- Teste as credenciais localmente primeiro

## 📞 Suporte

Para problemas, abra uma issue no GitHub!
