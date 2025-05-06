import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    nodePolyfills({
      protocolImports: true
    })
  ],
  resolve: {
    alias: {
      'three/examples/jsm/': 'three/examples/jsm/',
      'three': 'three/build/three.module.js'
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['three', 'three/examples/jsm/**'],
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
})
