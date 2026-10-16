import { readFileSync } from 'node:fs'
const places = JSON.parse(readFileSync(new URL('../src/data/destinations.json', import.meta.url), 'utf8'))
export async function navigationApi(request, response, next) {
  const url = new URL(request.url ?? '/', 'http://localhost')
  if (url.pathname !== '/api/navigation/route') return next()
  const send = (status, data) => { response.statusCode = status; response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.setHeader('Cache-Control', 'no-store'); response.end(JSON.stringify(data)) }
  if (request.method !== 'GET') return send(405, { error: 'Method not allowed' })
  const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lng'))
  const place = places.find(item => item.id === url.searchParams.get('id'))
  if (!place || !url.searchParams.has('lat') || !url.searchParams.has('lng') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return send(400, { error: 'Invalid route coordinates or destination' })
  try {
    const result = await fetch(new URL('route', process.env.VALHALLA_URL ?? 'https://valhalla1.openstreetmap.de/'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'danaquest-web' }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ locations: [{ lat, lon, radius: 100 }, { lat: place.position[0], lon: place.position[1], radius: 100 }], costing: 'pedestrian', costing_options: { pedestrian: { shortest: true, disable_hierarchy_pruning: true, exclude_ferries: true } }, format: 'osrm', shape_format: 'geojson', units: 'kilometers' }),
    })
    if (!result.ok) throw new Error('Routing unavailable')
    const data = await result.json()
    const route = data.routes?.[0]
    if (data.code !== 'Ok' || !route?.geometry?.coordinates?.length || !route.legs?.[0]?.steps?.length) return send(422, { error: 'Không tìm thấy đường đi bộ tới điểm đến này.' })
    return send(200, { route })
  } catch { return send(503, { error: 'Chưa tính được đường đi. Hãy kiểm tra kết nối và thử lại.' }) }
}
