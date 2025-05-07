import { defineConfig } from 'vite';
import { resolve } from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  plugins: [
    nodeResolve({
      browser: true,
      dedupe: ['three'],
      extensions: ['.js']
    })
  ],
  resolve: {
    alias: {
      'three/examples/jsm/': resolve(__dirname, 'node_modules/three/examples/jsm/'),
      'three': resolve(__dirname, 'node_modules/three/build/three.module.js')
    }
  },
  build: {
    target: 'esnext'
  }
});
