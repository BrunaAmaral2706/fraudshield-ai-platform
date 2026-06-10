import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vercel → base '/'. GitHub Pages → set VITE_BASE_PATH=/fraudshield-ai-platform/
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig(() => ({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
}))
