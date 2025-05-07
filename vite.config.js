import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^three$/,
        replacement: 'three/build/three.module.js'
      },
      {
        find: /^three\/examples\/jsm\/(.*)$/,
        replacement: 'three/examples/jsm/$1'
      }
    ]
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['three', 'three/examples/jsm/loaders/FontLoader', 'three/examples/jsm/geometries/TextGeometry']
    }
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/loaders/FontLoader', 'three/examples/jsm/geometries/TextGeometry']
  }
});
