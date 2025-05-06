import { defineConfig } from 'vite';
import { resolve } from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  root: resolve(__dirname, './'),  // Define a raiz explicitamente
  plugins: [
    nodeResolve({
      browser: true,
      dedupe: ['three'],
      extensions: ['.js', '.json']
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      preserveEntrySignatures: 'strict'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),  // Alias absoluto
      'three': resolve(__dirname, 'node_modules/three/build/three.module.js')
    },
    dedupe: ['three']  // Evita duplicação
  },
  base: './'  // Base relativa para todos os assets
});
