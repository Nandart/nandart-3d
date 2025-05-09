import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        comoNavegar: resolve(__dirname, 'como-navegar.html'),
        info: resolve(__dirname, 'info.html'),
        contactos: resolve(__dirname, 'contactos.html')
      }
    }
  },
  server: {
    open: true
  }
});

