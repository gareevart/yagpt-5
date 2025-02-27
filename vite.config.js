import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/yandex': {
        target: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yandex/, '')
      }
    }
  }
})