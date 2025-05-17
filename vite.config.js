import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        info: resolve(__dirname, 'info.html'),
        contactos: resolve(__dirname, 'contactos.html'),
        'como-navegar': resolve(__dirname, 'como-navegar.html'),
        artistas: resolve(__dirname, 'artistas.html'),
        web3: resolve(__dirname, 'web3.html')
      }
    }
  },
  server: {
    open: true
  }
});
