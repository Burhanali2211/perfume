import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|avif)$/i,
      exclude: undefined,
      include: undefined,
      includePublic: true,
      logStats: true,
      ansiColors: true,
      png: {
        quality: 80,
        palette: true,
        compressionLevel: 9,
        adaptiveFiltering: true,
      },
      jpeg: {
        quality: 80,
        mozjpeg: true,
      },
      jpg: {
        quality: 80,
        mozjpeg: true,
      },
      webp: {
        quality: 80,
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
      },
      avif: {
        quality: 60,
        lossless: false,
        speed: 4,
      },
    })
  ],

  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  server: {
    host: 'localhost',
    port: 5179,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5179
    }
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion'],
          icons: ['lucide-react'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js']
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Generate CSS sourcemaps in development
    sourcemap: process.env.NODE_ENV === 'development',
    // Minify with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: true,
      format: {
        comments: false
      }
    },
    // Enable brotli compression
    brotliSize: true,
  },
  
  // Optimize assets
  assetsInclude: ['**/*.JPG', '**/*.jpeg', '**/*.png', '**/*.webp', '**/*.avif'],
  
  // Enable brotli compression
  esbuild: {
    drop: ['console', 'debugger']
  }
});