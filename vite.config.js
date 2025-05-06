import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'three/examples/jsm/': resolve(__dirname, 'node_modules/three/examples/jsm/')
    }
  },
  build: {
    rollupOptions: {
      external: ['three/examples/jsm/loaders/FontLoader.js']
    }
  }
});

