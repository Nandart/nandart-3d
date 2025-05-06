import { defineConfig } from 'vite';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
  plugins: [
    nodeResolve({
      browser: true,
      dedupe: ['three']
    }),
    commonjs()
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: './index.html'
    }
  },
  resolve: {
    alias: {
      'three/examples/jsm/': new URL('./node_modules/three/examples/jsm/', import.meta.url).pathname
    }
  }
});
