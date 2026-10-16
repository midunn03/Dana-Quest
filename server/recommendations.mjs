import { readFileSync } from 'node:fs'

const destinations = JSON.parse(readFileSync(new URL('../src/data/destinations.json', import.meta.url), 'utf8'))
const earthRadiusKm = 6371
const maxNearbyKm = 12

function distanceKm(fromLatitude, fromLongitude, toLatitude, toLongitude) {
  const radians = value => value * Math.PI / 180
  const latitudeDelta = radians(toLatitude - fromLatitude)
  const longitudeDelta = radians(toLongitude - fromLongitude)
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(fromLatitude)) * Math.cos(radians(toLatitude)) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc))
}

export function rankNearbyDestinations(latitude, longitude, limit = 3) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new RangeError('Invalid latitude')
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError('Invalid longitude')
  const resultLimit = Math.max(1, Math.min(6, Math.floor(Number.isFinite(limit) ? limit : 3)))

  return destinations
    .map(destination => {
      const km = distanceKm(latitude, longitude, destination.position[0], destination.position[1])
      const proximityScore = Math.max(0, 100 - km / maxNearbyKm * 100)
      return {
        id: destination.id,
        distanceKm: Math.round(km * 100) / 100,
        highlightReason: destination.highlightReason,
        rankScore: destination.featuredScore * 0.2 + proximityScore * 0.8,
      }
    })
    .filter(item => item.distanceKm <= maxNearbyKm)
    .sort((first, second) => second.rankScore - first.rankScore || first.distanceKm - second.distanceKm)
    .slice(0, resultLimit)
    .map(item => ({ id: item.id, distanceKm: item.distanceKm, highlightReason: item.highlightReason }))
}

export function recommendationsApi(request, response, next) {
  const url = new URL(request.url ?? '/', 'http://localhost')
  if (url.pathname !== '/api/recommendations/nearby') return next()

  const send = (status, body) => {
    response.statusCode = status
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.end(JSON.stringify(body))
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return send(405, { error: 'Method not allowed' })
  }

  const rawLatitude = url.searchParams.get('lat')
  const rawLongitude = url.searchParams.get('lng')
  const latitude = rawLatitude === null ? NaN : Number(rawLatitude)
  const longitude = rawLongitude === null ? NaN : Number(rawLongitude)
  const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : 3
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isInteger(limit)) {
    return send(400, { error: 'Provide valid lat, lng, and integer limit parameters.' })
  }

  return send(200, { items: rankNearbyDestinations(latitude, longitude, limit) })
}
