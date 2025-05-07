import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'three': resolve(__dirname, 'node_modules/three/build/three.module.js'),
      'three/addons': resolve(__dirname, 'node_modules/three/examples/jsm')
    }
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  },
  server: {
    host: true
  }
});
