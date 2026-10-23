import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { authApi } from './server/auth.mjs'
import { recommendationsApi } from './server/recommendations.mjs'
import { placesApi } from './server/places.mjs'
import { navigationApi } from './server/navigation.mjs'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Dana-Quest/' : '/',
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.data/**'] },
    proxy: {
      '/api/pixel': 'http://127.0.0.1:8000',
      '/media': 'http://127.0.0.1:8000',
      '/api/events': 'http://127.0.0.1:8000',
    },
  },
  plugins: [react(), {
    name: 'nearby-recommendations-api',
    configureServer(server) { server.middlewares.use(authApi); server.middlewares.use(placesApi); server.middlewares.use(recommendationsApi); server.middlewares.use(navigationApi) },
    configurePreviewServer(server) { server.middlewares.use(authApi); server.middlewares.use(placesApi); server.middlewares.use(recommendationsApi); server.middlewares.use(navigationApi) },
  }],
})