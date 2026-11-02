import { createServer, request as httpRequest } from 'node:http'
import { recommendationsApi } from './recommendations.mjs'
import { authApi } from './auth.mjs'
import { placesApi } from './places.mjs'
import { navigationApi } from './navigation.mjs'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const port = Number(process.env.API_PORT ?? 3001)
const host = process.env.API_HOST ?? '127.0.0.1'
const djangoHost = process.env.DJANGO_HOST ?? '127.0.0.1'
const djangoPort = Number(process.env.DJANGO_PORT ?? 8000)
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.png': 'image/png' }

function proxyDjango(request, response, next) {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
  if (!pathname.startsWith('/api/pixel') && !pathname.startsWith('/media') && !pathname.startsWith('/api/events')) {
    return next()
  }
  const headers = { ...request.headers, host: `${djangoHost}:${djangoPort}` }
  const proxyReq = httpRequest({
    hostname: djangoHost,
    port: djangoPort,
    path: request.url,
    method: request.method,
    headers,
  }, (proxyRes) => {
    response.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
    proxyRes.pipe(response)
  })
  proxyReq.on('error', () => next())
  request.pipe(proxyReq)
}

function serveWebsite(request, response) {
  if (!existsSync(dist)) { response.statusCode = 404; response.end(JSON.stringify({ error: 'Not found' })); return }
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
  const relative = normalize(pathname).replace(/^([/\\])+/, '')
  let filename = join(dist, relative || 'index.html')
  if (!filename.startsWith(dist) || !existsSync(filename) || statSync(filename).isDirectory()) filename = join(dist, 'index.html')
  response.statusCode = 200
  response.setHeader('Content-Type', contentTypes[extname(filename)] ?? 'application/octet-stream')
  response.setHeader('Cache-Control', filename.endsWith('index.html') || filename.endsWith('sw.js') ? 'no-cache' : 'public, max-age=31536000, immutable')
  createReadStream(filename).pipe(response)
}

const server = createServer((request, response) => {
  proxyDjango(request, response, () => authApi(request, response, () => placesApi(request, response, () => recommendationsApi(request, response, () => navigationApi(request, response, () => {
    serveWebsite(request, response)
  })))))
})

server.listen(port, host, () => console.log(`DANA QUEST listening on http://${host}:${port}`))
