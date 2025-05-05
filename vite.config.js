import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // Define o diretório raiz
  base: process.env.BASE_URL || '/', // Define a base URL para produção
  build: {
    outDir: 'dist', // Diretório de saída para os arquivos de build
    target: 'esnext', // Define o alvo ES para compatibilidade moderna
    sourcemap: true, // Gera mapas de sourcemap para depuração
  },
  resolve: {
    alias: {
      '@': '/src', // Alias para facilitar os imports
    },
  },
  server: {
    port: 3000, // Porta padrão do servidor de desenvolvimento
    open: true, // Abre automaticamente o navegador após iniciar o servidor
  },
});
