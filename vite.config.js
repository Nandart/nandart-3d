import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ['path', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      }
    })
  ],
  optimizeDeps: {
    include: ['three', 'gsap'],
    exclude: ['three/examples/jsm/**']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /three/, /gsap/],
      transformMixedEsModules: true
    }
  }
})
