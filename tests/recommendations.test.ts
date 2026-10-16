import { describe, expect, it } from 'vitest'
import { rankNearbyDestinations, recommendationsApi } from '../server/recommendations.mjs'

function callApi(method: string, url: string) {
  const response = { statusCode: 0, headers: {} as Record<string, string>, body: '' }
  recommendationsApi(
    { method, url } as never,
    Object.assign(response, {
      setHeader(name: string, value: string) { response.headers[name] = value },
      end(body: string) { response.body = body },
    }) as never,
    () => {},
  )
  return { ...response, data: response.body ? JSON.parse(response.body) : null }
}

describe('nearby destination recommendations', () => {
  it('ranks editorial highlights using distance from the viewed map area', () => {
    expect(rankNearbyDestinations(16.0584, 108.2233, 3)[0].id).toBe('cong-vien-apec')
    expect(rankNearbyDestinations(16.0679, 108.224, 3)[0].id).toBe('cau-song-han')
  })

  it('limits results to the nearby radius and clamps result count', () => {
    expect(rankNearbyDestinations(0, 0)).toEqual([])
    expect(rankNearbyDestinations(16.0679, 108.224, 100)).toHaveLength(6)
    expect(rankNearbyDestinations(16.0679, 108.224, 0)).toHaveLength(1)
  })

  it('rejects invalid coordinates', () => {
    expect(() => rankNearbyDestinations(91, 108)).toThrow('Invalid latitude')
    expect(() => rankNearbyDestinations(16, 181)).toThrow('Invalid longitude')
  })

  it('serves nearby results and validates HTTP query parameters', () => {
    const valid = callApi('GET', '/api/recommendations/nearby?lat=16.058&lng=108.223&limit=3')
    expect(valid.statusCode).toBe(200)
    expect(valid.data.items[0].id).toBe('cong-vien-apec')
    expect(valid.data.items).toHaveLength(3)
    expect(callApi('GET', '/api/recommendations/nearby?lat=bad&lng=108').statusCode).toBe(400)
    expect(callApi('POST', '/api/recommendations/nearby?lat=16&lng=108').statusCode).toBe(405)
  })
})
