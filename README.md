# 🎮 Minecraft Server AWS Manager

Scripts para gerenciar um servidor Minecraft hospedado em uma instância EC2 da AWS.

## 📋 Descrição

Este projeto contém scripts bash para facilitar o gerenciamento de um servidor Minecraft rodando em uma instância Amazon EC2. Os scripts permitem iniciar/parar a instância EC2 e iniciar o servidor Minecraft remotamente via SSH.

## ✨ Funcionalidades

- 🚀 **Iniciar instância EC2** - Liga a instância AWS
- 🛑 **Parar instância EC2** - Desliga a instância AWS para economizar custos
- 🎮 **Iniciar servidor Minecraft** - Conecta via SSH e inicia o servidor Minecraft em uma sessão screen

## 📦 Pré-requisitos

- [AWS CLI](https://aws.amazon.com/cli/) instalado e configurado
- Chave PEM da instância EC2
- Acesso SSH à instância EC2
- Bash (Linux/MacOS/WSL/Git Bash no Windows)

## ⚙️ Configuração

1. Clone este repositório:

```bash
git clone https://github.com/seu-usuario/minecraft-server.git
cd minecraft-server
```

2. Copie o arquivo de configuração de exemplo:

```bash
cp .env.example .env
```

3. Edite o arquivo `.env` com suas informações:

```bash
nano .env  # ou use seu editor preferido
```

Configure as seguintes variáveis:

- `INSTANCE_ID` - ID da sua instância EC2
- `PEM_PATH` - Caminho para o arquivo .pem da sua chave SSH
- `EIP` - Elastic IP ou IP público da instância
- `USER` - Usuário SSH (geralmente "ubuntu" ou "ec2-user")
- `AWS_REGION` - Região AWS (opcional, padrão: us-east-1)

4. Configure as permissões corretas para a chave PEM:

```bash
chmod 400 sua-chave.pem
```

5. Torne os scripts executáveis:

```bash
chmod +x *.sh
```

## 🚀 Uso

### Iniciar a instância EC2

```bash
./start-ec2.sh
```

### Iniciar o servidor Minecraft

Aguarde alguns segundos após iniciar a EC2, depois execute:

```bash
./start-server.sh
```

### Parar a instância EC2

Quando terminar de jogar:

```bash
./stop-ec2.sh
```

## 📁 Estrutura do Projeto

```
minecraft-server/
├── README.md           # Este arquivo
├── LICENSE            # Licença MIT
├── .env.example       # Exemplo de configuração
├── .env               # Suas configurações (não versionado)
├── .gitignore         # Arquivos ignorados pelo Git
├── scripts/
│   └── load_env.sh    # Utilitário para carregar variáveis
├── start-ec2.sh       # Script para iniciar EC2
├── start-server.sh    # Script para iniciar servidor Minecraft
├── stop-ec2.sh        # Script para parar EC2
└── *.pem              # Chaves SSH (não versionadas)
```

## 🔒 Segurança

⚠️ **IMPORTANTE**: Nunca commite arquivos sensíveis ao repositório!

Os seguintes arquivos são ignorados pelo Git:

- `*.pem` - Chaves SSH
- `.env` - Suas configurações pessoais
- `*.key` - Qualquer outro arquivo de chave

### Por que usar `.env`?

O arquivo `.env` é o padrão da indústria para armazenar configurações:

- ✅ Formato universal reconhecido por várias ferramentas
- ✅ Não é executável, apenas contém variáveis
- ✅ Validação automática de configurações obrigatórias
- ✅ Mensagens de erro claras se algo estiver faltando

## 🛠️ Personalização

### Ajustar memória do servidor

Edite o arquivo `start-server.sh` e modifique os parâmetros `-Xmx` e `-Xms`:

```bash
java -Xmx2048M -Xms2048M -jar minecraft_server.jar nogui
```

### Acessar o console do servidor

Conecte-se via SSH e anexe à sessão screen:

```bash
ssh -i sua-chave.pem ubuntu@SEU-IP
screen -r minecraft
```

Para sair sem parar o servidor, pressione `Ctrl+A` seguido de `D`.

## 🐛 Troubleshooting

### Erro de permissão na chave PEM

```bash
chmod 400 sua-chave.pem
```

### AWS CLI não configurado

```bash
aws configure
```

### Porta 25565 não acessível

Verifique o Security Group da EC2 e libere a porta 25565 (TCP).

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no GitHub.

---

⭐ Se este projeto foi útil, considere dar uma estrela!
