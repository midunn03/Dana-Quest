import { afterEach, expect, it, vi } from 'vitest'
import { routeProgress, turnText } from '../src/lib/routing'
import { walkingFixture, routePoints } from './routing-fixture'
import { distanceMeters } from '../src/lib/location'
import { navigationApi } from '../server/navigation.mjs'
import type { IncomingMessage, ServerResponse } from 'node:http'
afterEach(() => vi.unstubAllGlobals())
const sample = (latitude: number, longitude: number) => ({ latitude, longitude, accuracy: 10, timestamp: Date.now() })
it('counts down along road geometry, advances turns after passing them, and measures off-route distance', () => {
  const start = routeProgress(walkingFixture, sample(...routePoints[0]))
  const nearer = routeProgress(walkingFixture, sample(16.08, 108.235))
  expect(start.next.maneuver.modifier).toBe('left')
  expect(nearer.toTurn).toBeLessThan(start.toTurn)
  expect(start.remaining).toBeGreaterThan(distanceMeters(routePoints[0], routePoints[3]))
  expect(routeProgress(walkingFixture, sample(...routePoints[1])).toTurn).toBeCloseTo(0)
  const passed = routeProgress(walkingFixture, sample(16.0798, 108.23))
  expect(passed.next.maneuver.modifier).toBe('right')
  expect(passed.remaining).toBeLessThan(nearer.remaining)
  expect(routeProgress(walkingFixture, sample(16.09, 108.25)).offRoute).toBeGreaterThan(500)
})
it('renders Vietnamese left, right, U-turn, roundabout and arrival directions', () => {
  const step = walkingFixture.legs[0].steps[1]
  expect(turnText(step)).toBe('Rẽ trái vào Đường B')
  expect(turnText({ ...step, maneuver: { ...step.maneuver, modifier: 'right' } })).toBe('Rẽ phải vào Đường B')
  expect(turnText({ ...step, maneuver: { ...step.maneuver, modifier: 'uturn' } })).toContain('Quay đầu')
  expect(turnText({ ...step, maneuver: { ...step.maneuver, type: 'roundabout', exit: 2 } })).toContain('ra lối thứ 2')
  expect(turnText(walkingFixture.legs[0].steps[3])).toBe('Đến điểm đến')
})
async function api(url: string, fetcher: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetcher)
  let body = ''
  const response = { statusCode: 0, setHeader: vi.fn(), end: (text: string) => { body = text } }
  await navigationApi({ url, method: 'GET' } as IncomingMessage, response as unknown as ServerResponse, vi.fn())
  return { status: response.statusCode, body: JSON.parse(body) }
}
it('requests shortest pedestrian street routes with correct GPS lat/lon order', async () => {
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ code: 'Ok', routes: [walkingFixture] }) }))
  const result = await api('/api/navigation/route?lat=16.049&lng=108.239&id=cau-rong', fetcher)
  expect(result.status).toBe(200)
  const payload = JSON.parse(fetcher.mock.calls[0][1].body)
  expect(payload.locations[0]).toEqual({ lat: 16.049, lon: 108.239, radius: 100 })
  expect(payload.locations[1].lat).toBe(routePoints[3][0])
  expect(payload.costing).toBe('pedestrian')
  expect(payload.costing_options.pedestrian).toEqual({ shortest: true, disable_hierarchy_pruning: true, exclude_ferries: true })
  expect(payload.shape_format).toBe('geojson')
})
it('rejects invalid GPS and reports unavailable routing without a straight-line fallback', async () => {
  const fetcher = vi.fn(async () => { throw new Error('network') })
  expect((await api('/api/navigation/route?lat=bad&lng=108.2&id=cau-rong', fetcher)).status).toBe(400)
  expect(fetcher).not.toHaveBeenCalled()
  const result = await api('/api/navigation/route?lat=16.06&lng=108.2&id=cau-rong', fetcher)
  expect(result.status).toBe(503)
  expect(result.body.route).toBeUndefined()
})
