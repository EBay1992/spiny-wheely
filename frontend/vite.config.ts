import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/health': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/player': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
