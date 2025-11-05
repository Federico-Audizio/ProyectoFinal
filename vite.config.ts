import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: {
      // Permitir servir archivos desde node_modules
      allow: ['..'],
    },
  },
  optimizeDeps: {
    include: ['eyegestures'],
  },
  build: {
    // Asegurarse de que eyegestures.js se copie durante el build
    rollupOptions: {
      external: ['eyegestures'],
    },
  },
});
