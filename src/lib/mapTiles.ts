import L from 'leaflet'

// CARTO Voyager uses OpenStreetMap street data over Fastly global CDN so it loads
// reliably across Vietnam networks where tile.openstreetmap.org DNS can fail.
export const PRIMARY_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
export const FALLBACK_TILE_URL = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

export function createBaseTileLayer(): L.TileLayer {
  let switched = false
  let errorCount = 0

  const layer = L.tileLayer(PRIMARY_TILE_URL, {
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: TILE_ATTRIBUTION,
  })

  layer.on('tileload', () => {
    errorCount = 0
  })

  layer.on('tileerror', () => {
    if (switched) return
    errorCount += 1
    if (errorCount >= 3) {
      switched = true
      layer.options.subdomains = 'abc'
      layer.setUrl(FALLBACK_TILE_URL)
    }
  })

  return layer
}
