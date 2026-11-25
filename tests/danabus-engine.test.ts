import { describe, expect, it } from 'vitest'
import {
  APPROACHING_BUS_RADIUS_METERS,
  DANABUS_ROUTES,
  NEARBY_STATION_RADIUS_METERS,
  findMatchingBusOptions,
  getNearbyDanaBusStops,
  parseTimeToMinutes,
} from '../src/lib/danabusEngine'

describe('DanaBus 2026 schedule engine (500m stops + destination on route + 2km approaching buses)', () => {
  it('loads all 8 Da Nang routes with official departure schedules and snapped road polylines', () => {
    const codes = DANABUS_ROUTES.map(r => r.code).sort()
    expect(codes).toEqual(['02', '03', '05', '06', '07', '08', '11', '12'])
    for (const route of DANABUS_ROUTES) {
      expect(route.directions.di.departures.length).toBeGreaterThanOrEqual(16)
      expect(route.directions.ve.departures.length).toBeGreaterThanOrEqual(16)
      expect(route.directions.di.polyline.length).toBeGreaterThan(20)
      expect(route.directions.ve.polyline.length).toBeGreaterThan(20)
    }
  })

  it('strictly limits nearby bus stops to <= 500m radius around player GPS', () => {
    const nearCham: [number, number] = [16.0603, 108.2233]
    const stops = getNearbyDanaBusStops(nearCham, NEARBY_STATION_RADIUS_METERS)
    expect(stops.length).toBeGreaterThan(0)
    expect(stops.every(s => s.distanceMeters <= NEARBY_STATION_RADIUS_METERS)).toBe(true)

    // Somewhere far away in the sea -> 0 stops
    expect(getNearbyDanaBusStops([16.15, 108.40], NEARBY_STATION_RADIUS_METERS)).toHaveLength(0)
  })

  it('matches Route 06 from Cham Museum to My Khe Beach and only reports buses approaching within 2 km', () => {
    const origin: [number, number] = [16.0603, 108.2233] // Bảo tàng Chăm
    const myKhe: [number, number] = [16.0617, 108.2469]  // Bãi biển Mỹ Khê

    // Route 06 outbound departs Airport at 08:15; Cham stop is ~12% along 55-min route (~6.6 min after departure -> ~08:21:30).
    // At 08:19 (4 min after 08:15), the bus is ~1.1 km west of Cham Museum approaching the stop!
    const matchesApproaching = findMatchingBusOptions({
      origin,
      destinationPos: myKhe,
      destinationId: 'bai-bien-my-khe',
      overrideMinutesOfDay: parseTimeToMinutes('08:19'),
    })

    const r06 = matchesApproaching.find(m => m.route.code === '06')
    expect(r06).toBeTruthy()
    expect(r06!.direction).toBe('di')
    expect(r06!.walkToBoardMeters).toBeLessThanOrEqual(NEARBY_STATION_RADIUS_METERS)
    expect(r06!.approachingBuses.length).toBeGreaterThanOrEqual(1)
    expect(r06!.approachingBuses[0].distanceToPlayerMeters).toBeLessThanOrEqual(APPROACHING_BUS_RADIUS_METERS)
    expect(r06!.approachingBuses[0].etaToBoardMinutes).toBeGreaterThanOrEqual(1)
    expect(r06!.segmentPolyline.length).toBeGreaterThan(2)

    // At 08:27 (12 min after 08:15, 18 min before 08:45): the 08:15 bus already PASSED Cham stop,
    // and the 08:45 bus has NOT departed yet -> approachingBuses must be empty, while nextBoardClock still works!
    const matchesPassed = findMatchingBusOptions({
      origin,
      destinationPos: myKhe,
      destinationId: 'bai-bien-my-khe',
      overrideMinutesOfDay: parseTimeToMinutes('08:27'),
    })
    const r06Passed = matchesPassed.find(m => m.route.code === '06')
    expect(r06Passed).toBeTruthy()
    expect(r06Passed!.approachingBuses).toHaveLength(0)
    expect(r06Passed!.nextBoardClock).toBeTruthy()
  })

  it('matches key tourist connections across routes 02, 03, 05, 08', () => {
    // Route 03: Airport -> Ba Na Hills (Golden Bridge)
    const toBaNa = findMatchingBusOptions({
      origin: [16.0556, 108.2024],
      destinationPos: [15.9949, 107.9966],
      destinationId: 'cau-vang-ba-na-hills',
      overrideMinutesOfDay: parseTimeToMinutes('08:00'),
    })
    expect(toBaNa.some(m => m.route.code === '03' && m.direction === 'di')).toBe(true)

    // Route 05: Near Da Nang Museum -> East Sea Park
    const toBienDong = findMatchingBusOptions({
      origin: [16.0738, 108.2220],
      destinationPos: [16.0703, 108.2458],
      destinationId: 'cong-vien-bien-dong',
      overrideMinutesOfDay: parseTimeToMinutes('08:30'),
    })
    expect(toBienDong.some(m => m.route.code === '05' && m.direction === 'di')).toBe(true)

    // Route 02: Near APEC Park -> Ngu Hanh Son
    const toNhs = findMatchingBusOptions({
      origin: [16.0585, 108.2230],
      destinationPos: [16.0037, 108.2632],
      destinationId: 'ngu-hanh-son',
      overrideMinutesOfDay: parseTimeToMinutes('09:00'),
    })
    expect(toNhs.some(m => m.route.code === '02' && m.direction === 'di')).toBe(true)

    // Route 08: Near Dragon Bridge East / Ngo Quyen -> DUE
    const toDue = findMatchingBusOptions({
      origin: [16.0620, 108.2345],
      destinationPos: [16.0475, 108.2399],
      destinationId: 'due-dau-an-50-nam',
      overrideMinutesOfDay: parseTimeToMinutes('08:15'),
    })
    expect(toDue.some(m => m.route.code === '08' && m.direction === 'di')).toBe(true)
  })
})
