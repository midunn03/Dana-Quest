import L from 'leaflet'

export interface TileProvider {
  id: string
  url: string
  subdomains: string[]
  maxNativeZoom: number
  attribution: string
}

const OSM_COPYRIGHT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

// CARTO now requires an API key (returning HTTP 200 watermark tiles without one),
// so default to keyless OpenStreetMap mirrors with multi-tier fallback.
export const OSM_FR_TILE_URL = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
export const OSM_STANDARD_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_DE_TILE_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png'
export const CARTO_VOYAGER_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

export const PRIMARY_TILE_URL = OSM_FR_TILE_URL
export const FALLBACK_TILE_URL = OSM_STANDARD_TILE_URL
export const TILE_ATTRIBUTION = `${OSM_COPYRIGHT} &copy; <a href="https://www.openstreetmap.fr/">OSM France</a>`

const TILE_ERROR_THRESHOLD = 3

const KEYLESS_PROVIDERS: readonly TileProvider[] = [
  {
    id: 'osm-fr',
    url: OSM_FR_TILE_URL,
    subdomains: ['a', 'b', 'c'],
    maxNativeZoom: 20,
    attribution: TILE_ATTRIBUTION,
  },
  {
    id: 'osm-standard',
    url: OSM_STANDARD_TILE_URL,
    subdomains: ['a', 'b', 'c'],
    maxNativeZoom: 19,
    attribution: OSM_COPYRIGHT,
  },
  {
    id: 'osm-de',
    url: OSM_DE_TILE_URL,
    subdomains: ['a', 'b', 'c'],
    maxNativeZoom: 19,
    attribution: OSM_COPYRIGHT,
  },
]

function readConfiguredCartoKey(): string {
  const raw = import.meta.env?.VITE_CARTO_API_KEY
  return typeof raw === 'string' ? raw.trim() : ''
}

export function getBaseTileProviders(cartoApiKey = readConfiguredCartoKey()): TileProvider[] {
  const key = cartoApiKey.trim()
  if (!key) return [...KEYLESS_PROVIDERS]

  return [
    {
      id: 'carto-voyager',
      url: `${CARTO_VOYAGER_TILE_URL}?key=${encodeURIComponent(key)}`,
      subdomains: ['a', 'b', 'c', 'd'],
      maxNativeZoom: 20,
      attribution: `${OSM_COPYRIGHT} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    },
    ...KEYLESS_PROVIDERS,
  ]
}

function tileMatchesProvider(tileSrc: string | undefined, provider: TileProvider): boolean {
  if (!tileSrc) return true
  try {
    const tileHost = new URL(tileSrc).hostname
    const providerHost = new URL(provider.url.replace('{s}', 'a')).hostname
    const baseDomain = providerHost.replace(/^a\./, '')
    return tileHost === baseDomain || tileHost.endsWith(`.${baseDomain}`)
  } catch {
    return true
  }
}

export function createBaseTileLayer(cartoApiKey?: string): L.TileLayer {
  const providers = getBaseTileProviders(cartoApiKey)
  let providerIndex = 0
  let errorCount = 0

  const initial = providers[0]
  const layer = L.tileLayer(initial.url, {
    subdomains: initial.subdomains,
    maxZoom: 20,
    maxNativeZoom: initial.maxNativeZoom,
    attribution: initial.attribution,
  })

  layer.on('tileload', () => {
    errorCount = 0
  })

  layer.on('tileerror', (event) => {
    if (providerIndex >= providers.length - 1) return
    const tileSrc = (event as L.TileErrorEvent & { tile?: HTMLImageElement }).tile?.src
    if (!tileMatchesProvider(tileSrc, providers[providerIndex])) return

    errorCount += 1
    if (errorCount < TILE_ERROR_THRESHOLD) return

    const previousAttribution = providers[providerIndex].attribution
    providerIndex += 1
    errorCount = 0

    const next = providers[providerIndex]
    layer.options.subdomains = next.subdomains
    layer.options.maxNativeZoom = next.maxNativeZoom
    layer.options.attribution = next.attribution

    const map = (layer as L.TileLayer & { _map?: L.Map })._map
    if (map?.attributionControl && previousAttribution !== next.attribution) {
      map.attributionControl.removeAttribution(previousAttribution)
      map.attributionControl.addAttribution(next.attribution)
    }

    layer.setUrl(next.url)
  })

  return layer
}
