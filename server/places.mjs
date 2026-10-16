import { readFileSync } from 'node:fs'

const destinations = JSON.parse(readFileSync(new URL('../src/data/destinations.json', import.meta.url), 'utf8'))
const cache = new Map()
const cacheDuration = 15 * 60 * 1000

async function fetchPlace(destination) {
  const cached = cache.get(destination.id)
  if (cached && Date.now() - cached.time < cacheDuration) return cached.value
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not configured')
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.formattedAddress,places.currentOpeningHours,places.regularOpeningHours',
    },
    body: JSON.stringify({ textQuery: `${destination.name}, ${destination.location}`, languageCode: 'vi', regionCode: 'VN', maxResultCount: 1 }),
  })
  if (!response.ok) throw new Error(`Google Places returned ${response.status}`)
  const place = (await response.json()).places?.[0]
  if (!place) throw new Error('Place was not found')
  const opening = place.currentOpeningHours ?? place.regularOpeningHours
  const value = {
    hours: opening?.weekdayDescriptions?.join(' · ') ?? 'Chưa có giờ mở cửa trên Google Places',
    hoursNote: opening ? 'Giờ hoạt động có thể thay đổi vào ngày lễ hoặc khi có sự kiện.' : 'Địa điểm này chưa công bố giờ hoạt động.',
    address: place.formattedAddress ?? destination.location,
    openNow: opening?.openNow,
    checkedOn: new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
    live: true,
  }
  cache.set(destination.id, { time: Date.now(), value })
  return value
}

export async function placesApi(request, response, next) {
  const url = new URL(request.url ?? '/', 'http://localhost')
  if (url.pathname !== '/api/places/visit-info') return next()
  const send = (status, body) => {
    response.statusCode = status
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'private, max-age=300')
    response.end(JSON.stringify(body))
  }
  if (request.method !== 'GET') return send(405, { error: 'Method not allowed' })
  const destination = destinations.find(item => item.id === url.searchParams.get('id'))
  if (!destination) return send(404, { error: 'Destination not found' })
  try { return send(200, await fetchPlace(destination)) }
  catch (error) { return send(503, { error: error instanceof Error ? error.message : 'Place information unavailable' }) }
}
