import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'esbuild', // Use esbuild instead of terser (faster and built-in)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  base: './', // Use relative paths for assets
});
