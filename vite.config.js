import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: process.env.BASE_URL || '/',
  
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true,
    assetsInlineLimit: 4096, // Otimização para assets pequenos
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, '/src'), // Caminho absoluto mais seguro
    },
  },
  
  server: {
    port: 3000,
    open: true,
    // Configurações críticas para módulos ES e Three.js:
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    fs: {
      strict: false // Permite carregar assets de fora do diretório raiz
    }
  },
  
  optimizeDeps: {
    // Opcional: se quiser pré-empacotar dependências
    include: ['gsap'] 
  }
});
