import type { WalkingRoute } from '../src/lib/routing'
import { distanceMeters } from '../src/lib/location'
import { getDestination } from '../src/data/destinations'
const target = getDestination('cau-rong')!.position
export const routePoints: [number, number][] = [[16.08, 108.24], [16.08, 108.23], [16.065, 108.23], target]
const coordinates = routePoints.map(([lat, lng]) => [lng, lat] as [number, number])
const lengths = routePoints.slice(1).map((p, i) => distanceMeters(routePoints[i], p))
export const walkingFixture: WalkingRoute = {
  distance: lengths.reduce((a, b) => a + b, 0), duration: 2200,
  geometry: { coordinates }, legs: [{ steps: [
    { distance: lengths[0], name: 'Đường A', maneuver: { type: 'depart', location: coordinates[0] }, geometry: { coordinates: coordinates.slice(0, 2) } },
    { distance: lengths[1], name: 'Đường B', maneuver: { type: 'turn', modifier: 'left', location: coordinates[1] }, geometry: { coordinates: coordinates.slice(1, 3) } },
    { distance: lengths[2], name: 'Đường C', maneuver: { type: 'turn', modifier: 'right', location: coordinates[2] }, geometry: { coordinates: coordinates.slice(2) } },
    { distance: 0, name: '', maneuver: { type: 'arrive', location: coordinates[3] }, geometry: { coordinates: [coordinates[3]] } },
  ] }],
}
