import { defineConfig } from 'vite';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  plugins: [
    nodeResolve(),
    commonjs()
  ],
  resolve: {
    alias: {
      'three': 'three/build/three.module.js',
      'three/addons/': 'three/examples/jsm/'
    }
  },
  build: {
    target: 'esnext'
  }
});
