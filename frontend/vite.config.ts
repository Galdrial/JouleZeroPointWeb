import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig( {
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        timeout: 120000,
        proxyTimeout: 120000,
        configure: ( proxy ) => {
          // Disable response buffering for SSE streaming
          proxy.on( 'proxyRes', ( proxyRes ) => {
            // Force chunked encoding to prevent buffering
            if ( proxyRes.headers['content-type']?.includes( 'text/event-stream' ) ) {
              proxyRes.headers['cache-control'] = 'no-cache';
              proxyRes.headers['x-accel-buffering'] = 'no';
            }
          } );
        }
      }
    }
  },
  build: {
    modulePreload: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks( id ) {
          if ( id.includes( 'highlight.js' ) || id.includes( 'marked' ) || id.includes( 'dompurify' ) ) {
            return 'editor-bundle';
          }
          if ( id.includes( 'node_modules' ) ) {
            return 'vendor';
          }
        }
      }
    }
  }
} )
