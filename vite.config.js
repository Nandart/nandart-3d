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
    rollupOptions: {
      external: ['three', 'three/addons/loaders/FontLoader', 'three/addons/geometries/TextGeometry']
    }
  }
});
