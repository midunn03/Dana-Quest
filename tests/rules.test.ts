import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { destinations, getDestination, historicalDestinations } from '../src/data/destinations'
import { getMissions } from '../src/data/missions'
import { requiredCount, isDestinationComplete } from '../src/lib/rules'
import { hasArrived, distanceMeters, type LocationSample } from '../src/lib/location'
import { filterDestinations } from '../src/lib/filters'
import { newState, updateProgress, coinBalance, readState } from '../src/lib/progress'

describe('Mission and completion rules', () => {
  it.each(destinations)('$name has exactly 10 distinct missions', place => {
    expect(getMissions(place)).toHaveLength(10)
    expect(new Set(getMissions(place).map(item => item.id)).size).toBe(10)
    expect(getMissions(place).find(item => item.id === 'observe')?.description).toBeTruthy()
    expect(updateProgress(newState(), { type: 'assign', destinationId: place.id, count: 5 }).destinations[place.id].selected).toHaveLength(5)
  })
  it('keeps exactly the requested unique active sightseeing catalog with marker and source assets', () => {
    const expected = ['cau-rong', 'cau-song-han', 'bao-tang-da-nang', 'bao-tang-dieu-khac-cham', 'cong-vien-apec', 'cau-tinh-yeu', 'bai-bien-my-khe', 'cong-vien-bien-dong', 'bien-man-thai-sup', 'chua-linh-ung-bai-but', 'dinh-ban-co', 'hai-van-quan', 'ngu-hanh-son', 'cau-vang-ba-na-hills', 'bai-bien-nam-o']
    expect(destinations.map(place => place.id)).toEqual(expected)
    expect(new Set(destinations.map(place => place.name)).size).toBe(15)
    expect(new Set(destinations.map(place => place.markerAsset)).size).toBe(15)
    for (const place of destinations) {
      expect(place.position.every(Number.isFinite)).toBe(true)
      expect(place.tags.length).toBeGreaterThan(0)
      expect(place.suggestedActivities.length).toBeGreaterThan(0)
      expect(place.sourceUrl).toMatch(/^https:\/\//)
      expect(place.coordinateSourceUrl).toMatch(/^https:\/\//)
      expect(existsSync(new URL(`../public/markers/${place.markerAsset}`, import.meta.url))).toBe(true)
      expect(getMissions(place)).toHaveLength(10)
    }
    const markerSvg = destinations.map(place => readFileSync(new URL(`../public/markers/${place.markerAsset}`, import.meta.url), 'utf8'))
    expect(new Set(markerSvg).size).toBe(15)
    expect(destinations.some(place => /chợ|cafe|quán|restaurant|shopping/i.test(`${place.name} ${place.category} ${place.tags.join(' ')}`))).toBe(false)
  })
  it('keeps Chợ Hàn out of active discovery while retaining its old destination for saved data', () => {
    expect(destinations.some(place => place.id === 'cho-han')).toBe(false)
    expect(historicalDestinations.map(place => place.id)).toContain('cho-han')
    expect(getDestination('cho-han')?.name).toBe('Chợ Hàn')
    expect(getMissions(getDestination('cho-han')!)).toHaveLength(10)
  })
  it.each([[5, 4], [6, 5], [7, 6], [8, 7], [9, 8], [10, 8]])('%i selections require %i completions', (count, needed) => {
    expect(requiredCount(count)).toBe(needed)
    const selected = Array.from({ length: count }, (_, index) => String(index))
    expect(isDestinationComplete({ selected, completed: selected.slice(0, needed - 1), started: true })).toBe(false)
    expect(isDestinationComplete({ selected, completed: selected.slice(0, needed), started: true })).toBe(true)
  })
  it('rejects too few selections and does not give coins for selecting or starting', () => {
    let state = newState()
    for (const count of [4, 11, 5.5, NaN]) expect(() => updateProgress(state, { type: 'assign', destinationId: 'cau-rong', count })).toThrow()
    state = updateProgress(state, { type: 'assign', destinationId: 'cau-rong', count: 10 })
    expect(coinBalance(state)).toBe(0)
    expect(new Set(state.destinations['cau-rong'].selected).size).toBe(10)
    expect(updateProgress(state, { type: 'assign', destinationId: 'cau-rong', count: 5 })).toBe(state)
    state = updateProgress(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'read' })
    state = updateProgress(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'read' })
    expect(coinBalance(state)).toBe(10)
  })
  it('cancels an untouched journey but protects progress that already earned coins', () => {
    let state = updateProgress(newState(), { type: 'assign', destinationId: 'cau-rong', count: 5 })
    expect(updateProgress(state, { type: 'cancel', destinationId: 'cau-rong' }).destinations['cau-rong']).toBeUndefined()
    state = updateProgress(state, { type: 'complete', destinationId: 'cau-rong', missionId: state.destinations['cau-rong'].selected.find(id => id !== 'arrival' && !id.includes('photo'))! })
    expect(() => updateProgress(state, { type: 'cancel', destinationId: 'cau-rong' })).toThrow('số xu')
  })
  it('does not overwrite corrupted saved progress', () => {
    expect(() => readState({ version: 20 })).toThrow()
    expect(() => readState({ version: 1, destinations: { 'cau-rong': { selected: ['read'], completed: ['read', 'read'], started: true } } })).toThrow()
  })
})

describe('Location and filtering', () => {
  const target: [number, number] = [16.0611, 108.2275]
  const now = 1_000_000
  const sample: LocationSample = { latitude: target[0], longitude: target[1], accuracy: 15, timestamp: now }
  it('calculates distances in metres', () => {
    expect(distanceMeters(target, target)).toBe(0)
    expect(distanceMeters([0, 0], [0, 1])).toBeCloseTo(111194.927, 0)
  })
  it('rejects inaccurate, stale, future, invalid and distant samples', () => {
    expect(hasArrived(sample, target, now)).toBe(true)
    for (const change of [{ accuracy: 51 }, { accuracy: 0 }, { latitude: NaN }, { timestamp: now - 60001 }, { timestamp: now + 1 }, { latitude: 17 }]) {
      expect(hasArrived({ ...sample, ...change }, target, now)).toBe(false)
    }
    // About 78 m away with 30 m uncertainty: centre is near, uncertainty crosses the boundary.
    expect(hasArrived({ ...sample, latitude: target[0] + 0.0007, accuracy: 30 }, target, now)).toBe(false)
  })
  it('matches accents and applies text AND distance without a fixed tour order', () => {
    expect(filterDestinations(destinations, 'CAU RONG', 0, null).map(item => item.id)).toEqual(['cau-rong'])
    expect(filterDestinations(destinations, 'da nang', 0, null).map(item => item.id)).toEqual(['bao-tang-da-nang'])
    expect(filterDestinations(destinations, '', 1, null, now)).toEqual([])
    expect(filterDestinations(destinations, '', 1, { ...sample, accuracy: 100 }, now)).toEqual([])
    expect(filterDestinations(destinations, '', 1, sample, now).some(item => item.id === 'cau-rong')).toBe(true)
    expect(filterDestinations(destinations, 'Bảo tàng', 1, sample, now).map(item => item.id)).toEqual(['bao-tang-dieu-khac-cham'])
    expect(filterDestinations(destinations, 'tôi muốn tìm bảo tàng gần đây', 0, null).map(item => item.id)).toEqual(['bao-tang-da-nang', 'bao-tang-dieu-khac-cham'])
    expect(filterDestinations(destinations, 'phố đi bộ', 0, null).map(item => item.id)).toEqual(['cau-tinh-yeu'])
    expect(filterDestinations(destinations, 'DRAGON BRIDGE', 0, null).map(item => item.id)).toEqual(['cau-rong'])
    expect(filterDestinations(destinations, 'marble mountains', 0, null).map(item => item.id)).toEqual(['ngu-hanh-son'])
    expect(filterDestinations(destinations, '', 0, null)).toHaveLength(15)
    expect(filterDestinations(destinations, 'SUP', 0, null).map(item => item.id)).toEqual(['bien-man-thai-sup'])
    expect(filterDestinations(destinations, '', 0, null, now, 'beach').map(item => item.id)).toEqual(['bai-bien-my-khe', 'bien-man-thai-sup', 'bai-bien-nam-o'])
  })
})
