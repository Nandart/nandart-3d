iimport { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: process.env.BASE_URL || '/',
  
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true,
    assetsInlineLimit: 4096,
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, '/src'),
    },
  },
  
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    fs: {
      strict: false
    }
  },
  
  optimizeDeps: {
    include: ['gsap']
  }
});
    include: ['gsap'] 
  }
});
