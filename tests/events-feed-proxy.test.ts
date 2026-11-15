import { expect, it, vi } from 'vitest'
import { createEventsFeedProxy } from '../server/events-feed-proxy.mjs'

function responseFixture() {
  const headers: Record<string, string> = {}
  let body = ''
  return {
    response: {
      statusCode: 200,
      setHeader(name: string, value: string) { headers[name] = value },
      end(value = '') { body = String(value) },
    },
    body: () => body,
    headers,
  }
}

it('proxies the Django feed and forwards the query without caching', async () => {
  const fetchImpl = vi.fn(async () => new Response('{"items":[]}', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
  const proxy = createEventsFeedProxy({ host: '127.0.0.1', port: 8000, fetchImpl })
  const result = responseFixture()

  await proxy({ url: '/api/events/feed?days=14', method: 'GET' }, result.response, () => {
    throw new Error('Feed request must not fall through to the SPA')
  })

  expect(fetchImpl).toHaveBeenCalledOnce()
  expect(String(fetchImpl.mock.calls[0][0])).toBe('http://127.0.0.1:8000/api/events/feed?days=14')
  expect(result.response.statusCode).toBe(200)
  expect(result.headers['Cache-Control']).toBe('no-store')
  expect(JSON.parse(result.body())).toEqual({ items: [] })
})

it('returns an explicit API error when Django is unavailable', async () => {
  const proxy = createEventsFeedProxy({ fetchImpl: async () => { throw new Error('offline') } })
  const result = responseFixture()

  await proxy({ url: '/api/events/feed', method: 'GET' }, result.response, () => {
    throw new Error('Feed failure must not fall through to the SPA')
  })

  expect(result.response.statusCode).toBe(503)
  expect(result.headers['Content-Type']).toContain('application/json')
  expect(JSON.parse(result.body())).toMatchObject({ error: expect.any(String) })
})

it('rejects a successful upstream response that is not valid JSON', async () => {
  const proxy = createEventsFeedProxy({ fetchImpl: async () => new Response('<html>error</html>', { status: 200 }) })
  const result = responseFixture()

  await proxy({ url: '/api/events/feed', method: 'GET' }, result.response, () => {
    throw new Error('Invalid feed data must not fall through to the SPA')
  })

  expect(result.response.statusCode).toBe(502)
  expect(result.headers['Content-Type']).toContain('application/json')
  expect(JSON.parse(result.body())).toMatchObject({ error: expect.any(String) })
})

it('does not intercept unrelated routes and rejects other methods', async () => {
  const fetchImpl = vi.fn()
  const proxy = createEventsFeedProxy({ fetchImpl })
  let nextCalled = false
  const result = responseFixture()

  await proxy({ url: '/api/events/other', method: 'GET' }, result.response, () => { nextCalled = true })
  expect(nextCalled).toBe(true)
  expect(fetchImpl).not.toHaveBeenCalled()

  await proxy({ url: '/api/events/feed', method: 'POST' }, result.response, () => {
    throw new Error('Unsupported methods must not fall through')
  })
  expect(result.response.statusCode).toBe(405)
  expect(fetchImpl).not.toHaveBeenCalled()
})
