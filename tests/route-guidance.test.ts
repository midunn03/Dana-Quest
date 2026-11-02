import { afterEach, expect, it, vi } from 'vitest'
import { arrivalClock, bearing, directionName, headingBetween } from '../src/lib/routing'
import { advanceFraction, planStages, stageProgress } from '../src/lib/routeStages'
import { offRouteLimit } from '../src/lib/useWalkingRoute'
import { navigationApi } from '../server/navigation.mjs'
import { walkingFixture } from './routing-fixture'
import type { IncomingMessage, ServerResponse } from 'node:http'
afterEach(() => vi.unstubAllGlobals())

it('computes bearings and Vietnamese compass names', () => {
  expect(Math.round(bearing([16, 108], [16.01, 108]))).toBe(0)
  expect(Math.round(bearing([16, 108], [16, 108.01]))).toBe(90)
  expect(directionName(0)).toBe('Bắc')
  expect(directionName(90)).toBe('Đông')
  expect(directionName(185)).toBe('Nam')
  expect(directionName(270)).toBe('Tây')
  expect(directionName(359)).toBe('Bắc')
})
it('ignores tiny GPS jitter when deriving heading', () => {
  expect(headingBetween([16, 108], [16.000005, 108])).toBeNull()
  expect(Math.round(headingBetween([16, 108], [16.001, 108])!)).toBe(0)
})
it('formats the arrival clock in Da Nang time', () => {
  expect(arrivalClock(Date.parse('2026-01-01T00:00:00Z'), 600)).toBe('07:10')
})
it('widens the off-route limit for poor GPS accuracy within bounds', () => {
  expect(offRouteLimit(5)).toBe(35)
  expect(offRouteLimit(30)).toBe(45)
  expect(offRouteLimit(500)).toBe(60)
})
it('splits a route into up to four stages that cover it exactly', () => {
  const stages = planStages(walkingFixture)
  expect(stages.length).toBeGreaterThanOrEqual(2)
  expect(stages.length).toBeLessThanOrEqual(4)
  expect(stages[0].from).toBe(0)
  expect(stages[stages.length - 1].to).toBe(1)
  stages.forEach((stage, i) => { expect(stage.to).toBeGreaterThan(stage.from); if (i) expect(stage.from).toBe(stages[i - 1].to) })
  expect(planStages({ ...walkingFixture, distance: 60 }).length).toBe(1)
})
it('reports stage progress and never moves the bar backwards', () => {
  const stages = [0, 1, 2, 3].map(i => ({ index: i, from: i / 4, to: (i + 1) / 4, label: `Chặng ${i + 1}` }))
  expect(stageProgress(stages, 0)).toMatchObject({ done: 0, current: 0 })
  const mid = stageProgress(stages, 0.625)
  expect(mid.done).toBe(2)
  expect(mid.current).toBe(2)
  expect(mid.within).toBeCloseTo(0.5)
  expect(stageProgress(stages, 1).done).toBe(4)
  expect(advanceFraction(0.5, 900, 1000)).toBe(0.5)
  expect(advanceFraction(0.5, 200, 1000)).toBeCloseTo(0.8)
})
async function api(url: string, fetcher: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetcher)
  let body = ''
  const response = { statusCode: 0, setHeader: vi.fn(), end: (text: string) => { body = text } }
  await navigationApi({ url, method: 'GET' } as IncomingMessage, response as unknown as ServerResponse, vi.fn())
  return { status: response.statusCode, body: JSON.parse(body) }
}
it('routes to a destination sent as coordinates, but only inside the Da Nang region', async () => {
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ code: 'Ok', routes: [walkingFixture] }) }))
  const ok = await api('/api/navigation/route?lat=16.049&lng=108.239&id=new-place&dlat=16.07&dlng=108.22', fetcher)
  expect(ok.status).toBe(200)
  const payload = JSON.parse(fetcher.mock.calls[0][1].body)
  expect(payload.locations[1]).toEqual({ lat: 16.07, lon: 108.22, radius: 100 })
  const far = await api('/api/navigation/route?lat=16.049&lng=108.239&id=new-place&dlat=21&dlng=105', fetcher)
  expect(far.status).toBe(400)
  expect(fetcher).toHaveBeenCalledTimes(1)
})
