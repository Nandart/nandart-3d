import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: process.env.BASE_URL || '/', // Define a base URL para produção
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Avisa se chunks ultrapassarem 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], // Exemplo de chunk para dependências comuns
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src', // Alias para facilitar os imports
    },
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000, // Porta configurável via variável de ambiente
    open: process.env.OPEN_BROWSER === 'true', // Abre o navegador automaticamente baseado em variável de ambiente
    strictPort: true, // Garante que a porta especificada será usada
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
});

