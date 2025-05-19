import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      'three': resolve(__dirname, 'node_modules/three/build/three.module.js'),
      'three/addons/': resolve(__dirname, 'node_modules/three/examples/jsm/')
    }
  },
  build: {
    rollupOptions: {
      external: ['three', 'three/addons/*', 'gsap', 'ethers'],
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
          ethers: ['ethers']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/objects/Reflector',
      'three/examples/jsm/loaders/FontLoader',
      'three/examples/jsm/geometries/TextGeometry',
      'gsap',
      'ethers'
    ],
    exclude: ['three/examples/jsm/controls/OrbitControls']
  }
})