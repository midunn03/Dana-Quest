// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import L from 'leaflet'
import {
  CARTO_VOYAGER_TILE_URL,
  OSM_DE_TILE_URL,
  OSM_FR_TILE_URL,
  OSM_STANDARD_TILE_URL,
  createBaseTileLayer,
  getBaseTileProviders,
} from '../src/lib/mapTiles'

describe('mapTiles', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to keyless OpenStreetMap providers and never calls CARTO without a key', () => {
    vi.stubEnv('VITE_CARTO_API_KEY', '')
    const providers = getBaseTileProviders()
    expect(providers.map(p => p.url)).toEqual([
      OSM_FR_TILE_URL,
      OSM_STANDARD_TILE_URL,
      OSM_DE_TILE_URL,
    ])
    expect(providers.every(p => !p.url.includes('cartocdn.com'))).toBe(true)
  })

  it('puts CARTO Voyager first with encoded key when VITE_CARTO_API_KEY is configured', () => {
    vi.stubEnv('VITE_CARTO_API_KEY', 'demo key+123')
    const providers = getBaseTileProviders()
    expect(providers[0].url).toBe(`${CARTO_VOYAGER_TILE_URL}?key=demo%20key%2B123`)
    expect(providers.slice(1).map(p => p.url)).toEqual([
      OSM_FR_TILE_URL,
      OSM_STANDARD_TILE_URL,
      OSM_DE_TILE_URL,
    ])
  })

  it('falls back across providers after 3 consecutive matching tile errors, ignores stale errors, and updates attribution', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const map = L.map(container).setView([16.0601, 108.2236], 15)
    const layer = createBaseTileLayer('').addTo(map) as L.TileLayer & { _url: string }
    const setUrlSpy = vi.spyOn(layer, 'setUrl')

    try {
      expect(layer._url).toBe(OSM_FR_TILE_URL)
      expect(container.querySelector('.leaflet-control-attribution')?.textContent).toContain('OSM France')

      // 2 errors then a successful load resets the error counter
      layer.fire('tileerror', { tile: { src: 'https://a.tile.openstreetmap.fr/osmfr/15/1/2.png' } })
      layer.fire('tileerror', { tile: { src: 'https://b.tile.openstreetmap.fr/osmfr/15/1/3.png' } })
      layer.fire('tileload', {})
      expect(setUrlSpy).not.toHaveBeenCalled()

      // 3 consecutive errors from osmfr -> switches to osm-standard
      layer.fire('tileerror', { tile: { src: 'https://a.tile.openstreetmap.fr/osmfr/15/1/2.png' } })
      layer.fire('tileerror', { tile: { src: 'https://b.tile.openstreetmap.fr/osmfr/15/1/3.png' } })
      layer.fire('tileerror', { tile: { src: 'https://c.tile.openstreetmap.fr/osmfr/15/1/4.png' } })
      expect(setUrlSpy).toHaveBeenLastCalledWith(OSM_STANDARD_TILE_URL)
      expect(layer._url).toBe(OSM_STANDARD_TILE_URL)
      expect(container.querySelector('.leaflet-control-attribution')?.textContent).not.toContain('OSM France')
      expect(container.querySelector('.leaflet-control-attribution')?.textContent).toContain('OpenStreetMap')

      // Stale errors from previous provider (osmfr) do not trigger another fallback
      layer.fire('tileerror', { tile: { src: 'https://a.tile.openstreetmap.fr/osmfr/15/1/5.png' } })
      layer.fire('tileerror', { tile: { src: 'https://b.tile.openstreetmap.fr/osmfr/15/1/6.png' } })
      layer.fire('tileerror', { tile: { src: 'https://c.tile.openstreetmap.fr/osmfr/15/1/7.png' } })
      expect(setUrlSpy).toHaveBeenCalledTimes(1)

      // 3 consecutive errors from osm-standard -> switches to osm-de
      layer.fire('tileerror', { tile: { src: 'https://tile.openstreetmap.org/15/1/2.png' } })
      layer.fire('tileerror', { tile: { src: 'https://tile.openstreetmap.org/15/1/3.png' } })
      layer.fire('tileerror', { tile: { src: 'https://tile.openstreetmap.org/15/1/4.png' } })
      expect(setUrlSpy).toHaveBeenLastCalledWith(OSM_DE_TILE_URL)
      expect(layer._url).toBe(OSM_DE_TILE_URL)
    } finally {
      map.remove()
      container.remove()
    }
  })
})
