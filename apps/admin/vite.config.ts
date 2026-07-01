import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const adminBase = mode === 'production' ? '/admin/' : '/'

  return {
    base: adminBase,
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor'
              }
              if (id.includes('antd') || id.includes('@ant-design')) {
                return 'antd-vendor'
              }
              if (id.includes('recharts')) {
                return 'chart-vendor'
              }
              if (id.includes('axios') || id.includes('dayjs')) {
                return 'utils-vendor'
              }
              return 'vendor'
            }
          },
        },
      },
    },
    server: {
      port: 4005,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log(`[Vite Proxy] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}${proxyReq.path}`)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(`[Vite Proxy] ${req.method} ${req.url} <- ${proxyRes.statusCode}`)
            })
            proxy.on('error', (err, req) => {
              console.error(`[Vite Proxy Error] ${req.method} ${req.url}:`, err.message)
            })
          },
        },
        '/images': {
          target: env.VITE_PROXY_TARGET,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log(`[Vite Proxy] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}${proxyReq.path}`)
            })
            proxy.on('error', (err, req) => {
              console.error(`[Vite Proxy Error] ${req.method} ${req.url}:`, err.message)
            })
          },
        },
      },
    },
  }
})
