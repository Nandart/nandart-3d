import { defineConfig } from 'vite'
import commonjs from '@rollup/plugin-commonjs'

// Configuração mínima necessária
export default defineConfig({
  plugins: [commonjs()],
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
})
