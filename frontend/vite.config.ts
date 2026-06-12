import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'http://127.0.0.1:3000'

/** Shared proxy for dev server and `vite preview` (local production build testing). */
const apiProxy: Record<string, ProxyOptions> = {
  '/health': {
    target: API_TARGET,
    changeOrigin: true,
  },
  '/player': {
    target: API_TARGET,
    changeOrigin: true,
  },
  // Proxy API subpaths only — never `/admin` itself (SPA route).
  '/admin/auth': {
    target: API_TARGET,
    changeOrigin: true,
  },
  '/admin/metrics': {
    target: API_TARGET,
    changeOrigin: true,
  },
  '/admin/games': {
    target: API_TARGET,
    changeOrigin: true,
  },
  '/wheel': {
    target: API_TARGET,
    ws: true,
    changeOrigin: true,
  },
  '/socket.io': {
    target: API_TARGET,
    ws: true,
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    host: true,
    port: 4173,
    proxy: apiProxy,
  },
})
