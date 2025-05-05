import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Caminho relativo para funcionar bem em GitHub Pages e Vercel
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