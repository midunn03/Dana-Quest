import rawRoutes from '../data/danabusRoutes.json'
import { distanceMeters } from './location'

export const NEARBY_STATION_RADIUS_METERS = 500
export const APPROACHING_BUS_RADIUS_METERS = 2000
export const DESTINATION_STOP_MAX_METERS = 800

export interface DanaBusStop {
  id: string
  name: string
  street: string
  position: [number, number]
  distMeters: number
  progress: number
  destinationIds?: string[]
}

export interface DanaBusDirection {
  direction: 'di' | 've'
  label: string
  departures: string[]
  distanceMeters: number
  polyline: [number, number][]
  stops: DanaBusStop[]
}

export interface DanaBusRoute {
  code: string
  name: string
  shortName: string
  operator: string
  electric: boolean
  subsidized: boolean
  fareText: string
  frequencyText: string
  operatingHours: string
  officialDistanceKm: number
  tripDurationMinutes: number
  sourceNote: string
  directions: {
    di: DanaBusDirection
    ve: DanaBusDirection
  }
}

export interface NearbyBusStop {
  id: string
  name: string
  street: string
  position: [number, number]
  distanceMeters: number
  routeCodes: string[]
  electric: boolean
}

export interface ApproachingBus {
  tripKey: string
  routeCode: string
  direction: 'di' | 've'
  departureTime: string
  position: [number, number]
  headingDeg: number
  progress: number
  distanceToPlayerMeters: number
  distanceToBoardStopMeters: number
  etaToBoardMinutes: number
  etaClockAtDestination: string
}

export interface BusRouteMatch {
  route: DanaBusRoute
  direction: 'di' | 've'
  directionLabel: string
  boardStop: DanaBusStop
  alightStop: DanaBusStop
  walkToBoardMeters: number
  walkFromAlightMeters: number
  rideMinutes: number
  segmentPolyline: [number, number][]
  /** Buses currently approaching boardStop AND within 2 km of player GPS. */
  approachingBuses: ApproachingBus[]
  /** Next bus reaching boardStop (even if > 2 km away or not yet departed), or null if service ended today. */
  nextBoardClock: string | null
  nextBoardInMinutes: number | null
  scheduleMode: 'live-schedule' | 'demo-schedule'
}

export const DANABUS_ROUTES: DanaBusRoute[] = rawRoutes as unknown as DanaBusRoute[]

export function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

export function formatMinutesAsClock(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getVietnamMinutesOfDay(timestamp = Date.now()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(timestamp))
    const h = Number(parts.find(p => p.type === 'hour')?.value ?? 0)
    const m = Number(parts.find(p => p.type === 'minute')?.value ?? 0)
    const s = Number(parts.find(p => p.type === 'second')?.value ?? 0)
    return (h % 24) * 60 + m + s / 60
  } catch {
    const d = new Date(timestamp + 7 * 3600_000)
    return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60
  }
}

function polylineCumulative(polyline: [number, number][]): number[] {
  const cum = [0]
  for (let i = 1; i < polyline.length; i++) {
    cum.push(cum[i - 1] + distanceMeters(polyline[i - 1], polyline[i]))
  }
  return cum
}

export function interpolatePolylineAtProgress(
  polyline: [number, number][],
  progress: number,
): { position: [number, number]; headingDeg: number } {
  if (!polyline.length) return { position: [16.0601, 108.2236], headingDeg: 0 }
  if (polyline.length === 1) return { position: polyline[0], headingDeg: 0 }

  const clamped = Math.max(0, Math.min(1, progress))
  const cum = polylineCumulative(polyline)
  const total = cum[cum.length - 1]
  if (total <= 0) return { position: polyline[0], headingDeg: 0 }

  const target = clamped * total
  let i = 1
  while (i < cum.length - 1 && cum[i] < target) i += 1

  const a = polyline[i - 1]
  const b = polyline[i]
  const segLen = Math.max(1e-6, cum[i] - cum[i - 1])
  const ratio = Math.max(0, Math.min(1, (target - cum[i - 1]) / segLen))
  const lat = a[0] + (b[0] - a[0]) * ratio
  const lng = a[1] + (b[1] - a[1]) * ratio

  const dLat = b[0] - a[0]
  const dLng = (b[1] - a[1]) * Math.cos((lat * Math.PI) / 180)
  const headingDeg = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360

  return { position: [lat, lng], headingDeg }
}

export function slicePolylineSegment(
  polyline: [number, number][],
  startProgress: number,
  endProgress: number,
): [number, number][] {
  if (polyline.length < 2) return polyline
  const p0 = Math.max(0, Math.min(1, startProgress))
  const p1 = Math.max(p0, Math.min(1, endProgress))
  const cum = polylineCumulative(polyline)
  const total = cum[cum.length - 1]
  if (total <= 0) return polyline

  const d0 = p0 * total
  const d1 = p1 * total
  const result: [number, number][] = [interpolatePolylineAtProgress(polyline, p0).position]

  for (let i = 1; i < polyline.length - 1; i++) {
    if (cum[i] > d0 && cum[i] < d1) {
      result.push(polyline[i])
    }
  }
  result.push(interpolatePolylineAtProgress(polyline, p1).position)
  return result
}

/**
 * Returns deduplicated DanaBus stops within `radiusMeters` (default 500m) of `origin`.
 */
export function getNearbyDanaBusStops(
  origin: [number, number],
  radiusMeters = NEARBY_STATION_RADIUS_METERS,
  routes: DanaBusRoute[] = DANABUS_ROUTES,
): NearbyBusStop[] {
  const clusters: NearbyBusStop[] = []

  for (const route of routes) {
    for (const dir of [route.directions.di, route.directions.ve]) {
      for (const stop of dir.stops) {
        const dist = distanceMeters(origin, stop.position)
        if (dist > radiusMeters) continue

        // Merge stops within 90m so opposite-side or shared stops stay tidy on the map
        const existing = clusters.find(c => distanceMeters(c.position, stop.position) <= 90)
        if (existing) {
          if (!existing.routeCodes.includes(route.code)) {
            existing.routeCodes.push(route.code)
            existing.routeCodes.sort()
          }
          if (route.electric) existing.electric = true
          if (dist < existing.distanceMeters) {
            existing.distanceMeters = dist
            existing.position = stop.position
            existing.name = stop.name
            existing.street = stop.street
          }
        } else {
          clusters.push({
            id: `bus-stop-${stop.id}`,
            name: stop.name,
            street: stop.street,
            position: stop.position,
            distanceMeters: dist,
            routeCodes: [route.code],
            electric: route.electric,
          })
        }
      }
    }
  }

  return clusters.sort((a, b) => a.distanceMeters - b.distanceMeters)
}

export interface FindBusOptionsParams {
  origin: [number, number]
  destinationPos: [number, number]
  destinationId?: string
  now?: number
  overrideMinutesOfDay?: number
  scheduleMode?: 'live-schedule' | 'demo-schedule'
  boardRadiusMeters?: number
  alightRadiusMeters?: number
  busRadiusMeters?: number
  routes?: DanaBusRoute[]
}

/**
 * Finds DanaBus routes that:
 * 1) Have a boarding stop within `boardRadiusMeters` (default 500m) of player GPS `origin`,
 * 2) Pass downstream near `destinationPos` (within `alightRadiusMeters` or explicit `destinationIds`),
 * 3) Computes live approaching buses that have NOT yet passed the boarding stop AND are within `busRadiusMeters` (default 2km) of player GPS.
 */
export function findMatchingBusOptions({
  origin,
  destinationPos,
  destinationId,
  now = Date.now(),
  overrideMinutesOfDay,
  scheduleMode = 'live-schedule',
  boardRadiusMeters = NEARBY_STATION_RADIUS_METERS,
  alightRadiusMeters = DESTINATION_STOP_MAX_METERS,
  busRadiusMeters = APPROACHING_BUS_RADIUS_METERS,
  routes = DANABUS_ROUTES,
}: FindBusOptionsParams): BusRouteMatch[] {
  const nowMin = overrideMinutesOfDay ?? getVietnamMinutesOfDay(now)
  const matches: BusRouteMatch[] = []

  for (const route of routes) {
    let bestForRoute: BusRouteMatch | null = null

    for (const dir of [route.directions.di, route.directions.ve]) {
      // 1. Find closest boarding stop within 500m of player GPS
      let boardIdx = -1
      let boardDist = Infinity
      for (let i = 0; i < dir.stops.length; i++) {
        const d = distanceMeters(origin, dir.stops[i].position)
        if (d <= boardRadiusMeters && d < boardDist) {
          boardDist = d
          boardIdx = i
        }
      }
      if (boardIdx === -1) continue

      // 2. Find closest downstream alighting stop serving the destination
      let alightIdx = -1
      let alightDist = Infinity
      let alightExplicit = false
      for (let j = boardIdx + 1; j < dir.stops.length; j++) {
        const stop = dir.stops[j]
        const isExplicit = Boolean(destinationId && stop.destinationIds?.includes(destinationId))
        const d = distanceMeters(destinationPos, stop.position)
        if (isExplicit || d <= alightRadiusMeters) {
          if (
            (isExplicit && !alightExplicit) ||
            (isExplicit === alightExplicit && d < alightDist)
          ) {
            alightDist = d
            alightIdx = j
            alightExplicit = isExplicit
          }
        }
      }
      if (alightIdx === -1) continue

      const boardStop = dir.stops[boardIdx]
      const alightStop = dir.stops[alightIdx]

      // Don't suggest a bus if destination is already closer on foot than walking to the boarding stop + 150m
      const directDist = distanceMeters(origin, destinationPos)
      if (!alightExplicit && directDist <= boardDist + 150) continue

      const boardOffsetMin = boardStop.progress * route.tripDurationMinutes
      const alightOffsetMin = alightStop.progress * route.tripDurationMinutes
      const rideMinutes = Math.max(2, Math.round(alightOffsetMin - boardOffsetMin))

      const approachingBuses: ApproachingBus[] = []
      let nextBoardMin: number | null = null

      for (const depStr of dir.departures) {
        const depMin = parseTimeToMinutes(depStr)
        const passBoardMin = depMin + boardOffsetMin
        const passAlightMin = depMin + alightOffsetMin

        if (passBoardMin >= nowMin - 0.25) {
          if (nextBoardMin === null || passBoardMin < nextBoardMin) {
            nextBoardMin = passBoardMin
          }
        }

        const busProgress = (nowMin - depMin) / route.tripDurationMinutes
        // Bus must currently be active AND approaching (not yet passed boardStop)
        if (busProgress >= 0 && busProgress <= boardStop.progress + 0.002) {
          const { position, headingDeg } = interpolatePolylineAtProgress(dir.polyline, busProgress)
          const distToPlayer = distanceMeters(origin, position)
          if (distToPlayer <= busRadiusMeters) {
            const distToBoard = Math.max(0, Math.round((boardStop.progress - busProgress) * dir.distanceMeters))
            const etaToBoardMinutes = Math.max(1, Math.round(passBoardMin - nowMin))
            approachingBuses.push({
              tripKey: `${route.code}-${dir.direction}-${depStr}`,
              routeCode: route.code,
              direction: dir.direction,
              departureTime: depStr,
              position,
              headingDeg,
              progress: busProgress,
              distanceToPlayerMeters: Math.round(distToPlayer),
              distanceToBoardStopMeters: distToBoard,
              etaToBoardMinutes,
              etaClockAtDestination: formatMinutesAsClock(passAlightMin),
            })
          }
        }
      }

      approachingBuses.sort((a, b) => a.etaToBoardMinutes - b.etaToBoardMinutes)

      const candidate: BusRouteMatch = {
        route,
        direction: dir.direction,
        directionLabel: dir.label,
        boardStop,
        alightStop,
        walkToBoardMeters: Math.round(boardDist),
        walkFromAlightMeters: Math.round(alightDist),
        rideMinutes,
        segmentPolyline: slicePolylineSegment(dir.polyline, boardStop.progress, alightStop.progress),
        approachingBuses,
        nextBoardClock: nextBoardMin !== null ? formatMinutesAsClock(nextBoardMin) : null,
        nextBoardInMinutes: nextBoardMin !== null ? Math.max(1, Math.round(nextBoardMin - nowMin)) : null,
        scheduleMode,
      }

      if (
        !bestForRoute ||
        candidate.approachingBuses.length > bestForRoute.approachingBuses.length ||
        (candidate.approachingBuses.length === bestForRoute.approachingBuses.length &&
          candidate.walkToBoardMeters + candidate.walkFromAlightMeters <
            bestForRoute.walkToBoardMeters + bestForRoute.walkFromAlightMeters)
      ) {
        bestForRoute = candidate
      }
    }

    if (bestForRoute) matches.push(bestForRoute)
  }

  return matches.sort((a, b) => {
    const aHas = a.approachingBuses.length > 0 ? 1 : 0
    const bHas = b.approachingBuses.length > 0 ? 1 : 0
    if (aHas !== bHas) return bHas - aHas
    if (aHas && bHas) {
      return a.approachingBuses[0].etaToBoardMinutes - b.approachingBuses[0].etaToBoardMinutes
    }
    return a.walkToBoardMeters + a.walkFromAlightMeters - (b.walkToBoardMeters + b.walkFromAlightMeters)
  })
}
