import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  plugins: [
    react({
      // Optimize React refresh for faster dev builds
      fastRefresh: true,
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: isDev ? [] : ['babel-plugin-transform-remove-console']
      }
    })
  ],
  
  server: {
    cors: true,
    host: true,
    port: 3000,
    // Remove heavy headers in development
    headers: isDev ? {} : {
      'Cross-Origin-Embedder-Policy': 'credentialless',
    }
  },
  
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    // Optimize build performance
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion']
        }
      },
      external: [
        '@babel/parser',
        '@babel/traverse', 
        '@babel/generator',
        '@babel/types'
      ]
    },
    
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js'
    ],
    exclude: ['@babel/parser', '@babel/traverse']
  },
  
  // Remove development overhead in production
  define: {
    __DEV__: isDev
  }
});
