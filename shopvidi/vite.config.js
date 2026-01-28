import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/n8n': {
        target: 'https://n8n.merakku.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
        timeout: 300000,  // 5分钟超时
      },
    },
  },
})
