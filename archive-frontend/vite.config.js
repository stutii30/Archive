import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Ensure HMR connects cleanly to the matching host/port
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
    proxy: {
      // Proxy all /api/* requests to the Spring Boot backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
