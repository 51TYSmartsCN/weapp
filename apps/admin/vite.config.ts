import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // admin 后台服务端口
    port: 4005,
    // 允许任意 host 访问（局域网调试方便）
    host: true,
    // 将 /api 与 /images 请求代理到后端服务（geo-course-server，默认监听 4000）
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
