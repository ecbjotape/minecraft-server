# 🚀 Instalação da Interface Web

Este guia explica como instalar e executar a interface web localmente.

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm (vem com Node.js)

## 💻 Instalação Local

### 1. Instalar dependências

```bash
cd web
npm install
```

### 2. Configurar ambiente de desenvolvimento

Crie um arquivo `.env.local` na pasta `web/`:

```bash
VITE_API_URL=http://localhost:3000/api
```

### 3. Executar em modo desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em: `http://localhost:3000`

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão em `web/dist/`

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Compila para produção
- `npm run preview` - Preview da build de produção
- `npm run type-check` - Verifica tipos TypeScript

## 🐛 Troubleshooting

### Erro ao instalar dependências

```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Porta 3000 já em uso

Modifique `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3001, // ou qualquer porta disponível
  },
});
```

### Build falha

```bash
# Verificar tipos
npm run type-check

# Limpar e rebuild
rm -rf dist
npm run build
```

## 🎨 Customização

### Alterar tema de cores

Edite `src/style.css` e modifique as variáveis CSS:

```css
:root {
  --bg-primary: #0a0e27;
  --accent-green: #4ade80;
  /* ... */
}
```

### Adicionar novos recursos

1. Crie um novo componente em `src/components/`
2. Importe no `App.vue`
3. Adicione a API correspondente em `/api/`

## 📚 Documentação

- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Vercel](https://vercel.com/docs)
