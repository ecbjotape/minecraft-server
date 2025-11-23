# 🔐 Segurança - Informações Importantes

## ⚠️ DADOS SENSÍVEIS - NÃO COMMITAR

**NUNCA commite os seguintes arquivos:**

### Arquivos Protegidos pelo .gitignore

- ✅ `.env` - Suas configurações locais
- ✅ `*.pem` - Chaves SSH privadas
- ✅ `*.key` - Outras chaves privadas
- ✅ `node_modules/` - Dependências
- ✅ `.vercel/` - Cache da Vercel

### Informações Sensíveis

❌ **NUNCA exponha:**

1. **INSTANCE_ID** - ID da sua instância EC2
2. **EIP** (Elastic IP) - IP público do servidor
3. **PEM_PATH** - Caminho ou conteúdo da chave SSH
4. **AWS_ACCESS_KEY_ID** - Credenciais AWS
5. **AWS_SECRET_ACCESS_KEY** - Chave secreta AWS

## ✅ Como Configurar Corretamente

### 1. Arquivo .env (Local)

Crie seu arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite `.env` com seus dados reais:

```bash
INSTANCE_ID=i-038eaed995b5e484f
EIP=3.133.214.110
USER=ubuntu
PEM_PATH=/caminho/para/sua/chave.pem
```

### 2. Variáveis na Vercel

Configure no painel da Vercel em **Settings > Environment Variables**:

```
INSTANCE_ID=i-xxxxxxxxxxxxxxxxx
EIP=x.x.x.x
USER=ubuntu
PEM_CONTENT=<conteúdo da chave>
AWS_ACCESS_KEY_ID=<sua chave>
AWS_SECRET_ACCESS_KEY=<sua secret>
AWS_REGION=us-east-1
```

### 3. IP no Frontend

Edite `web/src/App.vue` e atualize:

```typescript
const serverIP = ref("SEU-IP-AQUI"); // ← Substitua pelo seu IP
```

## 🔍 Verificar Antes de Commitar

```bash
# Verifique o que será commitado
git status

# Veja as mudanças
git diff

# Certifique-se que .env não está listado
git ls-files | grep .env

# Se .env aparecer, remova do tracking
git rm --cached .env
```

## 🚨 Se Expor Dados Acidentalmente

### 1. Remova do Git Imediatamente

```bash
# Remova o arquivo
git rm --cached .env

# Adicione ao .gitignore se não estiver
echo ".env" >> .gitignore

# Commit a remoção
git add .gitignore
git commit -m "chore: Remove sensitive data"
git push --force
```

### 2. Revogue as Credenciais

- ⚠️ **AWS Keys**: Desative imediatamente no IAM Console
- ⚠️ **SSH Keys**: Gere um novo par de chaves
- ⚠️ **Tokens**: Revogue e gere novos

### 3. Limpe o Histórico (se necessário)

```bash
# Use BFG Repo Cleaner ou git filter-branch
# Consulte: https://rtyley.github.io/bfg-repo-cleaner/
```

## 🛡️ Boas Práticas

### 1. Use IAM Roles com Permissões Mínimas

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:DescribeInstances"
      ],
      "Resource": "arn:aws:ec2:*:*:instance/i-xxxxxxxxxxxxxxxxx"
    }
  ]
}
```

### 2. Implemente Autenticação no Frontend

Para produção, adicione:

- 🔑 Login com senha
- 🔐 JWT tokens
- 👥 Sistema de usuários
- 📱 2FA (autenticação de dois fatores)

### 3. Use Secrets Manager

Considere usar:

- AWS Secrets Manager
- AWS Systems Manager Parameter Store
- HashiCorp Vault

### 4. Monitore Acessos

- 📊 CloudWatch Logs
- 🔔 SNS Notifications
- 🚨 CloudTrail para auditoria

## 📝 Checklist Antes do Commit

- [ ] `.env` está no `.gitignore`?
- [ ] Nenhum IP ou credencial no código?
- [ ] Tokens e keys estão em variáveis de ambiente?
- [ ] `.pem` e `.key` estão protegidos?
- [ ] Rodou `git status` e verificou?
- [ ] README não contém dados sensíveis?

## 🔗 Links Úteis

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [GitHub Security](https://docs.github.com/en/code-security)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

⚠️ **Lembre-se: É melhor ser paranóico com segurança do que ter suas credenciais expostas!**
