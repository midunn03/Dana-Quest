import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getDestination } from './data/destinations'
import PixelAvatar from './PixelAvatar'
import { avatars, readAvatar } from './lib/avatar'
import { usePlayerLocation } from './lib/usePlayerLocation'
import { distanceMeters, getArrivalFeedback, hasArrived, type LocationSample } from './lib/location'
import JourneyTrack from './JourneyTrack'
import { advanceFraction, planStages, type Stage } from './lib/routeStages'
import { useWalkingRoute } from './lib/useWalkingRoute'
import { arrivalClock, bearing, directionName, formatMeters, headingBetween, turnIcon, turnText, nextTurnText, toLatLng, type Point } from './lib/routing'
import { getNearbyGreenTransit, claimTransitReward, type NearbyTransitResult } from './lib/ecoTransit'
import './NavigationPage.css'
import ConfirmDialog from './ConfirmDialog'

function routeViewport(map: L.Map): L.FitBoundsOptions {
  const { x: width, y: height } = map.getSize()
  const side = Math.min(55, width * .12)
  return { paddingTopLeft: [side, Math.min(110, height * .32)], paddingBottomRight: [side, Math.min(230, height * .44)], maxZoom: 16, animate: false }
}

export interface NavigationTarget {
  id: string
  name: string
  position: [number, number]
  backHref: string
  continueHref: string
  continueLabel?: string
  requireArrival?: boolean
}

export default function NavigationPage({ id, target }: { id: string; target?: NavigationTarget }) {
  const container = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const playerRef = useRef<L.Marker | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)
  const casingRef = useRef<L.Polyline | null>(null)
  const connectorRef = useRef<L.Polyline | null>(null)
  const turnRef = useRef<L.CircleMarker | null>(null)
  const transitMarkersRef = useRef<L.Marker[]>([])
  const avatarRef = useRef<HTMLDivElement | null>(null)
  const lastPoint = useRef<Point | null>(null)
  const followRef = useRef(true)
  const stagesRef = useRef<Stage[]>([])
  const baseline = useRef(0)
  const maxFraction = useRef(0)
  const accuracyRef = useRef<L.Circle | null>(null)
  const centered = useRef(false)
  const drag = useRef<{ y: number; height: number; max: number; pointer: number } | null>(null)
  const moved = useRef(false)

  const [expanded, setExpanded] = useState(false)
  const [height, setHeight] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const [follow, setFollow] = useState(true)
  const [moving, setMoving] = useState(false)
  const [rerouteNotice, setRerouteNotice] = useState(false)
  const [pendingLeave, setPendingLeave] = useState<string | null>(null)
  const allowLeave = useRef(false)
  const backLink = useRef<HTMLAnchorElement>(null)
  const cancelLeave = useCallback(() => { setPendingLeave(null); backLink.current?.focus() }, [])

  // ---------- NÂNG CẤP 1: Chế độ Mô phỏng hành trình (GPS Walk Simulation) ----------
  const [simulating, setSimulating] = useState(false)
  const [simPaused, setSimPaused] = useState(false)
  const [simSpeed, setSimSpeed] = useState<number>(3) // 1x, 3x, 6x
  const [simProgress, setSimProgress] = useState(0) // 0 -> 1
  const [simSample, setSimSample] = useState<LocationSample | null>(null)

  // ---------- TÍNH NĂNG ĐỘNG LỰC: Phương tiện xanh & Delay Nudge ----------
  const [transitUpdateTick, setTransitUpdateTick] = useState(0)
  const [showDelayNudge, setShowDelayNudge] = useState(false)
  const lastMoveTimestamp = useRef(Date.now())
  const lastPosCheck = useRef<Point | null>(null)
  const snoozeUntil = useRef(0)

  const destination = getDestination(id)
  const place: NavigationTarget | undefined = useMemo(() => target ?? (destination ? {
    id: destination.id,
    name: destination.name,
    position: destination.position,
    backHref: `#/dia-diem/${destination.id}`,
    continueHref: `#/nhiem-vu/${destination.id}`,
  } : undefined), [destination, target])

  const { sample, error: locationError, retry: retryLocation } = usePlayerLocation()

  // Vị trí hiệu lực: khi đang bật mô phỏng thì ưu tiên vị trí mô phỏng
  const activeSample: LocationSample | null = useMemo(() => {
    if (simulating && simSample) return simSample
    return sample
  }, [simulating, simSample, sample])

  const sampleRef = useRef(activeSample)
  sampleRef.current = activeSample

  const navigation = useWalkingRoute(id, activeSample, place?.position)
  const currentHref = target ? `#/quest/${id}/chi-duong` : `#/chi-duong/${id}`

  // Guard rời khỏi trang
  useEffect(() => {
    const guard = (event: Event) => {
      const targetHash = (event as CustomEvent<{ hash: string }>).detail.hash
      if (allowLeave.current || targetHash === currentHref) return
      event.preventDefault()
      setPendingLeave(targetHash || '#/')
    }
    window.addEventListener('dana-before-navigation', guard)
    return () => window.removeEventListener('dana-before-navigation', guard)
  }, [currentHref])

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!container.current || !place) return
    const map = L.map(container.current, { zoomControl: false }).setView(place.position, 15)
    mapRef.current = map
    centered.current = false
    map.attributionControl.setPrefix(false)

    const timer = window.setTimeout(() => setError(true), 12000)
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map)
    tiles.on('tileerror', () => { setError(true); window.clearTimeout(timer) })
    tiles.on('tileload', () => { setError(false); window.clearTimeout(timer) })

    L.marker(place.position, { icon: L.divIcon({ className: 'route-end', html: '<b>●</b>', iconSize: [26, 32], iconAnchor: [13, 26] }) }).addTo(map).bindTooltip(place.name, { permanent: true, direction: 'top' })

    const avatarElement = document.createElement('div')
    const root = createRoot(avatarElement)
    avatarRef.current = avatarElement

    const renderAvatar = () => root.render(<><span className="nav-heading" aria-hidden="true" /><span className="nav-bob"><PixelAvatar avatar={readAvatar() ?? avatars[0]} /></span></>)
    renderAvatar()
    window.addEventListener('dana-avatar-changed', renderAvatar)

    map.on('dragstart', () => { followRef.current = false; setFollow(false) })

    const player = L.marker(place.position, { title: 'Vị trí của bạn', zIndexOffset: 2000, icon: L.divIcon({ className: 'navigation-player-marker', html: avatarElement, iconSize: [40, 50], iconAnchor: [20, 50] }) })
    playerRef.current = player

    const resizePlayer = () => {
      const element = player.getElement()
      if (!element) return
      const scale = Math.max(.6, Math.min(1.2, 2 ** ((map.getZoom() - 15) * .5)))
      Object.assign(element.style, { width: `${40 * scale}px`, height: `${50 * scale}px`, marginLeft: `${-20 * scale}px`, marginTop: `${-50 * scale}px` })
    }
    player.on('add', resizePlayer)
    map.on('zoom', resizePlayer)

    const resize = () => map.invalidateSize({ pan: false })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    observer?.observe(container.current)
    const frame = requestAnimationFrame(resize)

    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('dana-avatar-changed', renderAvatar)
      map.off('zoom', resizePlayer)
      map.remove()
      mapRef.current = null
      playerRef.current = null
      lineRef.current = null
      casingRef.current = null
      connectorRef.current = null
      turnRef.current = null
      avatarRef.current = null
      accuracyRef.current = null
      lastPoint.current = null
      queueMicrotask(() => root.unmount())
    }
  }, [place])

  // Cập nhật vị trí nhân vật trên bản đồ khi activeSample thay đổi
  useEffect(() => {
    const map = mapRef.current, player = playerRef.current
    if (!map || !player || !place) return
    if (!activeSample) {
      player.remove(); lineRef.current?.remove(); casingRef.current?.remove(); connectorRef.current?.remove(); turnRef.current?.remove(); accuracyRef.current?.remove(); lastPoint.current = null
      return
    }

    const point: [number, number] = [activeSample.latitude, activeSample.longitude]
    player.setLatLng(point).addTo(map)

    if (!accuracyRef.current) accuracyRef.current = L.circle(point, { color: '#248ae1', weight: 1, fillOpacity: .12, interactive: false })
    accuracyRef.current.setLatLng(point).setRadius(activeSample.accuracy).addTo(map)

    const previous = lastPoint.current
    const heading = previous ? headingBetween(previous, point, simulating ? 1 : 5) : null
    if (heading !== null && avatarRef.current) {
      avatarRef.current.style.setProperty('--heading', `${heading}deg`)
      avatarRef.current.dataset.heading = '1'
    }
    if (!previous || heading !== null) lastPoint.current = point
    if (heading !== null) { setMoving(true) }

    if (!centered.current) {
      map.invalidateSize({ pan: false })
      map.setView(point, Math.max(map.getZoom(), 17), { animate: false })
      centered.current = true
    } else if (followRef.current) {
      map.panTo(point, { animate: L.Browser.any3d, duration: .6 })
    }
  }, [activeSample, place, simulating])

  useEffect(() => {
    if (!moving) return
    const timer = window.setTimeout(() => setMoving(false), 4000)
    return () => window.clearTimeout(timer)
  }, [moving, activeSample])

  // Thông báo tính lại đường
  useEffect(() => {
    if (!navigation.reroutes) return
    setRerouteNotice(true)
    const timer = window.setTimeout(() => setRerouteNotice(false), 5000)
    return () => window.clearTimeout(timer)
  }, [navigation.reroutes])

  // Vẽ lộ trình trên bản đồ
  const deviation = navigation.deviation
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const fullRoute = navigation.route?.geometry.coordinates.map(toLatLng)
    if (!navigation.route || !navigation.usable || (!navigation.progress && !deviation)) {
      lineRef.current?.remove(); casingRef.current?.remove(); connectorRef.current?.remove(); turnRef.current?.remove()
      return
    }

    const faded = !navigation.progress
    const points = navigation.progress ? navigation.progress.points : fullRoute!
    if (!connectorRef.current) connectorRef.current = L.polyline([], { color: '#1a56d6', weight: 4, dashArray: '1 9', lineCap: 'round', interactive: false })
    if (deviation && sampleRef.current) connectorRef.current.setLatLngs([[sampleRef.current.latitude, sampleRef.current.longitude], deviation.snapped]).addTo(map)
    else connectorRef.current.remove()

    if (!casingRef.current) casingRef.current = L.polyline([], { color: '#123f9c', weight: 11, lineCap: 'round', lineJoin: 'round', interactive: false })
    if (!lineRef.current) lineRef.current = L.polyline([], { color: '#4b8dff', weight: 6, lineCap: 'round', lineJoin: 'round', interactive: false })

    casingRef.current.setStyle({ opacity: faded ? .3 : 1 }).setLatLngs(points).addTo(map)
    lineRef.current.setStyle({ opacity: faded ? .35 : 1 }).setLatLngs(points).addTo(map)

    const next = navigation.progress?.next
    if (next && next.maneuver.type !== 'arrive') {
      const at = toLatLng(next.maneuver.location)
      if (!turnRef.current) turnRef.current = L.circleMarker(at, { radius: 8, color: '#123f9c', weight: 3, fillColor: '#ffffff', fillOpacity: 1, interactive: false })
      turnRef.current.setLatLng(at).addTo(map)
    } else turnRef.current?.remove()
  }, [navigation.route, navigation.progress, navigation.usable, deviation])

  // ---------- THỰC THI NÂNG CẤP 1: Logic Chạy Mô Phỏng Tự Động ----------
  useEffect(() => {
    if (!simulating || simPaused || !navigation.route || !place) return
    const coords = navigation.route.geometry.coordinates.map(toLatLng)
    if (coords.length < 2) return

    const timer = window.setInterval(() => {
      setSimProgress(prev => {
        const step = 0.015 * simSpeed
        const next = prev + step
        if (next >= 1) {
          window.clearInterval(timer)
          setSimSample({ latitude: place.position[0], longitude: place.position[1], accuracy: 10, timestamp: Date.now() })
          window.dispatchEvent(new CustomEvent('dana-toast', { detail: '🎉 Đã mô phỏng đến đích! Bạn có thể thực hiện nhiệm vụ ngay.' }))
          navigator.vibrate?.([100, 50, 150])
          return 1
        }

        const floatIdx = next * (coords.length - 1)
        const idx = Math.floor(floatIdx)
        const frac = floatIdx - idx
        const p1 = coords[idx]
        const p2 = coords[Math.min(coords.length - 1, idx + 1)]
        const lat = p1[0] + (p2[0] - p1[0]) * frac
        const lng = p1[1] + (p2[1] - p1[1]) * frac

        setSimSample({ latitude: lat, longitude: lng, accuracy: 8, timestamp: Date.now() })
        return next
      })
    }, 700)

    return () => window.clearInterval(timer)
  }, [simulating, simPaused, simSpeed, navigation.route, place])

  const toggleSimulation = () => {
    if (simulating) {
      setSimulating(false)
      setSimSample(null)
      setSimProgress(0)
      window.dispatchEvent(new CustomEvent('dana-toast', { detail: 'Đã dừng chế độ mô phỏng, quay lại vị trí thực tế.' }))
    } else {
      if (!navigation.route) {
        window.dispatchEvent(new CustomEvent('dana-toast', { detail: 'Đang tải lộ trình, vui lòng chờ trong giây lát...' }))
        return
      }
      const coords = navigation.route.geometry.coordinates.map(toLatLng)
      setSimulating(true)
      setSimPaused(false)
      setSimProgress(0)
      if (coords.length > 0) {
        setSimSample({ latitude: coords[0][0], longitude: coords[0][1], accuracy: 8, timestamp: Date.now() })
      }
      followRef.current = true
      setFollow(true)
      window.dispatchEvent(new CustomEvent('dana-toast', { detail: '▶ Bắt đầu mô phỏng đi bộ dọc theo tuyến đường!' }))
    }
  }

  // ---------- TÍNH NĂNG ĐỘNG LỰC: Trạm xe đạp TNGo & DanaBus gần đó ----------
  const nearbyTransit: NearbyTransitResult[] = useMemo(() => {
    if (!activeSample) return []
    // transitUpdateTick đảm bảo làm mới danh sách khi nhận thưởng
    void transitUpdateTick
    return getNearbyGreenTransit([activeSample.latitude, activeSample.longitude], 350)
  }, [activeSample, transitUpdateTick])

  // Hiển thị marker các trạm xe đạp TNGo / xe bus trên bản đồ
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    transitMarkersRef.current.forEach(m => m.remove())
    transitMarkersRef.current = []

    nearbyTransit.forEach(({ station, distance, claimed }) => {
      const icon = L.divIcon({
        className: 'custom-transit-marker',
        html: `<div class="transit-pin ${station.type}" title="${station.name}"><span>${station.type === 'bike' ? '🚲' : '🚌'}</span></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      const marker = L.marker(station.position, { icon }).addTo(map)
      marker.bindTooltip(`<b>${station.name}</b><br/>Cách bạn ${Math.round(distance)}m · ${claimed ? 'Đã nhận thưởng' : `Thưởng +${station.bonusCoins} Green Coins`}`, { direction: 'top' })
      transitMarkersRef.current.push(marker)
    })

    return () => {
      transitMarkersRef.current.forEach(m => m.remove())
      transitMarkersRef.current = []
    }
  }, [nearbyTransit])

  // ---------- TÍNH NĂNG ĐỘNG LỰC: Phát hiện Delay & Hiện Popup Nudge ----------
  useEffect(() => {
    if (!activeSample || simulating) return
    const currentPos: Point = [activeSample.latitude, activeSample.longitude]

    if (!lastPosCheck.current) {
      lastPosCheck.current = currentPos
      lastMoveTimestamp.current = Date.now()
    } else {
      const movedDist = distanceMeters(lastPosCheck.current, currentPos)
      if (movedDist > 4) {
        lastPosCheck.current = currentPos
        lastMoveTimestamp.current = Date.now()
        if (showDelayNudge) setShowDelayNudge(false)
      }
    }

    const checkInterval = window.setInterval(() => {
      if (showDelayNudge || simulating || !place) return
      const arrivedNow = hasArrived(activeSample, place.position)
      if (arrivedNow) return

      const idleSeconds = (Date.now() - lastMoveTimestamp.current) / 1000
      if (idleSeconds >= 16 && Date.now() > snoozeUntil.current) {
        setShowDelayNudge(true)
        navigator.vibrate?.([200, 100, 200])
      }
    }, 4000)

    return () => window.clearInterval(checkInterval)
  }, [activeSample, simulating, place, showDelayNudge])

  if (!place) return <main className="screen-page"><h1>Không tìm thấy điểm đến</h1><a href="#/kham-pha">← Bản đồ</a></main>

  // ---------- NÂNG CẤP 5: Tính toán điều kiện đến nơi và feedback trực quan ----------
  const arrived = (!!activeSample && hasArrived(activeSample, place.position)) || (simulating && simProgress >= 0.98)
  const arrivalFeedback = getArrivalFeedback(activeSample, place.position)

  const progress = navigation.usable ? navigation.progress : null
  if (navigation.initialRoute && !stagesRef.current.length) {
    stagesRef.current = planStages(navigation.initialRoute)
    baseline.current = navigation.initialRoute.distance
  }
  if (progress) maxFraction.current = advanceFraction(maxFraction.current, progress.remaining, baseline.current)
  if (simulating) maxFraction.current = Math.max(maxFraction.current, simProgress)

  const here: Point | null = activeSample ? [activeSample.latitude, activeSample.longitude] : null
  const toward = (to: Point) => here ? `hướng ${directionName(bearing(here, to))}, cách ${formatMeters(distanceMeters(here, to))}` : ''
  const lost = !progress && !arrived && !!activeSample && navigation.usable && !!deviation

  const instruction = arrived
    ? 'Bạn đã đến nơi!'
    : progress
    ? progress.toTurn <= 12
      ? navigation.precise ? turnText(progress.next) : 'Gần chỗ rẽ · vị trí ước tính'
      : `Đi thẳng ${formatMeters(progress.toTurn)}`
    : !activeSample
    ? locationError || 'Đang xác định vị trí…'
    : !navigation.usable
    ? 'Vị trí còn lệch nhiều. Đang lấy GPS tốt hơn…'
    : lost
    ? 'Bạn đã đi lệch tuyến'
    : navigation.busy
    ? 'Đang tính đường đi bộ…'
    : navigation.error || 'Đang tính lại đường đi…'

  const subline = arrived || !activeSample
    ? `Đến ${place.name}`
    : progress
    ? progress.toTurn > 12
      ? `Sau đó ${nextTurnText(progress.next)}`
      : navigation.precise ? `Tiếp tục ${formatMeters(progress.next.distance)}` : turnText(progress.next)
    : lost
    ? navigation.busy ? 'Đang tính lại đường từ vị trí hiện tại của bạn…' : `Theo đường chấm để quay về tuyến (${toward(deviation!.snapped)})`
    : navigation.error && navigation.usable ? `Đường chim bay tới ${place.name}: ${toward(place.position)}` : `Đến ${place.name}`

  const minutes = progress ? Math.max(1, Math.round(navigation.route!.duration * progress.remaining / Math.max(1, navigation.route!.distance) / 60)) : 0

  const handleClaimTransit = (item: NearbyTransitResult) => {
    claimTransitReward(item.station)
    setTransitUpdateTick(v => v + 1)
  }

  return <main className="navigation-screen">
    <div className="route-map" ref={container} role="region" aria-label="Bản đồ vị trí của bạn và điểm đến" />

    {/* Bảng chỉ dẫn kiểu Google Maps */}
    <div className="route-instruction">
      <a ref={backLink} href={place.backHref} aria-label="Quay lại chi tiết" onClick={event => { event.preventDefault(); setPendingLeave(place.backHref) }}>←</a>
      <b aria-hidden="true">{lost ? '⤺' : turnIcon(progress?.next)}</b>
      <div aria-live="polite">
        <strong>{instruction}</strong>
        <small>{subline}</small>
      </div>
      {progress && !arrived && progress.toTurn > 12 && <span className="route-turn-distance" aria-hidden="true">{formatMeters(progress.toTurn)}</span>}
    </div>

    {/* Thanh điều khiển Mô Phỏng (Simulation Walk Bar) */}
    {simulating && (
      <div className="sim-control-bar" role="toolbar" aria-label="Thanh điều khiển mô phỏng di chuyển">
        <div className="sim-badge">
          <span className="pulse-dot" />
          <span>MÔ PHỎNG ({Math.round(simProgress * 100)}%)</span>
        </div>
        <div className="sim-actions">
          <button
            type="button"
            className="sim-action-btn"
            onClick={() => setSimPaused(p => !p)}
            title={simPaused ? 'Tiếp tục chạy' : 'Tạm dừng'}
          >
            {simPaused ? '▶ Tiếp tục' : '⏸ Dừng'}
          </button>
          <button
            type="button"
            className={`sim-action-btn ${simSpeed === 1 ? 'active-speed' : ''}`}
            onClick={() => setSimSpeed(1)}
            title="Tốc độ đi bộ thật"
          >
            1x
          </button>
          <button
            type="button"
            className={`sim-action-btn ${simSpeed === 3 ? 'active-speed' : ''}`}
            onClick={() => setSimSpeed(3)}
            title="Tốc độ chạy bộ"
          >
            3x
          </button>
          <button
            type="button"
            className={`sim-action-btn ${simSpeed === 6 ? 'active-speed' : ''}`}
            onClick={() => setSimSpeed(6)}
            title="Tốc độ xe đạp"
          >
            6x
          </button>
          <button
            type="button"
            className="sim-action-btn exit-sim"
            onClick={toggleSimulation}
            title="Thoát chế độ mô phỏng"
          >
            ✕ Thoát
          </button>
        </div>
      </div>
    )}

    {rerouteNotice && <p className="route-reroute-note" role="status">Đã tính lại đường từ vị trí hiện tại của bạn</p>}

    {/* Các nút công cụ trên bản đồ */}
    <div className="route-tools">
      <button
        type="button"
        className={`route-tool sim-btn ${simulating ? 'active' : ''}`}
        onClick={toggleSimulation}
        aria-label="Bật hoặc tắt chế độ mô phỏng đi bộ demo"
      >
        🎮 {simulating ? 'Đang mô phỏng' : 'Mô phỏng demo'}
      </button>

      {!follow && (
        <button
          type="button"
          className="route-tool recenter"
          onClick={() => {
            const map = mapRef.current, point = here
            followRef.current = true
            setFollow(true)
            if (map && point) map.setView(point, Math.max(map.getZoom(), 17), { animate: false })
          }}
        >
          <span aria-hidden="true">▲</span> Về giữa
        </button>
      )}

      {navigation.initialRoute && (
        <button
          type="button"
          className="route-tool"
          onClick={() => {
            const map = mapRef.current
            if (!map) return
            followRef.current = false
            setFollow(false)
            map.fitBounds([...(navigation.route ?? navigation.initialRoute!).geometry.coordinates.map(toLatLng), ...(here ? [here] : [])], routeViewport(map))
          }}
        >
          Xem toàn tuyến
        </button>
      )}
    </div>

    {/* Bottom Sheet thông tin hành trình */}
    <section
      ref={panel}
      className={`route-sheet live-route-sheet ${expanded ? 'expanded' : ''} ${height !== null ? 'dragging' : ''}`}
      style={height !== null ? { height } : undefined}
      aria-label={`Hướng dẫn đến ${place.name}`}
    >
      <button
        type="button"
        className="route-sheet-handle"
        aria-label="Mở rộng hoặc thu gọn hướng dẫn"
        aria-expanded={expanded}
        aria-controls="route-sheet-content"
        onClick={() => { if (!moved.current) setExpanded(value => !value) }}
        onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setExpanded(event.key === 'ArrowUp') } }}
        onPointerDown={event => {
          if (event.button !== 0 || drag.current) return
          moved.current = false
          drag.current = { y: event.clientY, height: panel.current!.getBoundingClientRect().height, max: panel.current!.parentElement!.clientHeight * .72, pointer: event.pointerId }
          event.currentTarget.setPointerCapture?.(event.pointerId)
        }}
        onPointerMove={event => {
          const start = drag.current
          if (!start || start.pointer !== event.pointerId) return
          const delta = start.y - event.clientY
          if (Math.abs(delta) > 5) moved.current = true
          if (moved.current) setHeight(Math.max(190, Math.min(start.max, start.height + delta)))
        }}
        onPointerUp={event => {
          const start = drag.current
          if (!start || start.pointer !== event.pointerId) return
          if (moved.current) setExpanded(start.y > event.clientY)
          drag.current = null
          setHeight(null)
        }}
        onPointerCancel={() => { drag.current = null; moved.current = true; setHeight(null) }}
      >
        <span aria-hidden="true" />
      </button>

      <div id="route-sheet-content" className="route-sheet-content">
        <JourneyTrack stages={stagesRef.current} fraction={maxFraction.current} moving={moving} arrived={arrived} />
        <h1>Đến {place.name}</h1>
        <h2 className="route-distance" aria-live="polite">
          {arrived ? 'Bạn đã đến nơi!' : progress ? `Còn ${formatMeters(progress.remaining)} đi bộ` : instruction}
        </h2>

        {/* NÂNG CẤP 5: Hướng dẫn chi tiết khoảng cách & sai số GPS */}
        {!arrived && activeSample && (
          <p className="journey-caption" style={{ margin: '0 0 10px', color: '#135e4d' }}>
            {arrivalFeedback.hint}
          </p>
        )}

        {/* THÚC ĐẨY ĐỘNG LỰC: Gợi ý trạm xe đạp TNGo / xe bus Danabus */}
        {nearbyTransit.length > 0 && !nearbyTransit[0].claimed && !arrived && (
          <div className="eco-transit-banner">
            <div className="eco-transit-icon">
              {nearbyTransit[0].station.type === 'bike' ? '🚲' : '🚌'}
            </div>
            <div className="eco-transit-body">
              <div className="eco-transit-title">
                <strong>{nearbyTransit[0].station.type === 'bike' ? 'Trạm xe đạp TNGo' : 'Điểm xe buýt DanaBus'} gần bạn</strong>
                <span className="eco-tag">+{nearbyTransit[0].station.bonusCoins} Xu Xanh</span>
              </div>
              <p className="eco-transit-desc">
                Cách {Math.round(nearbyTransit[0].distance)}m ({nearbyTransit[0].station.name}). Trải nghiệm di chuyển xanh để nhận thưởng!
              </p>
            </div>
            <button
              type="button"
              className="eco-transit-claim-btn"
              onClick={() => handleClaimTransit(nearbyTransit[0])}
            >
              Thuê xe (+5 xu)
            </button>
          </div>
        )}

        {progress && (
          <div className="route-summary">
            <strong>{minutes} phút</strong>
            <span>Đến lúc {arrivalClock(Date.now(), minutes * 60)} · Tuyến đi bộ ngắn nhất</span>
            <button type="button" className="route-exit" aria-label="Thoát khỏi hành trình" onClick={() => setPendingLeave(place.backHref)}>
              Thoát
            </button>
          </div>
        )}

        {locationError && !simulating && <p role="status" className="error">{locationError}</p>}
        {!activeSample && locationError && !simulating && <button type="button" onClick={retryLocation}>Thử lấy vị trí</button>}
        {error && <p role="alert" className="error">Không tải được nền bản đồ.</p>}

        {place.requireArrival && !arrived ? (
          <button type="button" className="blue-button" disabled>
            {simulating ? 'Đang chạy mô phỏng đến điểm bắt đầu...' : 'Đến điểm bắt đầu để mở nhiệm vụ'}
          </button>
        ) : (
          <a className="blue-button" href={place.continueHref} onClick={() => { allowLeave.current = true }}>
            {place.continueLabel ?? 'Xem nhiệm vụ'} →
          </a>
        )}
      </div>
    </section>

    {/* THÚC ĐẨY ĐỘNG LỰC: POPUP "ĐẬP VÔ MẶT" KHI NGƯỜI DÙNG DELAY / NGHỈ CHÂN */}
    {showDelayNudge && !arrived && (
      <div className="delay-nudge-overlay" role="dialog" aria-modal="true" aria-labelledby="delay-nudge-title">
        <div className="delay-nudge-modal">
          <div className="delay-nudge-badge">⚡ TIẾP TỤC HÀNH TRÌNH NÀO!</div>
          <h2 id="delay-nudge-title" className="delay-nudge-title">BẠN ĐANG DỪNG LẠI À? 🏃💨</h2>
          <p className="delay-nudge-body">
            Bạn đã dừng chân nghỉ một lát rồi đó! Chỉ còn <strong>{progress ? formatMeters(progress.remaining) : 'một đoạn ngắn'}</strong> nữa là tới <strong>{place.name}</strong> để ẵm trọn <strong>10 Green Coins</strong> và mở khóa nhiệm vụ khám phá!
          </p>

          {nearbyTransit.length > 0 && (
            <div className="delay-nudge-eco-hint">
              🚲 Nếu thấy mỏi chân, hãy ghé ngay <strong>{nearbyTransit[0].station.name}</strong> cách bạn {Math.round(nearbyTransit[0].distance)}m để thuê xe đạp TNGo nhé!
            </div>
          )}

          <div className="delay-nudge-actions">
            <button
              type="button"
              className="delay-nudge-btn-main"
              onClick={() => {
                setShowDelayNudge(false)
                lastMoveTimestamp.current = Date.now()
                window.dispatchEvent(new CustomEvent('dana-toast', { detail: '🔥 Tuyệt vời! Cố lên, điểm đến ngay trước mắt rồi!' }))
              }}
            >
              🚀 Tôi đang đi tiếp đây! (Tiến lên)
            </button>
            <button
              type="button"
              className="delay-nudge-btn-snooze"
              onClick={() => {
                setShowDelayNudge(false)
                snoozeUntil.current = Date.now() + 120_000 // Nghỉ 2 phút
                window.dispatchEvent(new CustomEvent('dana-toast', { detail: 'Đã tạm hoãn nhắc nhở trong 2 phút.' }))
              }}
            >
              Tạm dừng chân nghỉ 2 phút
            </button>
          </div>
        </div>
      </div>
    )}

    <ConfirmDialog
      open={pendingLeave !== null}
      title="Rời khỏi hành trình?"
      message="Bạn có muốn rời khỏi hành trình hiện tại và quay về trang trước không?"
      confirmLabel="Rời khỏi hành trình"
      cancelLabel="Tiếp tục hành trình"
      onCancel={cancelLeave}
      onConfirm={() => {
        if (pendingLeave !== null) {
          allowLeave.current = true
          window.location.hash = pendingLeave
          setPendingLeave(null)
        }
      }}
    />
  </main>
}
