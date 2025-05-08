import { defineConfig } from 'vite';
import { resolve } from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  base: '/',
  publicDir: 'assets',
  plugins: [
    nodeResolve({
      browser: true,
      dedupe: ['three'],
      extensions: ['.js']
    })
  ],
  resolve: {
    alias: {
      'three': resolve(__dirname, 'node_modules/three/build/three.module.js'),
      'three/examples/jsm': resolve(__dirname, 'node_modules/three/examples/jsm')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      external: [
        'three/examples/jsm/loaders/FontLoader.js',
        'three/examples/jsm/geometries/TextGeometry.js'
      ]
    }
  }
});
