import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/n8n-chat': {
        target: 'https://uday1997.app.n8n.cloud',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/n8n-chat/, ''),
      },
    },
  },
})