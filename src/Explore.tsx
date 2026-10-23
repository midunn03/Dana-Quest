

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
import { dateLabel, parseEvents, reminderText, timeRange, type EventItem } from './lib/events'
import { clockOverride, mapDarkness } from './lib/daylight'
import { usePlaceData } from './lib/placeContent'
import { GroundSpriteLayer } from './lib/groundSprite'
import { pixelTileLayer } from './lib/pixelTiles'
import { DEFAULT_MARKER_METERS, DRAGON_MARKER_METERS, PIN_LABEL_ZOOM, pinMode, pinScale } from './lib/markerScale'
import { quests } from './data/quests'

const DESTINATION_MARKER_MIN_ZOOM = 15
const PLAYER_OVERVIEW_ZOOM = 15
const DA_NANG_CENTER: [number, number] = [16.0544, 108.2022]
// Chỉ kéo bản đồ về phía người chơi khi họ đang ở gần Đà Nẵng; ở xa thì vẫn mở ngay Đà Nẵng.
const PLAYER_NEAR_METERS = 40000
// Khi mở bản đồ chỉ hiện quanh một điểm (bán kính khoảng 1 km); người dùng vẫn có thể thu nhỏ để xem xa hơn.
const AROUND_METERS = 1500
function fitAround(map: L.Map, center: [number, number]) {
  map.invalidateSize({ pan: false })
  map.fitBounds(L.latLng(center).toBounds(AROUND_METERS), { animate: false, maxZoom: PLAYER_OVERVIEW_ZOOM })
}
function resizeIllustration(marker: L.Marker, zoom: number, size: [number, number], anchor: [number, number], player = false) {
  const element = marker.getElement()
  if (!element) return
  const scale = Math.max(player ? .75 : .28, Math.min(1.2, 2 ** ((zoom - 15) * .5)))
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
  const { sprites } = usePlaceData()
  const [events, setEvents] = useState<EventItem[]>([])
  const [showEvents, setShowEvents] = useState(false)
  const reminded = useRef(new Set<string>())
  useEffect(() => {
    // Bản đồ tối dần theo giờ thật ở Đà Nẵng (hoàng hôn → tối nhẹ, bình minh → sáng lại).
    const apply = () => {
      const now = clockOverride(window.location.search) ?? new Date()
      container.current?.style.setProperty('--map-dark', mapDarkness(now).toFixed(3))
    }
    apply()
    const timer = window.setInterval(apply, 60000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    // Sự kiện theo giờ thực (Django). Làm mới mỗi phút; lỗi mạng thì giữ danh sách cũ.
    if (typeof fetch !== 'function') return
    let alive = true
    const load = () => fetch('/api/events/feed').then(r => r.ok ? r.json() : null).then(data => { if (alive && data) setEvents(parseEvents(data)) }).catch(() => undefined)
    void load()
    const timer = window.setInterval(load, 60000)
    return () => { alive = false; window.clearInterval(timer) }
  }, [])
  useEffect(() => {
    // Nhắc một lần cho mỗi sự kiện đang diễn ra hoặc sắp diễn ra.
    events.forEach(event => {
      const key = `${event.id}-${event.start}`
      const message = reminderText(event)
      if (!message || reminded.current.has(key)) return
      reminded.current.add(key)
      window.dispatchEvent(new CustomEvent('dana-toast', { detail: message }))
    })
  }, [events])
  const happeningPlaces = useMemo(() => new Set(events.filter(event => event.status !== 'later' && event.placeId).map(event => event.placeId as string)), [events])
  const [mapUnavailable, setMapUnavailable] = useState(false)
  const [loadingTiles, setLoadingTiles] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const [locating, setLocating] = useState(false)
  const [showAllPlaces, setShowAllPlaces] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const { sample, error: locationError, updatePosition } = usePlayerLocation()
  const centered = useRef(false)
  const [avatar, setAvatar] = useState(() => readAvatar() ?? avatars[0])
  const nearIntent = /\b(gan|quanh|xung quanh)\b/.test(searchText(query))
  const filtered = useMemo(() => filterDestinations(destinations, query, nearIntent && sample ? 3 : 0, sample, now), [query, nearIntent, sample, now])
  const visibleQuests = useMemo(() => {
    const searched = searchText(query)
    return quests.filter(quest => !searched || searchText(`${quest.title} ${quest.area} đại học kinh tế due`).includes(searched))
  }, [query])
  function notify(message: string) {
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: message }))
  }
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 15000); return () => window.clearInterval(timer) }, [])
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
      map = L.map(container.current, { scrollWheelZoom: false, zoomControl: false, touchZoom: true, minZoom: 9 }).setView(DA_NANG_CENTER, 12)
      L.control.zoom({ position: 'topright', zoomInTitle: 'Phóng to', zoomOutTitle: 'Thu nhỏ' }).addTo(map)
      map.attributionControl.setPrefix(false)
      mapRef.current = map
      centered.current = false
      fitAround(map, DA_NANG_CENTER)
      const tiles = pixelTileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
      const ground = sprites[place.id]?.ground
      if (ground) new GroundSpriteLayer(sprites[place.id].url, ground, () => showPlace(place)).addTo(layer)
      const marker = L.marker(place.position, {
        title: place.name, alt: place.name,
        icon: L.divIcon({ className: `destination-pin illustrated-pin ${ground ? 'ground-pin' : ''} ${dragon ? 'dragon-pin' : ''} ${happeningPlaces.has(place.id) ? 'event-pin' : ''}`, html: `${ground ? '<span class="plain-pin ground-plain" aria-hidden="true"></span>' : sprites[place.id] ? `<img src="${encodeURI(sprites[place.id].url)}" alt=""/>` : '<span class="plain-pin" aria-hidden="true"></span>'}<b>${place.name}</b>`, iconSize: dragon ? [92, 82] : [68, 66], iconAnchor: dragon ? [46, 68] : [34, 55] }),
      }).addTo(layer).bindTooltip(place.name, { direction: 'top', offset: [0, -20] }).on('click', () => showPlace(place))
      marker.on('add', () => marker.getElement()?.setAttribute('aria-label', place.name))
      pins.push({ marker, size: dragon ? [92, 82] : [68, 66], anchor: dragon ? [46, 68] : [34, 55], lat: place.position[0], meters: ground ? 60 : sprites[place.id]?.meters ?? place.markerMeters ?? (dragon ? DRAGON_MARKER_METERS : DEFAULT_MARKER_METERS) })
    })
    visibleQuests.forEach(quest => {
      const marker = L.marker(quest.startPosition, {
        title: quest.title,
        alt: quest.title,
        zIndexOffset: 900,
        icon: L.divIcon({ className: 'quest-map-pin', html: `<span aria-hidden="true">★</span><b>${quest.title}</b>`, iconSize: [78, 66], iconAnchor: [39, 58] }),
      }).addTo(layer).bindPopup(`<div class="quest-map-popup"><small>QUEST MẪU · ${quest.estimatedMinutes} PHÚT</small><strong>${quest.title}</strong><p>${quest.checkpoints.length} nhiệm vụ tại ${quest.area}</p><a href="#/quest/${quest.id}">Xem quest →</a></div>`)
      marker.on('add', () => marker.getElement()?.setAttribute('aria-label', `Quest ${quest.title}`))
    })
    const syncVisibility = () => {
      pins.forEach(({ marker, size, anchor, lat, meters }) => resizePlacePin(marker, map.getZoom(), lat, size, anchor, meters))
    }
    layer.addTo(map)
    syncVisibility()
    map.on('zoom', syncVisibility)
    return () => { cancelAnimationFrame(resizeFrame); map.off('zoom', syncVisibility); layer.remove() }
  }, [filtered, visibleQuests, attempt, showPlace, sprites, happeningPlaces])

  function selectPlace(place: Destination) {
    showPlace(place)
    mapRef.current?.setView(place.position, 16)
  }

  useEffect(() => {
    const update = () => setAvatar(readAvatar() ?? avatars[0])
    window.addEventListener('dana-avatar-changed', update)
    return () => window.removeEventListener('dana-avatar-changed', update)
  }, [])
  // Lời nhắn của nhân vật khi bạn đang đứng gần một địa điểm.
  const playerHint = useMemo(() => {
    if (!sample) return null
    const here: [number, number] = [sample.latitude, sample.longitude]
    const nearest = destinations.map(place => ({ place, meters: distanceMeters(here, place.position) })).sort((a, b) => a.meters - b.meters)[0]
    if (!nearest || nearest.meters > 300) return null
    const text = nearest.meters + sample.accuracy <= 100 ? `Bạn đã tới ${nearest.place.name}! Bấm vào mình để mở nhiệm vụ.` : `Gần ${nearest.place.name} · ${Math.round(nearest.meters / 10) * 10} m`
    return { place: nearest.place, text }
  }, [sample])
  useEffect(() => {
    const map = mapRef.current
    if (!map || !sample) return
    const point: [number, number] = [sample.latitude, sample.longitude]
    const avatarElement = document.createElement('div')
    const avatarRoot = createRoot(avatarElement)
    avatarRoot.render(<><PixelAvatar avatar={avatar}/>{playerHint && <span className="player-bubble" role="status">{playerHint.text}</span>}<span className="player-shadow" aria-hidden="true"/></>)
    const marker = L.marker(point, { title: `Vị trí của bạn · ${avatar.name}`, alt: `Nhân vật ${avatar.name}`, zIndexOffset: 2000, icon: L.divIcon({ className: 'player-location-marker', html: avatarElement, iconSize: [48, 60], iconAnchor: [24, 60] }) }).addTo(map)
    marker.bindTooltip(`Vị trí ước tính của bạn · ${avatar.name}`)
    // Bấm vào nhân vật: nếu đang ở gần một địa điểm thì mở địa điểm đó, không thì căn bản đồ về chỗ bạn.
    marker.on('click', () => { if (playerHint) showPlace(playerHint.place); else map.setView(point, Math.max(map.getZoom(), 16)) })
    const circle = L.circle(point, { radius: sample.accuracy, color: '#2385bd', weight: 1, fillOpacity: .12, interactive: false }).addTo(map)
    if (!centered.current) { fitAround(map, distanceMeters(point, DA_NANG_CENTER) <= PLAYER_NEAR_METERS ? point : DA_NANG_CENTER); centered.current = true }
    const resizePlayer = () => resizeIllustration(marker, map.getZoom(), [48, 60], [24, 60], true)
    resizePlayer()
    map.on('zoom', resizePlayer)
    return () => { map.off('zoom', resizePlayer); marker.remove(); circle.remove(); queueMicrotask(() => avatarRoot.unmount()) }
  }, [sample, avatar, attempt, playerHint, showPlace])
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
          <div className="nearby-tabs"><button type="button" aria-pressed={!showAllPlaces && !showEvents} onClick={() => { setShowEvents(false); setShowAllPlaces(false) }}>Trong 3 km</button><button type="button" aria-pressed={showAllPlaces && !showEvents} onClick={() => { setShowEvents(false); setShowAllPlaces(true) }}>Tất cả</button><button type="button" aria-pressed={showEvents} onClick={() => setShowEvents(true)}>Sự kiện{events.some(event => event.status !== 'later') ? ' •' : ''}</button></div>
          {showEvents ? <div className="event-list">
            {!events.length && <p>Chưa có sự kiện sắp tới.</p>}
            {events.slice(0, 12).map(event => {
              const place = destinations.find(item => item.id === event.placeId)
              return <button type="button" key={`${event.id}-${event.start}`} className={`event-item event-${event.status}`} disabled={!place} onClick={() => place && selectPlace(place)}>
                <span className="event-when">{event.status === 'live' ? 'ĐANG DIỄN RA' : event.status === 'soon' ? `CÒN ${Math.max(1, event.minutesUntil)} PHÚT` : dateLabel(event.start)}</span>
                <strong>{event.title}</strong>
                <small>{timeRange(event)}{event.placeName ? ` · ${event.placeName}` : ''}</small>
              </button>
            })}
          </div> : showAllPlaces ? <div className="utility-body">
            {filtered.map(place => <button key={place.id} className="destination-option" onClick={() => selectPlace(place)}>{place.name}<span aria-hidden="true">↗</span></button>)}
            {!filtered.length && <p>Không tìm thấy địa điểm phù hợp.</p>}
          </div> : <div className="nearby-list">
            <p>Tối đa 6 địa điểm trong 3 km quanh vị trí thiết bị, có tính đến sai số định vị.</p>
            {!sample && <p role="status">{locationError || 'Đang chờ quyền định vị và vị trí thiết bị…'}</p>}
            {sample && !recommendedPlaces.length && <p>Chưa có địa điểm phù hợp trong 3 km quanh bạn.</p>}
            {recommendedPlaces.map(({place, distance}) => <button type="button" className="suggestion-chip" key={place.id} onClick={() => selectPlace(place)}>{sprites[place.id] ? <img src={sprites[place.id].url} alt=""/> : <span className="plain-chip" aria-hidden="true"/>}<span>{place.name}<small>{place.highlightReason} · {(distance / 1000).toFixed(1)} km</small></span></button>)}
          </div>}
        </NearbyDrawer>}

      </section>
    </main>
        {activeSelected && sheetOpen && <DestinationSheet key={activeSelected.id} place={activeSelected} onClose={() => setSheetOpen(false)} />}
    </>
  )
}
