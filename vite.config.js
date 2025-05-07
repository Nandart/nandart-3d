import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'three',
        replacement: 'three/build/three.module.js'
      },
      {
        find: 'three/addons',
        replacement: 'three/examples/jsm'
      }
    ]
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['three', 'three/addons/loaders/FontLoader.js', 'three/addons/geometries/TextGeometry.js']
    }
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/loaders/FontLoader', 'three/examples/jsm/geometries/TextGeometry']
  }
});
