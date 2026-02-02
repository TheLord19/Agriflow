import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 1. Redirect API calls to the Backend
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
      // 2. Redirect Socket.io connections to the Backend
      '/socket.io': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:4001',
        changeOrigin: true,
        ws: true, // Important for WebSockets
      },
    },
  },
})