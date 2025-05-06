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
      'three': 'three/build/three.module.js',
      'three/addons/': 'three/examples/jsm/'
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['three']
    }
  }
})
