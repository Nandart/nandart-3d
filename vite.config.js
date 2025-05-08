import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // Raiz do projeto
  base: '/', // Base URL para produção
  build: {
    outDir: 'dist', // Pasta de saída
    emptyOutDir: true,
    target: 'esnext',
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': '/src', // Atalho para facilitar imports
    },
  },
  server: {
    port: 3000,
    open: true
  }
});
