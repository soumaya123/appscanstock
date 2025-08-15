import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration Vite adaptée à Electron (chargement file://)
// base: './' garantit des chemins relatifs pour les assets dans dist/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});
