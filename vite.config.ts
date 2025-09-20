import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // JSX runtime configuration for React 18
      jsxRuntime: 'automatic'
    })
  ],

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
    force: true
  },

  server: {
    host: true,
    port: 5174,
    strictPort: false,
    hmr: {
      port: 5174
    }
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },
    sourcemap: false,
    minify: 'esbuild'
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});