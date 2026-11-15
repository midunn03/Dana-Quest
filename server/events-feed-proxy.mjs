const sendError = (response, status, message) => {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify({ error: message }))
}

export function createEventsFeedProxy({
  host = process.env.DJANGO_HOST ?? '127.0.0.1',
  port = Number(process.env.DJANGO_PORT ?? 8000),
  fetchImpl = fetch,
} = {}) {
  return async function eventsFeedProxy(request, response, next) {
    let url
    try {
      url = new URL(request.url ?? '/', 'http://localhost')
    } catch {
      return sendError(response, 400, 'Invalid request URL')
    }
    if (url.pathname !== '/api/events/feed') return next()
    if (request.method !== 'GET') return sendError(response, 405, 'Method not allowed')

    const upstreamUrl = new URL(`${url.pathname}${url.search}`, `http://${host}:${port}`)
    try {
      const upstream = await fetchImpl(upstreamUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      })
      const body = await upstream.text()
      if (!upstream.ok) return sendError(response, upstream.status, 'Event feed is temporarily unavailable')
      try {
        JSON.parse(body)
      } catch {
        return sendError(response, 502, 'Event feed returned invalid data')
      }
      response.statusCode = upstream.status
      response.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'no-store')
      response.end(body)
    } catch {
      sendError(response, 503, 'Event feed is temporarily unavailable')
    }
  }
}

export const eventsFeedProxy = createEventsFeedProxy()
