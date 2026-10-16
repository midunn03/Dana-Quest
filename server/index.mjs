import { createServer } from 'node:http'
import { recommendationsApi } from './recommendations.mjs'
import { authApi } from './auth.mjs'
import { placesApi } from './places.mjs'
import { navigationApi } from './navigation.mjs'

const port = Number(process.env.API_PORT ?? 3001)
const host = process.env.API_HOST ?? '127.0.0.1'

const server = createServer((request, response) => {
  authApi(request, response, () => placesApi(request, response, () => recommendationsApi(request, response, () => navigationApi(request, response, () => {
    response.statusCode = 404
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ error: 'Not found' }))
  }))))
})

server.listen(port, host, () => console.log(`DANA QUEST API listening on http://${host}:${port}`))
