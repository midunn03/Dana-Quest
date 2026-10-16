import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getDestination } from './data/destinations'
import PixelAvatar from './PixelAvatar'
import { avatars, readAvatar } from './lib/avatar'
import { usePlayerLocation } from './lib/usePlayerLocation'
import { hasArrived } from './lib/location'
import { useWalkingRoute } from './lib/useWalkingRoute'
import { formatMeters, turnIcon, turnText, nextTurnText, toLatLng } from './lib/routing'
import './NavigationPage.css'
import ConfirmDialog from './ConfirmDialog'
function routeViewport(map: L.Map): L.FitBoundsOptions {
  const { x: width, y: height } = map.getSize()
  const side = Math.min(55, width * .12)
  return { paddingTopLeft: [side, Math.min(110, height * .32)], paddingBottomRight: [side, Math.min(230, height * .44)], maxZoom: 16, animate: false }
}

export default function NavigationPage({ id }: { id: string }) {
  const container = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const playerRef = useRef<L.Marker | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)
  const accuracyRef = useRef<L.Circle | null>(null)
  const centered = useRef(false)
  const drag = useRef<{ y: number; height: number; max: number; pointer: number } | null>(null)
  const moved = useRef(false)
  const [expanded, setExpanded] = useState(false)
  const [height, setHeight] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const [pendingLeave, setPendingLeave] = useState<string | null>(null)
  const allowLeave = useRef(false)
  const backLink = useRef<HTMLAnchorElement>(null)
  const cancelLeave = useCallback(() => { setPendingLeave(null); backLink.current?.focus() }, [])
  const place = getDestination(id)
  const { sample, error: locationError, retry: retryLocation } = usePlayerLocation()
  const navigation = useWalkingRoute(id, sample)
  useEffect(() => {
    const guard = (event: Event) => {
      const target = (event as CustomEvent<{ hash: string }>).detail.hash
      if (allowLeave.current || target === `#/chi-duong/${id}`) return
      event.preventDefault()
      setPendingLeave(target || '#/')
    }
    window.addEventListener('dana-before-navigation', guard)
    return () => window.removeEventListener('dana-before-navigation', guard)
  }, [id])
  useEffect(() => {
    if (!container.current || !place) return
    const map = L.map(container.current, { zoomControl: false }).setView(place.position, 15)
    mapRef.current = map; centered.current = false
    map.attributionControl.setPrefix(false)
    const timer = window.setTimeout(() => setError(true), 12000)
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map)
    tiles.on('tileerror', () => { setError(true); window.clearTimeout(timer) })
    tiles.on('tileload', () => { setError(false); window.clearTimeout(timer) })
    L.marker(place.position, { icon: L.divIcon({ className: 'route-end', html: '<b>●</b>', iconSize: [26, 32], iconAnchor: [13, 26] }) }).addTo(map).bindTooltip(place.name, { permanent: true, direction: 'top' })
    const avatarElement = document.createElement('div')
    const root = createRoot(avatarElement)
    const renderAvatar = () => root.render(<PixelAvatar avatar={readAvatar() ?? avatars[0]} />)
    renderAvatar(); window.addEventListener('dana-avatar-changed', renderAvatar)
    const player = L.marker(place.position, { title: 'Vị trí của bạn', zIndexOffset: 2000, icon: L.divIcon({ className: 'navigation-player-marker', html: avatarElement, iconSize: [40, 50], iconAnchor: [20, 50] }) })
    playerRef.current = player
    const resizePlayer = () => {
      const element = player.getElement()
      if (!element) return
      const scale = Math.max(.6, Math.min(1.2, 2 ** ((map.getZoom() - 15) * .5)))
      Object.assign(element.style, { width: `${40 * scale}px`, height: `${50 * scale}px`, marginLeft: `${-20 * scale}px`, marginTop: `${-50 * scale}px` })
    }
    player.on('add', resizePlayer); map.on('zoom', resizePlayer)
    const resize = () => map.invalidateSize({ pan: false })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    observer?.observe(container.current)
    const frame = requestAnimationFrame(resize)
    return () => {
      window.clearTimeout(timer); cancelAnimationFrame(frame); observer?.disconnect()
      window.removeEventListener('dana-avatar-changed', renderAvatar)
      map.off('zoom', resizePlayer); map.remove()
      mapRef.current = null; playerRef.current = null; lineRef.current = null; accuracyRef.current = null
      queueMicrotask(() => root.unmount())
    }
  }, [place])
  useEffect(() => {
    const map = mapRef.current, player = playerRef.current
    if (!map || !player || !place) return
    if (!sample) { player.remove(); lineRef.current?.remove(); accuracyRef.current?.remove(); return }
    const point: [number, number] = [sample.latitude, sample.longitude]
    player.setLatLng(point).addTo(map)
    if (!accuracyRef.current) accuracyRef.current = L.circle(point, { color: '#248ae1', weight: 1, fillOpacity: .12, interactive: false })
    accuracyRef.current.setLatLng(point).setRadius(sample.accuracy).addTo(map)
    if (!centered.current) {
      map.invalidateSize({ pan: false })
      map.fitBounds([point, place.position], routeViewport(map))
      centered.current = true
    } else if (!map.getBounds().pad(-.15).contains(point)) map.panTo(point, { animate: false })
  }, [sample, place])
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!navigation.route || !navigation.progress || !navigation.usable) { lineRef.current?.remove(); return }
    if (!lineRef.current) lineRef.current = L.polyline([], { color: '#248ae1', weight: 5, interactive: false })
    lineRef.current.setLatLngs(navigation.progress.points).addTo(map)
  }, [navigation.route, navigation.progress, navigation.usable])
  useEffect(() => {
    const map = mapRef.current
    if (map && navigation.route) map.fitBounds(navigation.route.geometry.coordinates.map(toLatLng), routeViewport(map))
  }, [navigation.route])
  if (!place) return <main className="screen-page"><h1>Không tìm thấy điểm đến</h1><a href="#/kham-pha">← Bản đồ</a></main>
  const arrived = !!sample && hasArrived(sample, place.position)
  const progress = navigation.usable ? navigation.progress : null
  const instruction = arrived ? 'Bạn đã đến nơi!' : progress ? progress.toTurn <= 12 ? navigation.precise ? turnText(progress.next) : 'Gần chỗ rẽ · vị trí ước tính' : `Đi thẳng ${formatMeters(progress.toTurn)}` : !sample ? locationError || 'Đang xác định vị trí…' : !navigation.usable ? 'Vị trí còn lệch nhiều. Đang lấy GPS tốt hơn…' : navigation.busy ? 'Đang tính đường đi bộ…' : navigation.error || 'Đang tính lại đường đi…'
  return <main className="navigation-screen">
    <div className="route-map" ref={container} role="region" aria-label="Bản đồ vị trí của bạn và điểm đến" />
    <div className="route-instruction"><a ref={backLink} href={`#/dia-diem/${id}`} aria-label="Quay lại chi tiết" onClick={event => { event.preventDefault(); setPendingLeave(`#/dia-diem/${id}`) }}>←</a><b aria-hidden="true">{turnIcon(progress?.next)}</b><div aria-live="polite"><strong>{instruction}</strong><small>{!arrived && progress ? progress.toTurn > 12 ? `Sau đó ${nextTurnText(progress.next)}` : navigation.precise ? `Tiếp tục ${formatMeters(progress.next.distance)}` : turnText(progress.next) : `Đến ${place.name}`}</small></div></div>
    <section ref={panel} className={`route-sheet live-route-sheet ${expanded ? 'expanded' : ''} ${height !== null ? 'dragging' : ''}`} style={height !== null ? { height } : undefined} aria-label={`Hướng dẫn đến ${place.name}`}>
      <button type="button" className="route-sheet-handle" aria-label="Mở rộng hoặc thu gọn hướng dẫn" aria-expanded={expanded} aria-controls="route-sheet-content"
        onClick={() => { if (!moved.current) setExpanded(value => !value) }}
        onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setExpanded(event.key === 'ArrowUp') } }}
        onPointerDown={event => {
          if (event.button !== 0 || drag.current) return
          moved.current = false
          drag.current = { y: event.clientY, height: panel.current!.getBoundingClientRect().height, max: panel.current!.parentElement!.clientHeight * .72, pointer: event.pointerId }
          event.currentTarget.setPointerCapture?.(event.pointerId)
        }}
        onPointerMove={event => { const start = drag.current; if (!start || start.pointer !== event.pointerId) return; const delta = start.y - event.clientY; if (Math.abs(delta) > 5) moved.current = true; if (moved.current) setHeight(Math.max(190, Math.min(start.max, start.height + delta))) }}
        onPointerUp={event => { const start = drag.current; if (!start || start.pointer !== event.pointerId) return; if (moved.current) setExpanded(start.y > event.clientY); drag.current = null; setHeight(null) }}
        onPointerCancel={() => { drag.current = null; moved.current = true; setHeight(null) }}><span aria-hidden="true" /></button>
      <div id="route-sheet-content" className="route-sheet-content">
        <h1>Đến {place.name}</h1>
        <h2 className="route-distance" aria-live="polite">{arrived ? 'Bạn đã đến nơi!' : progress ? `Còn ${formatMeters(progress.remaining)} đi bộ` : instruction}</h2>
        {progress && <p>Khoảng {Math.max(1, Math.round(navigation.route!.duration * progress.remaining / Math.max(1, navigation.route!.distance) / 60))} phút · Tuyến đi bộ ngắn nhất</p>}
        {locationError && <p role="status" className="error">{locationError}</p>}
        {!sample && locationError && <button type="button" onClick={retryLocation}>Thử lấy vị trí</button>}
        {error && <p role="alert" className="error">Không tải được nền bản đồ.</p>}
        <a className="blue-button" href={`#/nhiem-vu/${id}`} onClick={() => { allowLeave.current = true }}>Xem nhiệm vụ →</a>
      </div>
    </section>
    <ConfirmDialog open={pendingLeave !== null} title="Rời khỏi hành trình?" message="Bạn có muốn rời khỏi hành trình hiện tại và quay về trang trước không?" confirmLabel="Rời khỏi hành trình" cancelLabel="Tiếp tục hành trình" onCancel={cancelLeave} onConfirm={() => { if (pendingLeave !== null) { allowLeave.current = true; window.location.hash = pendingLeave; setPendingLeave(null) } }} />
  </main>
}
