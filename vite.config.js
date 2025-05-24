import { defineConfig } from 'vite';
import { resolve } from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  base: './',
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
          ethers: ['ethers']
        }
      }
    }
  },
  server: {
    https: true,
    open: true
  }
});
