

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { destinations, type Destination } from './data/destinations'
import './Explore.css'
import './Quest.css'
import { filterDestinations, searchText } from './lib/filters'
import DestinationSheet from './DestinationSheet'

import { createRoot } from 'react-dom/client'
import PixelAvatar from './PixelAvatar'
import { readAvatar, avatars } from './lib/avatar'
import { usePlayerLocation } from './lib/usePlayerLocation'
import { distanceMeters } from './lib/location'
import NearbyDrawer from './NearbyDrawer'
import { DEFAULT_MARKER_METERS, PIN_LABEL_ZOOM, pinMode, pinScale } from './lib/markerScale'

const DESTINATION_MARKER_MIN_ZOOM = 15
const PLAYER_OVERVIEW_ZOOM = 15
function fitOverview(map: L.Map, player?: [number, number]) {
  const bounds = L.latLngBounds(destinations.map(place => place.position))
  if (player) bounds.extend(player)
  map.invalidateSize({ pan: false })
  const { x: width, y: height } = map.getSize()
  const side = Math.min(55, width * .12)
  map.fitBounds(bounds, { paddingTopLeft: [side, Math.min(90, height * .25)], paddingBottomRight: [side, Math.min(110, height * .3)], maxZoom: PLAYER_OVERVIEW_ZOOM, animate: false })
}
function resizeIllustration(marker: L.Marker, zoom: number, size: [number, number], anchor: [number, number], player = false) {
  const element = marker.getElement()
  if (!element) return
  const scale = Math.max(player ? .6 : .28, Math.min(1.2, 2 ** ((zoom - 15) * .5)))
  element.style.width = `${size[0] * scale}px`
  element.style.height = `${size[1] * scale}px`
  element.style.marginLeft = `${-anchor[0] * scale}px`
  element.style.marginTop = `${-anchor[1] * scale}px`
  element.classList.toggle('overview-pin', !player && zoom < 14)
}
function resizePlacePin(marker: L.Marker, zoom: number, lat: number, size: [number, number], anchor: [number, number], meters: number) {
  const element = marker.getElement()
  if (!element) return
  const scale = pinScale(lat, zoom, meters, size[0])
  const mode = pinMode(zoom)
  element.style.width = `${size[0] * scale}px`
  element.style.height = `${size[1] * scale}px`
  element.style.marginLeft = `${-anchor[0] * scale}px`
  element.style.marginTop = `${-anchor[1] * scale}px`
  element.classList.toggle('hidden-pin', mode === 'hidden')
  element.classList.toggle('dot-pin', mode === 'dot')
  element.classList.toggle('overview-pin', zoom < PIN_LABEL_ZOOM)
}
export default function Explore() {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [selected, setSelected] = useState<Destination | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [tileError, setTileError] = useState(false)
  const [sprites, setSprites] = useState<Record<string, { url: string; meters: number }>>({})
  useEffect(() => {
    // Ảnh pixel do admin chọn (Django). Lỗi mạng hoặc chưa có thì dùng ảnh mặc định.
    if (typeof fetch !== 'function') return
    let alive = true
    fetch('/api/pixel/places').then(r => r.ok ? r.json() : null).then(data => {
      if (alive && data && typeof data.items === 'object' && data.items) setSprites(data.items)
    }).catch(() => undefined)
    return () => { alive = false }
  }, [])
  const [mapUnavailable, setMapUnavailable] = useState(false)
  const [loadingTiles, setLoadingTiles] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const [locating, setLocating] = useState(false)
  const [showAllPlaces, setShowAllPlaces] = useState(false)
  const { sample, error: locationError, updatePosition } = usePlayerLocation()
  const centered = useRef(false)
  const [avatar, setAvatar] = useState(() => readAvatar() ?? avatars[0])
  const nearIntent = /\b(gan|quanh|xung quanh)\b/.test(searchText(query))
  const filtered = useMemo(() => filterDestinations(destinations, query, nearIntent && sample ? 3 : 0, sample, Date.now()), [query, nearIntent, sample])
  function notify(message: string) {
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: message }))
  }
  function centerOnDevice() {
    if (!window.isSecureContext || !navigator.geolocation) {
      notify('Không thể dùng định vị. Hãy mở ứng dụng bằng HTTPS hoặc localhost và kiểm tra hỗ trợ định vị của thiết bị.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(position => {
      setLocating(false)
      if (!updatePosition(position)) {
        notify('Vị trí chưa đủ chính xác hoặc đã cũ. Hãy thử lại ở nơi có tín hiệu GPS tốt hơn.')
        return
      }
      const point: [number, number] = [position.coords.latitude, position.coords.longitude]
      const map = mapRef.current
      setLocating(false)
      setSheetOpen(false)
      centered.current = true
      if (!map) {
        notify('Bản đồ chưa sẵn sàng. Hãy thử lại sau khi bản đồ tải xong.')
        return
      }
      map.invalidateSize({ pan: false })
      map.flyTo(point, PLAYER_OVERVIEW_ZOOM, { animate: true, duration: .7 })
      notify(`Đã đưa bản đồ về vị trí của bạn${position.coords.accuracy ? ` (sai số khoảng ${Math.round(position.coords.accuracy)} m)` : ''}.`)
    }, error => {
      setLocating(false)
      if (error.code === error.PERMISSION_DENIED) notify('Bạn chưa cho phép truy cập vị trí. Hãy cấp quyền định vị trong cài đặt trình duyệt rồi thử lại.')
      else if (error.code === error.TIMEOUT) notify('Chưa lấy được vị trí kịp thời. Hãy bật GPS, kiểm tra kết nối rồi thử lại.')
      else notify('Không thể xác định vị trí hiện tại của thiết bị. Hãy thử lại.')
    }, { enableHighAccuracy: false, maximumAge: 5_000, timeout: 5_000 })
  }
  function startVoiceSearch() {
    const SpeechRecognition = (window as typeof window & { SpeechRecognition?: new () => { lang: string; interimResults: boolean; start(): void; onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void; onerror: () => void; onend: () => void } }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; start(): void; onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void; onerror: () => void; onend: () => void } }).webkitSpeechRecognition
    if (!SpeechRecognition) { setQuery(''); window.dispatchEvent(new CustomEvent('dana-toast', { detail: 'Trình duyệt này chưa hỗ trợ tìm kiếm bằng giọng nói. Bạn vẫn có thể nhập câu tìm kiếm.' })); return }
    const recognition = new SpeechRecognition(); recognition.lang = 'vi-VN'; recognition.interimResults = false
    recognition.onresult = event => setQuery(event.results[0][0].transcript)
    recognition.onerror = () => window.dispatchEvent(new CustomEvent('dana-toast', { detail: 'Chưa nghe rõ. Hãy thử nói lại hoặc nhập bằng bàn phím.' }))
    recognition.onend = () => setListening(false)
    setListening(true); recognition.start()
  }
  const activeSelected = selected && filtered.some(place => place.id === selected.id) ? selected : null
  const showPlace = useCallback((place: Destination) => {
    setSelected(place)
    setSheetOpen(true)
    setShowAllPlaces(false)
    const map = mapRef.current
    if (map) {
      map.flyTo(place.position, Math.max(map.getZoom(), DESTINATION_MARKER_MIN_ZOOM), { animate: true, duration: 0.7 })
    }
  }, [])

  useEffect(() => {
    if (!query.trim() || filtered.length !== 1) return
    const timer = window.setTimeout(() => showPlace(filtered[0]), 350)
    return () => window.clearTimeout(timer)
  }, [query, filtered, showPlace])

  useEffect(() => {
    if (!container.current) return
    let map: L.Map | undefined
    let observer: ResizeObserver | undefined
    let active = true
    let loaded = 0
    let resizeFrame = 0
    let delayedResize = 0
    const failed = new Set<string>()
    const timer = window.setTimeout(() => {
      if (active && loaded === 0) { setLoadingTiles(false); setTileError(true) }
    }, 12000)
    const resize = () => { if (active) map?.invalidateSize({ pan: false }) }
    try {
      map = L.map(container.current, { scrollWheelZoom: false, zoomControl: false, touchZoom: true }).setView([16.0678, 108.224], DESTINATION_MARKER_MIN_ZOOM)
      map.attributionControl.setPrefix(false)
      mapRef.current = map
      centered.current = false
      fitOverview(map)
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      })
      const tileKey = (event: L.TileEvent) => `${event.coords.z}/${event.coords.x}/${event.coords.y}`
      tiles.on('tileerror', (event: L.TileErrorEvent) => {
        failed.add(tileKey(event))
        if (active) { setLoadingTiles(false); setTileError(true) }
      })
      tiles.on('tileload', (event: L.TileEvent) => {
        loaded++; failed.delete(tileKey(event)); window.clearTimeout(timer)
        if (active) { setLoadingTiles(false); setTileError(failed.size > 0) }
      })
      tiles.on('tileunload', (event: L.TileEvent) => { failed.delete(tileKey(event)) })
      tiles.addTo(map)
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(resize)
        observer.observe(container.current)
      }
      window.addEventListener('resize', resize)
      resizeFrame = requestAnimationFrame(resize)
      delayedResize = window.setTimeout(resize, 120)
    } catch (error) {
      map?.remove(); map = undefined; mapRef.current = null
      console.error('[DANA QUEST] Không khởi tạo được bản đồ:', error)
      queueMicrotask(() => { if (active) { setMapUnavailable(true); setLoadingTiles(false) } })
    }
    return () => {
      active = false; window.clearTimeout(timer); window.clearTimeout(delayedResize); cancelAnimationFrame(resizeFrame); observer?.disconnect()
      window.removeEventListener('resize', resize)
      map?.off('moveend')
      map?.remove(); mapRef.current = null
    }
  }, [attempt])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const resizeFrame = requestAnimationFrame(() => map.invalidateSize({ pan: false }))
    const layer = L.layerGroup()
    const pins: { marker: L.Marker; size: [number, number]; anchor: [number, number]; lat: number; meters: number }[] = []
    filtered.forEach(place => {
      const dragon = place.id === 'cau-rong'
      const marker = L.marker(place.position, {
        title: place.name, alt: place.name,
        icon: L.divIcon({ className: `destination-pin illustrated-pin ${dragon ? 'dragon-pin' : ''}`, html: `<img src="${sprites[place.id]?.url ?? `${import.meta.env.BASE_URL}markers/${place.markerAsset}`}" alt=""/><b>${place.name}</b>`, iconSize: dragon ? [92, 82] : [68, 66], iconAnchor: dragon ? [46, 68] : [34, 55] }),
      }).addTo(layer).bindTooltip(place.name, { direction: 'top', offset: [0, -20] }).on('click', () => showPlace(place))
      marker.on('add', () => marker.getElement()?.setAttribute('aria-label', place.name))
      pins.push({ marker, size: dragon ? [92, 82] : [68, 66], anchor: dragon ? [46, 68] : [34, 55], lat: place.position[0], meters: sprites[place.id]?.meters ?? place.markerMeters ?? (dragon ? 160 : DEFAULT_MARKER_METERS) })
    })
    const syncVisibility = () => {
      pins.forEach(({ marker, size, anchor, lat, meters }) => resizePlacePin(marker, map.getZoom(), lat, size, anchor, meters))
    }
    layer.addTo(map)
    syncVisibility()
    map.on('zoom', syncVisibility)
    return () => { cancelAnimationFrame(resizeFrame); map.off('zoom', syncVisibility); layer.remove() }
  }, [filtered, attempt, showPlace, sprites])

  function selectPlace(place: Destination) {
    showPlace(place)
    mapRef.current?.setView(place.position, 16)
  }

  useEffect(() => {
    const update = () => setAvatar(readAvatar() ?? avatars[0])
    window.addEventListener('dana-avatar-changed', update)
    return () => window.removeEventListener('dana-avatar-changed', update)
  }, [])
  useEffect(() => {
    const map = mapRef.current
    if (!map || !sample) return
    const point: [number, number] = [sample.latitude, sample.longitude]
    const avatarElement = document.createElement('div')
    const avatarRoot = createRoot(avatarElement)
    avatarRoot.render(<PixelAvatar avatar={avatar}/>)
    const marker = L.marker(point, { title: `Vị trí của bạn · ${avatar.name}`, alt: `Nhân vật ${avatar.name}`, zIndexOffset: 2000, icon: L.divIcon({ className: 'player-location-marker', html: avatarElement, iconSize: [40, 50], iconAnchor: [20, 50] }) }).addTo(map)
    marker.bindTooltip(`Vị trí ước tính của bạn · ${avatar.name}`)
    const circle = L.circle(point, { radius: sample.accuracy, color: '#2385bd', weight: 1, fillOpacity: .12, interactive: false }).addTo(map)
    if (!centered.current) { fitOverview(map, point); centered.current = true }
    const resizePlayer = () => resizeIllustration(marker, map.getZoom(), [40, 50], [20, 50], true)
    resizePlayer()
    map.on('zoom', resizePlayer)
    return () => { map.off('zoom', resizePlayer); marker.remove(); circle.remove(); queueMicrotask(() => avatarRoot.unmount()) }
  }, [sample, avatar, attempt])
  const recommendedPlaces = sample ? filtered.map(place => ({ place, distance: distanceMeters([sample.latitude, sample.longitude], place.position) }))
    .filter(item => item.distance + sample.accuracy <= 3000)
    .sort((a, b) => (b.place.featuredScore - b.distance / 100) - (a.place.featuredScore - a.distance / 100)).slice(0, 6) : []

  return (
    <>
    <main className="explore-page">
      <header className="explore-nav">
        <a className="brand" href="#/">DANA QUEST</a>
        <a href="#/tai-khoan">Tài khoản →</a>
      </header>

      <section className="map-screen" aria-label="Khám phá bản đồ">
        <div className="map-search-bar" aria-label="Tìm kiếm địa điểm">
          <span className="map-search-icon" aria-hidden="true">⌕</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="VD: bảo tàng gần tôi" aria-label="Tìm kiếm điểm đến" />
          <button type="button" className="voice-search" aria-label={listening ? 'Đang nghe…' : 'Tìm bằng giọng nói'} disabled={listening} onClick={startVoiceSearch}>{listening ? '…' : '🎙'}</button>
        </div>
        <button className="map-compass" type="button" aria-label={locating ? 'Đang xác định vị trí của tôi' : 'Đưa bản đồ về vị trí của tôi'} title={locationError || 'Vị trí của tôi'} disabled={locating} onClick={centerOnDevice}>{locating ? '…' : '🧭'}</button>

        <div className="map-shell">
          {(tileError || mapUnavailable) && <div className="map-notice" role="alert">
            <p>{mapUnavailable ? 'Không thể khởi tạo bản đồ trên trình duyệt này.' : 'Không tải được nền bản đồ OpenStreetMap hoặc chỉ tải được một phần. Hãy kiểm tra kết nối mạng.'} Bạn vẫn có thể chọn một điểm đến từ tùy chọn dưới đây.</p>
            <div className="map-fallback-links">
              {filtered.slice(0, 5).map(place => <a key={place.id} href={`#/dia-diem/${place.id}`}>Xem chi tiết {place.name}</a>)}
            </div>
            <button onClick={() => { setTileError(false); setMapUnavailable(false); setLoadingTiles(true); setAttempt(value => value + 1) }}>Thử tải lại bản đồ</button>
          </div>}
          {loadingTiles && <p className="map-caption" role="status">Đang tải nền bản đồ…</p>}
          <div className="map" hidden={mapUnavailable} ref={container} role="region" aria-label="Bản đồ các điểm đến Đà Nẵng" />
        </div>

        {!sheetOpen && <NearbyDrawer>
          <div className="nearby-tabs"><button type="button" aria-pressed={!showAllPlaces} onClick={() => setShowAllPlaces(false)}>Trong 3 km</button><button type="button" aria-pressed={showAllPlaces} onClick={() => setShowAllPlaces(true)}>Tất cả</button></div>
          {showAllPlaces ? <div className="utility-body">
            {filtered.map(place => <button key={place.id} className="destination-option" onClick={() => selectPlace(place)}>{place.name}<span aria-hidden="true">↗</span></button>)}
            {!filtered.length && <p>Không tìm thấy địa điểm phù hợp.</p>}
          </div> : <div className="nearby-list">
            <p>Tối đa 6 địa điểm trong 3 km quanh vị trí thiết bị, có tính đến sai số định vị.</p>
            {!sample && <p role="status">{locationError || 'Đang chờ quyền định vị và vị trí thiết bị…'}</p>}
            {sample && !recommendedPlaces.length && <p>Chưa có địa điểm phù hợp trong 3 km quanh bạn.</p>}
            {recommendedPlaces.map(({place, distance}) => <button type="button" className="suggestion-chip" key={place.id} onClick={() => selectPlace(place)}><img src={import.meta.env.BASE_URL + "markers/" + place.markerAsset} alt=""/><span>{place.name}<small>{place.highlightReason} · {(distance / 1000).toFixed(1)} km</small></span></button>)}
          </div>}
        </NearbyDrawer>}

      </section>
    </main>
        {activeSelected && sheetOpen && <DestinationSheet key={activeSelected.id} place={activeSelected} onClose={() => setSheetOpen(false)} />}
    </>
  )
}
