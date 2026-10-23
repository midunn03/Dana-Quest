import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { recommendationsApi } from './server/recommendations.mjs'
import { placesApi } from './server/places.mjs'
import { navigationApi } from './server/navigation.mjs'

// https://vite.dev/config/
export default defineConfig({
<<<<<<< HEAD
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.data/**'] },
    // Tài khoản do Django xử lý (chạy ở cổng 8000)
    proxy: {
    '/api/auth': 'http://127.0.0.1:8000',
    '/api/pixel': 'http://127.0.0.1:8000',
    '/media': 'http://127.0.0.1:8000',
      '/api/events': 'http://127.0.0.1:8000'},
  },
=======
  base: process.env.GITHUB_ACTIONS ? '/Dana-Quest/' : '/',
  server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.data/**'] } },
>>>>>>> origin/main
  plugins: [react(), {
    name: 'nearby-recommendations-api',
    configureServer(server) { server.middlewares.use(placesApi); server.middlewares.use(recommendationsApi); server.middlewares.use(navigationApi) },
    configurePreviewServer(server) { server.middlewares.use(placesApi); server.middlewares.use(recommendationsApi); server.middlewares.use(navigationApi) },
  }],
})