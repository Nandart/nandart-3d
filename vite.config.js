import { defineConfig } from 'vite';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig({
  plugins: [
    nodeResolve(),  
    commonjs(),     
  ],
  build: {
    target: 'esnext',  
    outDir: 'dist',    
    emptyOutDir: true, 
  },
  server: {
    port: 3000,        
    open: true,        
  },
});
