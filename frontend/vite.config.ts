import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiTarget = process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // changeOrigin: false — Django видит Host localhost:5173, а не web:8000 (его нет в ALLOWED_HOSTS)
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
      '/media': { target: apiTarget, changeOrigin: false },
    },
    watch: {
      usePolling: process.env.VITE_USE_POLLING === '1',
    },
  },
})
