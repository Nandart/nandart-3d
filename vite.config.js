import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/objects/Reflector',
      'three/examples/jsm/loaders/FontLoader',
      'three/examples/jsm/geometries/TextGeometry'
    ]
  }
});