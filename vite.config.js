import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // A raiz é o próprio diretório do projeto
  base: './', // Importante para GitHub Pages e Vercel
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      input: './index.html'
    }
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
