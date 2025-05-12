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
 
        info: resolve(__dirname, 'info.html'),
   
      }
    }
  },
  server: {
    open: true
  }
});
