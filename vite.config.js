import { defineConfig } from 'vite';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs()
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['three', 'three/examples/jsm/loaders/FontLoader', 'three/examples/jsm/geometries/TextGeometry']
    }
  }
});
