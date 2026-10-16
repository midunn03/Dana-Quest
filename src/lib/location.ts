export interface LocationSample { latitude: number; longitude: number; accuracy: number; timestamp: number }
export const ARRIVAL_RADIUS = 100
export const MAX_ACCURACY = 50
export const MAX_LOCATION_AGE = 60_000

export function distanceMeters(from: [number, number], to: [number, number]): number {
  const rad = (degrees: number) => degrees * Math.PI / 180
  const deltaLat = rad(to[0] - from[0])
  const deltaLon = rad(to[1] - from[1])
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(rad(from[0])) * Math.cos(rad(to[0])) * Math.sin(deltaLon / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)))
}
export function validLocation(sample: LocationSample): boolean {
  return [sample.latitude, sample.longitude, sample.accuracy, sample.timestamp].every(Number.isFinite) &&
    Math.abs(sample.latitude) <= 90 && Math.abs(sample.longitude) <= 180 && sample.accuracy > 0
}
export function isFresh(sample: LocationSample, now = Date.now()): boolean {
  return validLocation(sample) && now >= sample.timestamp && now - sample.timestamp <= MAX_LOCATION_AGE
}
export function hasArrived(sample: LocationSample, target: [number, number], now = Date.now()): boolean {
  return isFresh(sample, now) && sample.accuracy <= MAX_ACCURACY &&
    distanceMeters([sample.latitude, sample.longitude], target) + sample.accuracy <= ARRIVAL_RADIUS
}
