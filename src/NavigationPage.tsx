import './ui/MapControls.css'
import { interpolate, t } from './i18n/locale'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createBaseTileLayer } from './lib/mapTiles'
import { getDestination } from './data/destinations'
import PixelAvatar from './PixelAvatar'
import { avatars, readAvatar } from './lib/avatar'
import { usePlayerLocation } from './lib/usePlayerLocation'
import { distanceMeters, getArrivalFeedback, hasArrived, type LocationSample } from './lib/location'
import JourneyTrack from './JourneyTrack'
import { advanceFraction, planStages } from './lib/routeStages'
import { useWalkingRoute } from './lib/useWalkingRoute'
import { arrivalClock, bearing, directionName, formatMeters, headingBetween, turnIcon, turnText, nextTurnText, toLatLng, type Point } from './lib/routing'
import { getNearbyGreenTransit, claimTransitReward, type NearbyTransitResult } from './lib/ecoTransit'
import './NavigationPage.css'
import ConfirmDialog from './ConfirmDialog'
import { getQuest } from './data/quests'
import { useOptionalAuth } from './AuthContext'
import { requestLogin } from './lib/authPrompt'
import { useQuestProgress } from './lib/useQuestProgress'
import { getQuestPricing, isPaidQuest, openPremiumModal, usePremiumAccess } from './lib/premium'

function currentArrivalClock(seconds: number): string {
  return arrivalClock(Date.now(), seconds)
}

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

export default function NavigationPage({ id, target, fromMap = false }: { id: string; target?: NavigationTarget; fromMap?: boolean }) {
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
  const baseline = useRef(0)
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

  // ---------- Chế độ Mô phỏng hành trình (GPS Walk Simulation Demo) ----------
  const [simulating, setSimulating] = useState(false)
  const [simPaused, setSimPaused] = useState(false)
  const [simSpeed, setSimSpeed] = useState<number>(3) // 1x, 3x, 6x
  const [simProgress, setSimProgress] = useState(0) // 0 -> 1
  const simProgressRef = useRef(0)
  const [simSample, setSimSample] = useState<LocationSample | null>(null)

  // ---------- Phương tiện xanh & Delay Nudge ----------
  const [transitUpdateTick, setTransitUpdateTick] = useState(0)
  const [showDelayNudge, setShowDelayNudge] = useState(false)
  const [journeyFraction, setJourneyFraction] = useState(0)
  const lastMoveTimestamp = useRef(0)
  const lastPosCheck = useRef<Point | null>(null)
  const snoozeUntil = useRef(0)
  const stationDwellStart = useRef<{ stationId: string; entryTime: number } | null>(null)
  const [dwellSeconds, setDwellSeconds] = useState(0)

  const auth = useOptionalAuth()
  const { hasAccess: hasQuestAccess } = usePremiumAccess(auth?.user?.id)
  const { dispatch: questDispatch, busy: questBusy, error: questError } = useQuestProgress()
  const [arrivalModalDismissed, setArrivalModalDismissed] = useState(false)
  const quest = getQuest(id)
  const destination = getDestination(id)
  const place: NavigationTarget | undefined = useMemo(() => target ?? (fromMap && (destination || quest) ? {
    id,
    name: destination?.name ?? quest!.area,
    position: destination?.position ?? quest!.startPosition,
    backHref: '#/map',
    continueHref: quest ? `#/quest/${quest.id}` : `#/nhiem-vu/${id}`,
    continueLabel: quest ? t('Bắt đầu ngay') : t('Xem nhiệm vụ'),
  } : destination ? {
    id: destination.id,
    name: destination.name,
    position: destination.position,
    backHref: `#/dia-diem/${destination.id}`,
    continueHref: `#/nhiem-vu/${destination.id}`,
  } : quest ? {
    id: quest.id,
    name: quest.area,
    position: quest.startPosition,
    backHref: `#/quest/${quest.id}`,
    continueHref: `#/quest/${quest.id}`,
    continueLabel: t('Bắt đầu ngay'),
  } : undefined), [destination, quest, target, fromMap, id])

  const { sample, error: locationError, retry: retryLocation } = usePlayerLocation()

  // Vị trí hiệu lực: khi đang bật mô phỏng thì ưu tiên vị trí mô phỏng
  const activeSample: LocationSample | null = useMemo(() => {
    if (simulating && simSample) return simSample
    return sample
  }, [simulating, simSample, sample])

  const sampleRef = useRef(activeSample)
  useEffect(() => {
    sampleRef.current = activeSample
  }, [activeSample])

  const navigation = useWalkingRoute(id, activeSample, place?.position)
  const currentHref = target ? `#/quest/${id}/dan-duong` : fromMap ? `#/chi-duong/${id}?tu=map` : `#/chi-duong/${id}`
  const arrivedRef = useRef(false)

  // Guard rời khỏi trang (không chặn nếu đã đến nơi và bấm tiếp tục vào nhiệm vụ/quest)
  useEffect(() => {
    const guard = (event: Event) => {
      const targetHash = (event as CustomEvent<{ hash: string }>).detail.hash
      const isContinueTarget = arrivedRef.current && (
        targetHash === place?.continueHref ||
        targetHash === `#/quest/${id}/choi` ||
        targetHash === `#/nhiem-vu/${id}`
      )
      if (allowLeave.current || targetHash === currentHref || isContinueTarget) return
      event.preventDefault()
      setPendingLeave(targetHash || '#/')
    }
    window.addEventListener('dana-before-navigation', guard)
    return () => window.removeEventListener('dana-before-navigation', guard)
  }, [currentHref, id, place?.continueHref])

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!container.current || !place) return
    const map = L.map(container.current, { zoomControl: false }).setView(place.position, 15)
    mapRef.current = map
    centered.current = false
    map.attributionControl.setPrefix(false)

    const timer = window.setTimeout(() => setError(true), 12000)
    const tiles = createBaseTileLayer().addTo(map)
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

    const player = L.marker(place.position, { title: t('Vị trí của bạn'), zIndexOffset: 2000, icon: L.divIcon({ className: 'navigation-player-marker', html: avatarElement, iconSize: [40, 50], iconAnchor: [20, 50] }) })
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

    // SỬA LỖI MAP RẤT XA: Vào màn hình là zoom sát vị trí người chơi (Zoom 17) kiểu Google Maps!
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

  // Vẽ lộ trình trên bản đồ kiểu Google Maps
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

  // Logic Chạy Mô Phỏng Tự Động (Simulation Demo)
  useEffect(() => {
    if (!simulating || simPaused || !navigation.route || !place) return
    const coords = navigation.route.geometry.coordinates.map(toLatLng)
    if (coords.length < 2) return

    const timer = window.setInterval(() => {
      const step = 0.015 * simSpeed
      const next = Math.min(1, simProgressRef.current + step)
      simProgressRef.current = next
      setSimProgress(next)
      if (next >= 1) {
        window.clearInterval(timer)
        setSimSample({ latitude: place.position[0], longitude: place.position[1], accuracy: 10, timestamp: Date.now() })
        window.dispatchEvent(new CustomEvent('dana-toast', { detail: '🎉 ' + t('Đã mô phỏng đến đích! Bạn có thể thực hiện nhiệm vụ ngay.') }))
        navigator.vibrate?.([100, 50, 150])
        return
      }

      const floatIdx = next * (coords.length - 1)
      const idx = Math.floor(floatIdx)
      const frac = floatIdx - idx
      const p1 = coords[idx]
      const p2 = coords[Math.min(coords.length - 1, idx + 1)]
      const lat = p1[0] + (p2[0] - p1[0]) * frac
      const lng = p1[1] + (p2[1] - p1[1]) * frac

      setSimSample({ latitude: lat, longitude: lng, accuracy: 8, timestamp: Date.now() })
    }, 700)

    return () => window.clearInterval(timer)
  }, [simulating, simPaused, simSpeed, navigation.route, place])

  const toggleSimulation = () => {
    if (simulating) {
      setSimulating(false)
      setSimSample(null)
      simProgressRef.current = 0
      setSimProgress(0)
      window.dispatchEvent(new CustomEvent('dana-toast', { detail: t('Đã dừng chế độ mô phỏng, quay lại vị trí thực tế.') }))
    } else {
      if (!navigation.route) {
        window.dispatchEvent(new CustomEvent('dana-toast', { detail: t('Đang tải lộ trình, vui lòng chờ trong giây lát...') }))
        return
      }
      const coords = navigation.route.geometry.coordinates.map(toLatLng)
      setSimulating(true)
      setSimPaused(false)
      simProgressRef.current = 0
      setSimProgress(0)
      if (coords.length > 0) {
        setSimSample({ latitude: coords[0][0], longitude: coords[0][1], accuracy: 8, timestamp: Date.now() })
      }
      followRef.current = true
      setFollow(true)
      window.dispatchEvent(new CustomEvent('dana-toast', { detail: '▶ ' + t('Bắt đầu mô phỏng đi bộ dọc theo tuyến đường!') }))
    }
  }

  // Trạm xe đạp TNGo & DanaBus gần đó
  const nearbyTransit: NearbyTransitResult[] = useMemo(() => {
    if (!activeSample) return []
    void transitUpdateTick
    return getNearbyGreenTransit([activeSample.latitude, activeSample.longitude], 350)
  }, [activeSample, transitUpdateTick])

  // Đếm thời gian lưu lại khu vực trạm (tối thiểu 60s để chống gian lận)
  useEffect(() => {
    if (!activeSample || simulating || !nearbyTransit.length) {
      stationDwellStart.current = null
      setDwellSeconds(0)
      return
    }
    const nearest = nearbyTransit[0]
    if (nearest.distance <= 80 && !nearest.claimed) {
      if (!stationDwellStart.current || stationDwellStart.current.stationId !== nearest.station.id) {
        stationDwellStart.current = { stationId: nearest.station.id, entryTime: Date.now() }
      }
      const timer = window.setInterval(() => {
        if (stationDwellStart.current) {
          const secs = Math.floor((Date.now() - stationDwellStart.current.entryTime) / 1000)
          setDwellSeconds(secs)
        }
      }, 1000)
      return () => window.clearInterval(timer)
    } else {
      stationDwellStart.current = null
      setDwellSeconds(0)
    }
  }, [activeSample, simulating, nearbyTransit])

  // Marker các trạm xe đạp TNGo / xe bus trên bản đồ
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    transitMarkersRef.current.forEach(m => m.remove())
    transitMarkersRef.current = []

    nearbyTransit.forEach(({ station, distance, claimed }) => {
      const icon = L.divIcon({
        className: 'custom-transit-marker',
        html: `<div class="transit-pin ${station.type}" title="${station.name}"><span>${station.type === 'bike' ? '🚲' : '🚌'}</span></div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })
      const marker = L.marker(station.position, { icon }).addTo(map)
      marker.bindTooltip(`<b>${station.name}</b><br/>${interpolate('Cách bạn ${0}m · ${1}', [String(Math.round(distance)), claimed ? t('Đã nhận thưởng') : `+${station.bonusCoins} Green Coins`])}`, { direction: 'top' })
      transitMarkersRef.current.push(marker)
    })

    return () => {
      transitMarkersRef.current.forEach(m => m.remove())
      transitMarkersRef.current = []
    }
  }, [nearbyTransit])

  // Phát hiện Delay & Hiện Popup Nudge
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

  const stages = useMemo(() => {
    return navigation.initialRoute ? planStages(navigation.initialRoute) : []
  }, [navigation.initialRoute])

  const progress = navigation.usable ? navigation.progress : null

  useEffect(() => {
    if (navigation.initialRoute) {
      baseline.current = navigation.initialRoute.distance
    }
  }, [navigation.initialRoute])

  useEffect(() => {
    if (progress && baseline.current) {
      setJourneyFraction(prev => advanceFraction(prev, progress.remaining, baseline.current))
    }
  }, [progress])

  useEffect(() => {
    if (simulating) {
      setJourneyFraction(prev => Math.max(prev, simProgress))
    }
  }, [simulating, simProgress])

  const arrived = place ? ((!!activeSample && hasArrived(activeSample, place.position)) || (simulating && simProgress >= 0.98)) : false
  useEffect(() => {
    arrivedRef.current = arrived
    if (!arrived) setArrivalModalDismissed(false)
  }, [arrived])

  const lockedPaidQuest = !!quest && isPaidQuest(quest.id) && !hasQuestAccess(quest.id)
  const lockedPricing = quest ? getQuestPricing(quest.id) : null

  async function handleStartAfterArrival() {
    if (!place) return
    if (quest) {
      if (isPaidQuest(quest.id) && !hasQuestAccess(quest.id)) {
        openPremiumModal({ questId: quest.id, reason: 'arrival', onUnlocked: () => setArrivalModalDismissed(false) })
        return
      }
      if (auth && auth.status !== 'authenticated' && auth.status !== 'unconfigured') {
        requestLogin()
        return
      }
      if (auth?.status === 'authenticated' && !auth.user?.avatarId) {
        allowLeave.current = true
        window.location.hash = '#/chon-nhan-vat'
        return
      }
      const started = await questDispatch({ type: 'start', questId: quest.id })
      if (!started) return
      const confirmed = await questDispatch({ type: 'confirm-arrival', questId: quest.id })
      if (!confirmed) return
      allowLeave.current = true
      window.location.hash = `#/quest/${quest.id}/choi`
      return
    }
    allowLeave.current = true
    window.location.hash = place.continueHref
  }

  if (!place) return <main className="screen-page"><h1>{t('Không tìm thấy điểm đến')}</h1><a href="#/map">{t('← Bản đồ')}</a></main>

  // Điều kiện đến nơi
  const arrivalFeedback = getArrivalFeedback(activeSample, place.position)

  const here: Point | null = activeSample ? [activeSample.latitude, activeSample.longitude] : null
  const toward = (to: Point) => here ? interpolate('hướng ${0}, cách ${1}', [directionName(bearing(here, to)), formatMeters(distanceMeters(here, to))]) : ''
  const lost = !progress && !arrived && !!activeSample && navigation.usable && !!deviation

  const instruction = arrived
    ? t('Bạn đã đến nơi!')
    : progress
    ? progress.toTurn <= 12
      ? navigation.precise ? turnText(progress.next) : t('Gần chỗ rẽ · vị trí ước tính')
      : interpolate('Đi thẳng ${0}', [formatMeters(progress.toTurn)])
    : !activeSample
    ? locationError ? t(locationError) : t('Đang xác định vị trí…')
    : !navigation.usable
    ? t('Vị trí còn lệch nhiều. Đang lấy GPS tốt hơn…')
    : lost
    ? t('Bạn đã đi lệch tuyến')
    : navigation.busy
    ? t('Đang tính đường đi bộ…')
    : navigation.error || t('Đang tính lại đường đi…')

  const subline = arrived || !activeSample
    ? interpolate('Đến ${0}', [place.name])
    : progress
    ? progress.toTurn > 12
      ? interpolate('Sau đó ${0}', [nextTurnText(progress.next)])
      : navigation.precise ? interpolate('Tiếp tục ${0}', [formatMeters(progress.next.distance)]) : turnText(progress.next)
    : lost
    ? navigation.busy ? t('Đang tính lại đường từ vị trí hiện tại của bạn…') : interpolate('Theo đường chấm để quay về tuyến (${0})', [toward(deviation!.snapped)])
    : navigation.error && navigation.usable ? interpolate('Đường chim bay tới ${0}: ${1}', [place.name, toward(place.position)]) : interpolate('Đến ${0}', [place.name])

  const minutes = progress ? Math.max(1, Math.round(navigation.route!.duration * progress.remaining / Math.max(1, navigation.route!.distance) / 60)) : 0

  const handleClaimTransit = async (item: NearbyTransitResult) => {
    await claimTransitReward({
      station: item.station,
      sample: activeSample,
      dwellSeconds,
      simulating,
    })
    setTransitUpdateTick(v => v + 1)
  }

  return <main className="navigation-screen">
    <div className="route-map" ref={container} role="region" aria-label={t('Bản đồ vị trí của bạn và điểm đến')} />

    {/* Bảng chỉ dẫn kiểu Google Maps */}
    <div className="route-instruction">
      <a ref={backLink} className="dq-back-btn" href={place.backHref} aria-label={t('Quay lại chi tiết')} onClick={event => { event.preventDefault(); setPendingLeave(place.backHref) }}>← {t('Quay lại')}</a>
      <b aria-hidden="true">{lost ? '⤺' : turnIcon(progress?.next)}</b>
      <div aria-live="polite">
        <strong>{instruction}</strong>
        <small>{subline}</small>
      </div>
      {progress && !arrived && progress.toTurn > 12 && <span className="route-turn-distance" aria-hidden="true">{formatMeters(progress.toTurn)}</span>}
    </div>

    {/* Thanh điều khiển Mô Phỏng Demo */}
    {simulating && (
      <div className="sim-control-bar" role="toolbar" aria-label={t('Thanh điều khiển mô phỏng di chuyển', 'Movement simulation controls')}>
        <div className="sim-badge">
          <span className="pulse-dot" />
          <span>{t('MÔ PHỎNG', 'SIMULATION')} ({Math.round(simProgress * 100)}%)</span>
        </div>
        <div className="sim-actions">
          <button
            type="button"
            className="sim-action-btn"
            onClick={() => setSimPaused(p => !p)}
            title={simPaused ? t('Tiếp tục chạy', 'Resume') : t('Tạm dừng', 'Pause')}
          >
            {simPaused ? t('▶ Tiếp tục', '▶ Resume') : t('⏸ Dừng', '⏸ Pause')}
          </button>
          <button
            type="button"
            className={`sim-action-btn ${simSpeed === 1 ? 'active-speed' : ''}`}
            onClick={() => setSimSpeed(1)}
            title={t('Tốc độ đi bộ thật', 'Walking speed')}
          >
            1x
          </button>
          <button
            type="button"
            className={`sim-action-btn ${simSpeed === 3 ? 'active-speed' : ''}`}
            onClick={() => setSimSpeed(3)}
            title={t('Tốc độ chạy bộ', 'Jogging speed')}
          >
            3x
          </button>
          <button
            type="button"
            className={`sim-action-btn ${simSpeed === 6 ? 'active-speed' : ''}`}
            onClick={() => setSimSpeed(6)}
            title={t('Tốc độ xe đạp', 'Cycling speed')}
          >
            6x
          </button>
          <button
            type="button"
            className="sim-action-btn exit-sim"
            onClick={toggleSimulation}
            title={t('Thoát chế độ mô phỏng', 'Exit simulation')}
          >
            {t('✕ Thoát', '✕ Exit')}
          </button>
        </div>
      </div>
    )}

    {rerouteNotice && <p className="route-reroute-note" role="status">{t('Đã tính lại đường từ vị trí hiện tại của bạn')}</p>}

    {/* Các nút công cụ trên bản đồ */}
    <div className="route-tools">
      <button
        type="button"
        className={`route-tool sim-btn ${simulating ? 'active' : ''}`}
        onClick={toggleSimulation}
        aria-label={t('Bật hoặc tắt chế độ mô phỏng đi bộ demo', 'Toggle walking simulation demo')}
      >
        🎮 {simulating ? t('Đang mô phỏng', 'Simulating') : t('Mô phỏng demo', 'Demo simulation')}
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
          <span aria-hidden="true">▲</span> {t('Về giữa')}
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
          {t('Xem toàn tuyến')}
        </button>
      )}
    </div>

    {/* [UX-FLOW] Thẻ nổi xác nhận khi mô phỏng chạy đến 100% */}
    {arrived && !arrivalModalDismissed && (fromMap || simulating || lockedPaidQuest) && (
      <div
        className="nav-arrival-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-arrival-title"
      >
        <div className={`nav-arrival-modal ${lockedPaidQuest ? 'is-premium' : ''}`}>
          <button
            type="button"
            className="nav-arrival-close"
            aria-label={t('Đóng thông báo', 'Close arrival notification')}
            onClick={() => setArrivalModalDismissed(true)}
          >
            ×
          </button>

          {lockedPaidQuest ? (
            <>
              <span className="nav-arrival-badge is-premium">
                ✦ {lockedPricing?.tierId === 'pro' ? t('GÓI PRO · GIẢM 45%', 'PRO PLAN · 45% OFF') : t('GÓI PLUS · GIẢM 40%', 'PLUS PLAN · 40% OFF')}
              </span>
              <h2 id="nav-arrival-title" className="nav-arrival-title">
                {t(`Bạn đã đến ${place.name}!`, `You have arrived at ${place.name}!`)}
              </h2>
              <p className="nav-arrival-desc">
                {lockedPricing?.tierId === 'pro' ? t(`Hành trình ${quest?.title || place.name} nằm trong Gói Pro. Kích hoạt Gói Pro hàng tháng ngay để giải mã thử thách tại đây, nhận EXP, Xu Dana và Thẻ hành trình cá nhân!`, `${quest?.title || place.name} is included in Dana Quest Pro. Unlock Pro monthly to play challenges, earn EXP, Dana Coins, and your custom PNG card!`) : t('Ánh đèn rồng trên sông Hàn đang cất giữ bản phác thảo thất lạc từ người vẽ đèn. Mở khóa hành trình Đánh thức Long Mạch với Gói Plus hoặc Pro để giải mã câu chuyện giữa lòng Đà Nẵng, nhận EXP, Xu Dana và Thẻ hành trình cá nhân!', 'Dragon Bridge holds a lost sketch by the lantern painter. Unlock Awakening the Dragon Vein with Plus or Pro to play and earn EXP, Dana Coins, and your PNG Journey Card!')}
              </p>
              <div className="nav-arrival-price-row">
                <span className="nav-arrival-price-old">{lockedPricing?.originalCurrencyLabel || '50.000đ/tháng'}</span>
                <strong className="nav-arrival-price-new">{lockedPricing?.currencyLabel || '30.000đ/tháng'}</strong>
                <span className="nav-arrival-price-save">{lockedPricing?.tierId === 'pro' ? t('Ưu đãi ra mắt -45%', 'Launch -45%') : t('Ưu đãi ra mắt -40%', 'Launch -40%')}</span>
              </div>
              <button
                type="button"
                className="nav-arrival-cta is-premium"
                onClick={() => openPremiumModal({ questId: id, reason: 'arrival', onUnlocked: () => setArrivalModalDismissed(false) })}
              >
                {t('Mua ngay để trải nghiệm →', 'Buy Now to Experience →')}
              </button>
            </>
          ) : (
            <>
              <span className="nav-arrival-badge">
                🎉 {t('Đã đến điểm hẹn', 'Arrived at starting point')}
              </span>
              <h2 id="nav-arrival-title" className="nav-arrival-title">
                {t('Bạn đã đến nơi!', 'You have arrived!')}
              </h2>
              <p className="nav-arrival-desc">
                {t('Sẵn sàng khám phá câu chuyện nơi đây chưa?', 'Are you ready to uncover the story here?')}
              </p>
              <p className="nav-arrival-place">{place.name}</p>
              {questError && <p role="alert" className="error">{t(questError)}</p>}
              <button
                type="button"
                className="nav-arrival-cta"
                disabled={questBusy}
                onClick={() => void handleStartAfterArrival()}
              >
                {questBusy ? t('Đang mở hành trình…', 'Opening journey…') : t('Bắt đầu ngay →', 'Start Now →')}
              </button>
            </>
          )}
        </div>
      </div>
    )}

    {/* Bottom Sheet thông tin hành trình */}
    <section
      ref={panel}
      className={`route-sheet live-route-sheet ${expanded ? 'expanded' : ''} ${height !== null ? 'dragging' : ''}`}
      style={height !== null ? { height } : undefined}
      aria-label={interpolate('Hướng dẫn đến ${0}', [place.name])}
    >
      <button
        type="button"
        className="route-sheet-handle"
        aria-label={t('Mở rộng hoặc thu gọn hướng dẫn')}
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
        <JourneyTrack stages={stages} fraction={journeyFraction} moving={moving} arrived={arrived} />
        <h1>{t('Đến') + ' '}{place.name}</h1>
        <h2 className="route-distance" aria-live="polite">
          {arrived ? t('Bạn đã đến nơi!') : progress ? interpolate('Còn ${0} đi bộ', [formatMeters(progress.remaining)]) : instruction}
        </h2>

        {!arrived && activeSample && (
          <p className="journey-caption" style={{ margin: '0 0 10px', color: '#135e4d' }}>
            {arrivalFeedback.hint}
          </p>
        )}

        {/* Gợi ý trạm xe đạp TNGo / xe bus Danabus */}
        {nearbyTransit.length > 0 && !nearbyTransit[0].claimed && !arrived && (() => {
          const item = nearbyTransit[0]
          const isSim = simulating
          const poorGps = !activeSample || (activeSample.accuracy ?? 0) > 50
          const tooFar = item.distance > 80
          const needDwell = dwellSeconds < 60
          const canClaim = !isSim && !poorGps && !tooFar && !needDwell
          const buttonLabel = isSim
            ? t('Mô phỏng (không nhận xu)')
            : poorGps
            ? t('GPS yếu (> 50m)')
            : tooFar
            ? interpolate('Chưa tới trạm (${0}m)', [Math.round(item.distance)])
            : needDwell
            ? interpolate('Ở lại trạm (${0}s)', [60 - dwellSeconds])
            : interpolate('Tôi đã đến trạm (+${0} xu)', [item.station.bonusCoins])

          return (
            <div className="eco-transit-banner">
              <div className="eco-transit-icon">
                {item.station.type === 'bike' ? '🚲' : '🚌'}
              </div>
              <div className="eco-transit-body">
                <div className="eco-transit-title">
                  <strong>{item.station.type === 'bike' ? t('Trạm xe đạp TNGo') : t('Điểm xe buýt DanaBus')} {t('gần bạn')}</strong>
                  <span className="eco-tag">+{item.station.bonusCoins} {t('Xu')}</span>
                </div>
                <p className="eco-transit-desc">
                  {interpolate('Cách ${0}m (${1}). Ở lại trạm 60s để nhận thưởng!', [Math.round(item.distance), item.station.name])}
                </p>
              </div>
              <button
                type="button"
                className="eco-transit-claim-btn"
                disabled={!canClaim}
                onClick={() => void handleClaimTransit(item)}
              >
                {buttonLabel}
              </button>
            </div>
          )
        })()}

        {progress && (
          <div className="route-summary">
            <strong>{minutes} {t('phút')}</strong>
            <span>{t('Đến lúc')} {currentArrivalClock(minutes * 60)} · {t('Tuyến đi bộ ngắn nhất')}</span>
            <button type="button" className="route-exit" aria-label={t('Thoát khỏi hành trình')} onClick={() => setPendingLeave(place.backHref)}>
              {t('Thoát')}
            </button>
          </div>
        )}

        {locationError && !simulating && Boolean(activeSample) && <p role="status" className="error">{t(locationError)}</p>}
        {!activeSample && locationError && !simulating && <button type="button" onClick={retryLocation}>{t('Thử lấy vị trí')}</button>}
        {error && <p role="alert" className="error">{t('Không tải được nền bản đồ.')}</p>}

        {place.requireArrival && !arrived ? (
          <button type="button" className="blue-button" disabled>
            {simulating ? t('Đang chạy mô phỏng đến điểm bắt đầu...', 'Simulating walk to starting point...') : t('Đến điểm bắt đầu để mở nhiệm vụ')}
          </button>
        ) : fromMap ? (
          !arrived ? (
            <button type="button" className="blue-button" disabled>
              {simulating ? t('Đang di chuyển đến điểm hẹn…') : t('Di chuyển đến điểm hẹn để bắt đầu')}
            </button>
          ) : lockedPaidQuest ? (
            <button
              type="button"
              className="blue-button is-premium-cta"
              onClick={() => openPremiumModal({ questId: id, reason: 'arrival', onUnlocked: () => setArrivalModalDismissed(false) })}
            >
              {t('Mua ngay để trải nghiệm →', 'Buy Now to Experience →')}
            </button>
          ) : (
            <button
              type="button"
              className="blue-button"
              disabled={questBusy}
              onClick={() => void handleStartAfterArrival()}
            >
              {questBusy ? t('Đang mở…') : t('Bắt đầu ngay →', 'Start Now →')}
            </button>
          )
        ) : (
          <a className="blue-button" href={place.continueHref} onClick={() => { allowLeave.current = true }}>
            {place.continueLabel ?? t('Xem nhiệm vụ')} →
          </a>
        )}
      </div>
    </section>

    {/* POPUP "ĐẬP VÔ MẶT" KHI NGƯỜI DÙNG DELAY / NGHỈ CHÂN */}
    {showDelayNudge && !arrived && (
      <div className="delay-nudge-overlay" role="dialog" aria-modal="true" aria-labelledby="delay-nudge-title">
        <div className="delay-nudge-modal">
          <div className="delay-nudge-badge">{t('⚡ TIẾP TỤC HÀNH TRÌNH NÀO!', '⚡ KEEP GOING!')}</div>
          <h3 id="delay-nudge-title" className="delay-nudge-title">{t('BẠN ĐANG DỪNG LẠI À? 🏃💨', 'TAKING A BREAK? 🏃💨')}</h3>
          <p className="delay-nudge-body">
            {t('Bạn đã dừng chân nghỉ một lát rồi đó! Chỉ còn', 'You have paused for a moment! Only')} <strong>{progress ? formatMeters(progress.remaining) : t('một đoạn ngắn', 'a short distance')}</strong> {t('nữa là tới', 'left to reach')} <strong>{place.name}</strong> {t('để ẵm trọn', 'to earn')} <strong>10 Green Coins</strong> {t('và mở khóa nhiệm vụ khám phá!', 'and unlock the exploration mission!')}
          </p>

          {nearbyTransit.length > 0 && (
            <div className="delay-nudge-eco-hint">
              🚲 {t('Nếu thấy mỏi chân, hãy ghé ngay', 'If your feet are tired, stop by')} <strong>{nearbyTransit[0].station.name}</strong> {t('cách bạn', 'just')} {Math.round(nearbyTransit[0].distance)}m {t('để thuê xe đạp TNGo nhé!', 'away to rent a TNGo bike!')}
            </div>
          )}

          <div className="delay-nudge-actions">
            <button
              type="button"
              className="delay-nudge-btn-main"
              onClick={() => {
                setShowDelayNudge(false)
                lastMoveTimestamp.current = Date.now()
                window.dispatchEvent(new CustomEvent('dana-toast', { detail: t('🔥 Tuyệt vời! Cố lên, điểm đến ngay trước mắt rồi!', '🔥 Awesome! Keep going, the destination is right ahead!') }))
              }}
            >
              {t('🚀 Tôi đang đi tiếp đây! (Tiến lên)', '🚀 I am moving again! (Onward)')}
            </button>
            <button
              type="button"
              className="delay-nudge-btn-snooze"
              onClick={() => {
                setShowDelayNudge(false)
                snoozeUntil.current = Date.now() + 120_000 // Nghỉ 2 phút
                window.dispatchEvent(new CustomEvent('dana-toast', { detail: t('Đã tạm hoãn nhắc nhở trong 2 phút.', 'Reminders snoozed for 2 minutes.') }))
              }}
            >
              {t('Tạm dừng chân nghỉ 2 phút', 'Pause reminders for 2 minutes')}
            </button>
          </div>
        </div>
      </div>
    )}

    <ConfirmDialog
      open={pendingLeave !== null}
      title={t('Rời khỏi hành trình?')}
      message={t('Bạn có muốn rời khỏi hành trình hiện tại và quay về trang trước không?')}
      confirmLabel={t('Rời khỏi hành trình')}
      cancelLabel={t('Tiếp tục hành trình')}
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
