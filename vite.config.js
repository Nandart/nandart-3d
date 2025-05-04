import { defineConfig } from 'vite';

export default {
  root: '/nandart-3d/',
};
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
});
