// File: backend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    headers: {
      // Content Security Policy to allow Paddle scripts
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://js.paddle.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.paddle.com https://*.supabase.co https://qcdapfobdsqvzmagimvr.supabase.co wss://*.supabase.co",
        "frame-src https://checkout.paddle.com https://*.paddle.com",
      ].join('; ')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          paddle: ['@paddle/paddle-js'] // if using paddle npm package
        }
      }
    }
  }
})
