import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // raiz do projeto
  base: './', // base relativa
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
