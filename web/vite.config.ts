import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Fallback para modo desenvolvimento sem backend
          proxy.on('error', (err, req, res) => {
            console.log('⚠️  API não disponível, usando modo desenvolvimento')
          })
        }
      }
    }
  },
  define: {
    // Permite usar variáveis de ambiente no frontend
    'import.meta.env.VITE_DEV_MODE': JSON.stringify(process.env.NODE_ENV === 'development')
  }
});
