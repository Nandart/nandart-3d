import { defineConfig } from 'vite'
import basicPlugin from '@vitejs/plugin-basic'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/nandart-3d/',
  plugins: [basicPlugin()],
})

