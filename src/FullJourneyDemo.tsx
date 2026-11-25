import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useOptionalAuth } from './AuthContext'
import { avatars, readAvatar, resolveAvatar, type Avatar } from './lib/avatar'
import PixelAvatar from './PixelAvatar'
import { createBaseTileLayer } from './lib/mapTiles'
import { DANABUS_ROUTES, interpolatePolylineAtProgress, slicePolylineSegment } from './lib/danabusEngine'
import { BUS_QUIZ_BANK } from './lib/busCompanion'
import { playBusArrivalChime } from './lib/busNotifications'
import { getQuest } from './data/quests'
import { pixelLandmarkImageUrl } from './lib/pixelLandmarkSamples'
import { downloadJourneyCardPng, renderJourneyCardPng } from './lib/journeyCard'
import { t } from './i18n/locale'
import './FullJourneyDemo.css'

export const DEMO_TOTAL_SECONDS = 104

export interface DemoChapter {
  id: number
  icon: string
  shortLabel: string
  startSec: number
  endSec: number
}

export const DEMO_CHAPTERS: readonly DemoChapter[] = [
  { id: 1, icon: '📍', shortLabel: '06:00 Trưng Vương', startSec: 0, endSec: 15 },
  { id: 2, icon: '🚌', shortLabel: 'Xe buýt 05 (32s)', startSec: 15, endSec: 47 },
  { id: 3, icon: '⛰️', shortLabel: 'Lên Sơn Trà', startSec: 47, endSec: 57 },
  { id: 4, icon: '📖', shortLabel: 'Chơi Quest (35s)', startSec: 57, endSec: 92 },
  { id: 5, icon: '🏆', shortLabel: 'Thẻ Thông Hành', startSec: 92, endSec: DEMO_TOTAL_SECONDS },
]

// Real road-snapped walking polyline: Nhà hát Trưng Vương -> Trạm Số 9 Lê Duẩn (~400m)
const DEMO_WALK_TO_BUS: [number, number][] = [
  [16.06861, 108.2219],
  [16.0686, 108.22261],
  [16.0686, 108.22275],
  [16.06869, 108.22275],
  [16.06932, 108.22279],
  [16.06965, 108.22281],
  [16.07037, 108.22286],
  [16.07102, 108.22277],
  [16.07159, 108.22271],
  [16.07161, 108.22289],
  [16.07171, 108.22366],
  [16.07173, 108.22382],
]

// Real road-snapped coastal road polyline: Công viên Biển Đông -> Võ Nguyên Giáp -> Hoàng Sa -> Chùa Linh Ứng
const DEMO_SON_TRA_PATH: [number, number][] = [
  [16.07059, 108.24532],
  [16.07328, 108.24524],
  [16.0759, 108.24533],
  [16.0782, 108.2458],
  [16.08008, 108.24676],
  [16.08478, 108.24819],
  [16.08803, 108.24896],
  [16.09146, 108.25084],
  [16.09506, 108.25217],
  [16.09854, 108.25402],
  [16.10071, 108.25644],
  [16.10223, 108.25976],
  [16.10241, 108.2625],
  [16.10214, 108.26464],
  [16.09853, 108.26677],
  [16.09691, 108.2684],
  [16.10047, 108.26945],
  [16.10112, 108.27082],
  [16.09988, 108.27369],
  [16.10102, 108.27524],
  [16.09825, 108.27662],
  [16.09895, 108.27928],
  [16.10028, 108.27951],
  [16.10021, 108.27788],
]

const START_POINT: [number, number] = [16.06861, 108.2219]
const BUS_BOARD_STOP: [number, number] = [16.07171, 108.2238]
const BUS_ALIGHT_STOP: [number, number] = [16.07059, 108.24532]
const LINH_UNG_POINT: [number, number] = [16.1002055, 108.2778816]

const DEMO_GIFTCODE = 'DANABUS05A'
const DEMO_QUEST_ID = 'chua-linh-ung-bai-but'
const DEMO_CH1_ANSWER = 'Chùa Linh Ứng – Bãi Bụt, Sơn Trà'
const QR_PATTERN = [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1]

function formatDurationClock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function getSimMorningClock(elapsedSec: number): string {
  // 0s = 06:00, 15s = 06:02, 47s = 06:16, 57s = 06:28, 92s = 06:40, 104s = 06:42
  let minsAfterSix = 0
  if (elapsedSec <= 15) {
    minsAfterSix = (elapsedSec / 15) * 2
  } else if (elapsedSec <= 47) {
    minsAfterSix = 2 + ((elapsedSec - 15) / 32) * 14
  } else if (elapsedSec <= 57) {
    minsAfterSix = 16 + ((elapsedSec - 47) / 10) * 12
  } else if (elapsedSec <= 92) {
    minsAfterSix = 28 + ((elapsedSec - 57) / 35) * 12
  } else {
    minsAfterSix = 40 + ((elapsedSec - 92) / 12) * 2
  }
  const totalMins = 6 * 60 + Math.floor(minsAfterSix)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} sáng`
}

interface DemoMapProps {
  mode: 'start-to-bus' | 'bus-to-pagoda'
  progress: number
  busApproachProgress: number
  avatar: Avatar
}

function DemoLeafletMap({ mode, progress, busApproachProgress, avatar }: DemoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const playerMarkerRef = useRef<L.Marker | null>(null)
  const busMarkerRef = useRef<L.Marker | null>(null)

  const route05 = useMemo(() => DANABUS_ROUTES.find(r => r.code === '05'), [])
  const route05ApproachSegment = useMemo(() => {
    const dir = route05?.directions.di
    if (!dir) return [[16.07465, 108.21923], [16.07383, 108.22189], BUS_BOARD_STOP] as [number, number][]
    return slicePolylineSegment(dir.polyline, 0.80, 0.871)
  }, [route05])

  const route05RideSegment = useMemo(() => {
    const dir = route05?.directions.di
    if (!dir) return [BUS_BOARD_STOP, [16.07248, 108.23052], BUS_ALIGHT_STOP] as [number, number][]
    return slicePolylineSegment(dir.polyline, 0.871, 1.0)
  }, [route05])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const initialCenter: [number, number] = mode === 'start-to-bus' ? [16.0706, 108.2229] : [16.0865, 108.2615]
    const initialZoom = mode === 'start-to-bus' ? 16 : 13
    const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(initialCenter, initialZoom)
    mapRef.current = map
    createBaseTileLayer().addTo(map)

    if (mode === 'start-to-bus') {
      L.polyline(DEMO_WALK_TO_BUS, { color: '#2563eb', weight: 5, dashArray: '7 7', opacity: 0.9 }).addTo(map)
      L.polyline(route05ApproachSegment, { color: '#eab308', weight: 5, opacity: 0.9 }).addTo(map)
      L.polyline(route05RideSegment, { color: '#16a34a', weight: 4, opacity: 0.65, dashArray: '6 6' }).addTo(map)

      L.marker(START_POINT, {
        icon: L.divIcon({
          className: 'fjd-map-pin-wrap',
          html: '<span class="fjd-map-pin-label">🎭 Nhà hát Trưng Vương</span>',
          iconSize: [160, 26],
          iconAnchor: [80, 32],
        }),
      }).addTo(map)

      L.marker(BUS_BOARD_STOP, {
        icon: L.divIcon({
          className: 'fjd-map-pin-wrap',
          html: '<span class="fjd-map-pin-label">🚏 Trạm Số 9 Lê Duẩn</span>',
          iconSize: [152, 26],
          iconAnchor: [76, 30],
        }),
      }).addTo(map)

      const busInit = interpolatePolylineAtProgress(route05ApproachSegment, 0).position
      busMarkerRef.current = L.marker(busInit, {
        zIndexOffset: 1500,
        icon: L.divIcon({
          className: 'fjd-bus-icon-wrap',
          html: '<div class="fjd-map-bus-marker">🚌 05⚡</div>',
          iconSize: [44, 26],
          iconAnchor: [22, 13],
        }),
      }).addTo(map)
    } else {
      L.polyline(route05RideSegment, { color: '#94a3b8', weight: 4, opacity: 0.55, dashArray: '5 6' }).addTo(map)
      L.polyline(DEMO_SON_TRA_PATH, { color: '#0d9488', weight: 5, opacity: 0.95 }).addTo(map)

      L.marker(BUS_ALIGHT_STOP, {
        icon: L.divIcon({
          className: 'fjd-map-pin-wrap',
          html: '<span class="fjd-map-pin-label">🚏 CV Biển Đông</span>',
          iconSize: [120, 26],
          iconAnchor: [60, 28],
        }),
      }).addTo(map)

      const landmarkUrl = pixelLandmarkImageUrl(DEMO_QUEST_ID)
      L.marker(LINH_UNG_POINT, {
        zIndexOffset: 1200,
        icon: L.divIcon({
          className: 'fjd-map-landmark-marker',
          html: landmarkUrl
            ? `<img src="${landmarkUrl}" alt="Chùa Linh Ứng" />`
            : '<span class="fjd-map-pin-label">🛕 Chùa Linh Ứng</span>',
          iconSize: [58, 58],
          iconAnchor: [29, 52],
        }),
      }).addTo(map)

      L.marker([LINH_UNG_POINT[0] + 0.0022, LINH_UNG_POINT[1]], {
        icon: L.divIcon({
          className: 'fjd-map-pin-wrap',
          html: '<span class="fjd-map-pin-label">🛕 Chùa Linh Ứng – Bãi Bụt</span>',
          iconSize: [176, 26],
          iconAnchor: [88, 28],
        }),
      }).addTo(map)
    }

    const avatarEl = document.createElement('div')
    const root = createRoot(avatarEl)
    root.render(<PixelAvatar avatar={avatar} />)

    const initPlayerPos = mode === 'start-to-bus' ? START_POINT : BUS_ALIGHT_STOP
    playerMarkerRef.current = L.marker(initPlayerPos, {
      zIndexOffset: 2000,
      icon: L.divIcon({
        className: 'navigation-player-marker',
        html: avatarEl,
        iconSize: [40, 50],
        iconAnchor: [20, 48],
      }),
    }).addTo(map)

    const raf = requestAnimationFrame(() => map.invalidateSize({ pan: false }))

    return () => {
      cancelAnimationFrame(raf)
      mapRef.current = null
      playerMarkerRef.current = null
      busMarkerRef.current = null
      map.remove()
      queueMicrotask(() => root.unmount())
    }
  }, [mode, avatar, route05ApproachSegment, route05RideSegment])

  useEffect(() => {
    const path = mode === 'start-to-bus' ? DEMO_WALK_TO_BUS : DEMO_SON_TRA_PATH
    const pos = interpolatePolylineAtProgress(path, progress).position
    playerMarkerRef.current?.setLatLng(pos)
    if (mode === 'start-to-bus' && busMarkerRef.current) {
      const busPos = interpolatePolylineAtProgress(route05ApproachSegment, busApproachProgress).position
      busMarkerRef.current.setLatLng(busPos)
    }
  }, [mode, progress, busApproachProgress, route05ApproachSegment])

  return <div ref={containerRef} className="fjd-map-canvas" aria-label={t('Bản đồ mô phỏng hành trình Đà Nẵng', 'Simulated Da Nang journey map')} />
}

export default function FullJourneyDemo({ onClose, standalone = false }: { onClose?: () => void; standalone?: boolean }) {
  const auth = useOptionalAuth()
  const user = auth?.user ?? null
  const activeAvatar = useMemo(() => resolveAvatar(user?.avatarId) ?? readAvatar() ?? avatars[0], [user?.avatarId])
  const quest = useMemo(() => getQuest(DEMO_QUEST_ID), [])

  const [elapsedSec, setElapsedSec] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1)
  const [soundOn, setSoundOn] = useState(false)
  const [cardPreviewUrl, setCardPreviewUrl] = useState('')
  const [cardSaving, setCardSaving] = useState(false)
  const [cardNotice, setCardNotice] = useState('')
  const [rewardToast, setRewardToast] = useState('')
  const lastMilestoneRef = useRef(-1)
  const chimedStopRef = useRef(false)

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      window.location.hash = '#/'
    }
  }

  // Keyboard Escape closes modal
  useEffect(() => {
    if (standalone) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Deterministic playback ticker
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setElapsedSec(prev => {
        const next = Math.min(DEMO_TOTAL_SECONDS, +(prev + 0.1 * speed).toFixed(2))
        if (next >= DEMO_TOTAL_SECONDS) setPlaying(false)
        return next
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [playing, speed])

  // Derived stage index (1..5)
  const chapterIndex = useMemo(() => {
    if (elapsedSec < 15) return 1
    if (elapsedSec < 47) return 2
    if (elapsedSec < 57) return 3
    if (elapsedSec < 92) return 4
    return 5
  }, [elapsedSec])

  // Derived simulated rewards (purely sandboxed, zero mutation to real account)
  const earnedCoins =
    (elapsedSec >= 13.5 ? 5 : 0) +
    (elapsedSec >= 28.5 ? 10 : 0) +
    (elapsedSec >= 37.5 ? 15 : 0) +
    (elapsedSec >= 72 ? 10 : 0) +
    (elapsedSec >= 88 ? 10 : 0)

  const earnedXp = (elapsedSec >= 72 ? 50 : 0) + (elapsedSec >= 88 ? 70 : 0)

  // Floating reward toast & chime triggers
  useEffect(() => {
    const milestone =
      elapsedSec >= 88
        ? 5
        : elapsedSec >= 72
        ? 4
        : elapsedSec >= 37.5
        ? 3
        : elapsedSec >= 28.5
        ? 2
        : elapsedSec >= 13.5
        ? 1
        : 0

    if (milestone > lastMilestoneRef.current && milestone > 0) {
      const messages: Record<number, string> = {
        1: '🚌 +5 Xu Dana · Xác nhận lên xe buýt điện Tuyến 05!',
        2: '🎮 +10 Xu Dana · Hoàn thành Minigame trên xe buýt!',
        3: `🎁 +15 Xu Dana · Áp dụng Giftcode ${DEMO_GIFTCODE}!`,
        4: '📖 +50 EXP & +10 Xu · Giải đúng chặng 1 "Nốt nhạc không địa chỉ"!',
        5: '🌟 +70 EXP & +10 Xu · Hoàn thành Quest "Dấu lặng trên Sơn Trà"!',
      }
      setRewardToast(messages[milestone])
      const hideTimer = window.setTimeout(() => setRewardToast(''), 2800)
      lastMilestoneRef.current = milestone
      return () => window.clearTimeout(hideTimer)
    }
    if (milestone < lastMilestoneRef.current) {
      lastMilestoneRef.current = milestone
    }
  }, [elapsedSec])

  useEffect(() => {
    if (elapsedSec >= 40 && elapsedSec < 47 && !chimedStopRef.current) {
      chimedStopRef.current = true
      if (soundOn) playBusArrivalChime(true)
    } else if (elapsedSec < 39) {
      chimedStopRef.current = false
    }
  }, [elapsedSec, soundOn])

  // Render authentic PNG Journey Card when reaching Stage 5
  useEffect(() => {
    if (chapterIndex !== 5 || !quest) return
    let cancelled = false
    let objectUrl = ''
    void renderJourneyCardPng({
      questId: DEMO_QUEST_ID,
      questTitle: quest.title,
      area: quest.area,
      solved: quest.checkpoints.length,
      total: quest.checkpoints.length,
      xp: 120,
      coins: 50,
      playerName: user?.name || 'Nhà thám hiểm Đà Nẵng',
      completedAt: Date.now(),
    })
      .then(blob => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setCardPreviewUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [chapterIndex, quest, user?.name])

  async function handleDownloadPass() {
    if (!quest || cardSaving) return
    setCardSaving(true)
    setCardNotice('')
    try {
      await downloadJourneyCardPng({
        questId: DEMO_QUEST_ID,
        questTitle: quest.title,
        area: quest.area,
        solved: quest.checkpoints.length,
        total: quest.checkpoints.length,
        xp: 120,
        coins: 50,
        playerName: user?.name || 'Nhà thám hiểm Đà Nẵng',
        completedAt: Date.now(),
      })
      setCardNotice(t('Đã tải Thẻ Thông Hành (.PNG) về máy!', 'Explorer Pass (.PNG) downloaded!'))
    } catch {
      setCardNotice(t('Không thể xuất PNG trên trình duyệt này.', 'Unable to export PNG in this browser.'))
    } finally {
      setCardSaving(false)
    }
  }

  function jumpTo(sec: number) {
    setElapsedSec(sec)
    if (sec < DEMO_TOTAL_SECONDS) setPlaying(true)
  }

  // Stage 1 derived progress
  const walkToBusProgress = Math.max(0, Math.min(1, elapsedSec / 11))
  const busApproachProgress = Math.max(0, Math.min(1, elapsedSec / 13.5))
  const showBusInvite = elapsedSec >= 3.2
  const busBoardFocused = elapsedSec >= 9.5 && elapsedSec < 13.5
  const busBoardConfirmed = elapsedSec >= 13.5

  // Stage 2 derived bus sub-phase (15..47s)
  const busElapsed = Math.max(0, elapsedSec - 15)
  const busRidePct = Math.max(4, Math.min(100, Math.round((busElapsed / 29) * 100)))
  const busNotifOn = elapsedSec >= 17.5
  const busSubTab: 'wait' | 'quiz' | 'giftcode' =
    elapsedSec < 19 ? 'wait' : elapsedSec < 30 ? 'quiz' : 'giftcode'
  const busStopAlert = elapsedSec >= 40
  const quiz1 = BUS_QUIZ_BANK[1] // Cầu Sông Hàn
  const quiz2 = BUS_QUIZ_BANK[4] // Bán đảo Sơn Trà
  const quizPhase: 'q1' | 'q2' | 'done' = elapsedSec < 23.5 ? 'q1' : elapsedSec < 27 ? 'q2' : 'done'
  const q1Picked = elapsedSec >= 21.2
  const q2Picked = elapsedSec >= 25.2
  const quizClaimed = elapsedSec >= 28.5
  const qrScanned = elapsedSec >= 33.8
  const typedGiftcode = qrScanned
    ? DEMO_GIFTCODE.slice(0, Math.min(DEMO_GIFTCODE.length, Math.max(1, Math.floor((elapsedSec - 33.8) * 6))))
    : ''
  const giftcodeClaimed = elapsedSec >= 37.5

  // Stage 3 derived Son Tra travel (47..57s)
  const sonTraProgress = Math.max(0, Math.min(1, (elapsedSec - 47) / 6.5))
  const arrivedAtPagoda = elapsedSec >= 52.5

  // Stage 4 derived Quest Play (57..92s)
  const ch1 = quest?.checkpoints[0]
  const ch2 = quest?.checkpoints[1]
  const questStep:
    | 'ch1-story'
    | 'ch1-challenge'
    | 'ch1-feedback'
    | 'ch2-story'
    | 'ch2-challenge'
    | 'ch2-feedback' =
    elapsedSec < 63
      ? 'ch1-story'
      : elapsedSec < 72
      ? 'ch1-challenge'
      : elapsedSec < 77
      ? 'ch1-feedback'
      : elapsedSec < 82
      ? 'ch2-story'
      : elapsedSec < 88
      ? 'ch2-challenge'
      : 'ch2-feedback'

  const typedCh1Chars =
    questStep === 'ch1-challenge'
      ? Math.min(DEMO_CH1_ANSWER.length, Math.max(0, Math.floor((elapsedSec - 64) * 7.5)))
      : DEMO_CH1_ANSWER.length
  const typedCh1Text = DEMO_CH1_ANSWER.slice(0, typedCh1Chars)
  const ch2Selected = elapsedSec >= 84.5

  const base = import.meta.env.BASE_URL || '/'

  return (
    <div
      className={`fjd-overlay ${standalone ? 'is-standalone' : ''}`}
      role={standalone ? 'main' : 'dialog'}
      aria-modal={standalone ? undefined : true}
      aria-label={t('Mô phỏng toàn trình Dana Quest: Nhà hát Trưng Vương đến Chùa Linh Ứng', 'Dana Quest Full Journey Demo')}
    >
      <div className="fjd-shell">
        {/* Top HUD */}
        <header className="fjd-header">
          <div className="fjd-brand-row">
            <span className="fjd-live-pill">
              <span className="fjd-live-dot" aria-hidden="true" />
              DEMO TOÀN TRÌNH
            </span>
            <div className="fjd-title-block">
              <h2>Nhà hát Trưng Vương → Xe buýt 05 → Chùa Linh Ứng</h2>
              <small>Mô phỏng thực tế toàn bộ tính năng · Không cần di chuyển ngoài trời</small>
            </div>
          </div>

          <div className="fjd-hud-metrics">
            <span className="fjd-clock-badge" aria-label="Giờ mô phỏng">
              🌅 {getSimMorningClock(elapsedSec)}
            </span>
            <span key={`xp-${earnedXp}`} className={`fjd-stat-badge is-xp ${earnedXp > 0 ? 'is-pop' : ''}`}>
              ⚡ {earnedXp} EXP
            </span>
            <span key={`coin-${earnedCoins}`} className={`fjd-stat-badge is-coins ${earnedCoins > 0 ? 'is-pop' : ''}`}>
              🪙 +{earnedCoins} Xu
            </span>
            <button
              type="button"
              className="fjd-close-btn"
              onClick={handleClose}
              aria-label={t('Đóng demo hành trình', 'Close journey demo')}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Chapter jump pills + Playback controls */}
        <div className="fjd-timeline-bar">
          <div className="fjd-chapters" role="tablist" aria-label={t('Các chặng mô phỏng', 'Demo chapters')}>
            {DEMO_CHAPTERS.map(ch => {
              const isActive = chapterIndex === ch.id
              const isDone = chapterIndex > ch.id
              return (
                <button
                  key={ch.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`fjd-chapter-btn ${isActive ? 'is-active' : isDone ? 'is-done' : ''}`}
                  onClick={() => jumpTo(ch.startSec)}
                >
                  <span aria-hidden="true">{isDone ? '✓' : ch.icon}</span>
                  <span>{ch.shortLabel}</span>
                </button>
              )
            })}
          </div>

          <div className="fjd-controls-row">
            <button
              type="button"
              className="fjd-ctrl-btn is-primary"
              onClick={() => {
                if (elapsedSec >= DEMO_TOTAL_SECONDS) {
                  setElapsedSec(0)
                  setPlaying(true)
                } else {
                  setPlaying(p => !p)
                }
              }}
            >
              {elapsedSec >= DEMO_TOTAL_SECONDS ? '🔄 Phát lại' : playing ? '⏸ Tạm dừng' : '▶ Tiếp tục'}
            </button>

            <div className="fjd-scrub-wrap">
              <input
                type="range"
                className="fjd-scrub-input"
                min={0}
                max={DEMO_TOTAL_SECONDS}
                step={0.5}
                value={elapsedSec}
                aria-label={t('Thanh thời gian demo', 'Demo timeline')}
                onChange={e => setElapsedSec(Number(e.target.value))}
              />
              <span className="fjd-time-label">
                {formatDurationClock(elapsedSec)} / {formatDurationClock(DEMO_TOTAL_SECONDS)}
              </span>
            </div>

            {([1, 1.5, 2] as const).map(s => (
              <button
                key={s}
                type="button"
                className={`fjd-ctrl-btn ${speed === s ? 'is-active-speed' : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}

            <button
              type="button"
              className={`fjd-ctrl-btn ${soundOn ? 'is-active-speed' : ''}`}
              onClick={() => setSoundOn(v => !v)}
              title={t('Bật/tắt chuông báo trạm', 'Toggle arrival chime')}
              aria-label={soundOn ? 'Tắt âm báo trạm' : 'Bật âm báo trạm'}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
          </div>
        </div>

        {/* Interactive Stage Viewport */}
        <div className="fjd-stage-viewport">
          {rewardToast && (
            <div className="fjd-reward-toast" role="status">
              {rewardToast}
            </div>
          )}

          {/* CHAPTER 1: 06:00 Start at Nhà hát Trưng Vương + DanaBus Suggestion */}
          {chapterIndex === 1 && (
            <section className="fjd-map-stage" aria-label="Chặng 1: Xuất phát tại Nhà hát Trưng Vương">
              <div className="fjd-map-banner-top">
                <span>
                  📍 <strong>06:00 sáng</strong> · Xuất phát tại <strong>Nhà hát Trưng Vương</strong> → Mục tiêu: <strong>Chùa Linh Ứng (Sơn Trà)</strong>
                </span>
                <span>Đi bộ tới trạm: ~{Math.max(0, Math.round((1 - walkToBusProgress) * 400))}m</span>
              </div>

              <DemoLeafletMap
                mode="start-to-bus"
                progress={walkToBusProgress}
                busApproachProgress={busApproachProgress}
                avatar={activeAvatar}
              />

              {showBusInvite && (
                <div className="fjd-map-card-overlay is-bus-invite" role="status">
                  <div className="fjd-invite-head">
                    <span className="fjd-invite-icon" aria-hidden="true">🚌</span>
                    <div className="fjd-invite-copy">
                      <h3>2 phút nữa xe buýt điện Tuyến 05 sắp đến trạm dừng này!</h3>
                      <p>
                        Xe <strong>Tuyến 05 ⚡</strong> (chuyến 05:30 từ Hòa Hiệp Nam) đang cách trạm{' '}
                        <strong>Số 9 Lê Duẩn</strong> chỉ ~350m và chạy thẳng qua Cầu Sông Hàn → Công viên Biển Đông (hướng lên Chùa Linh Ứng).{' '}
                        <strong>Bạn có muốn đi chuyến này để nhận thêm xu không?</strong>
                      </p>
                    </div>
                  </div>
                  <div className="fjd-invite-meta">
                    <span className="fjd-chip is-gold">⏱️ Còn 2 phút tới trạm</span>
                    <span className="fjd-chip">🌿 Xe buýt điện DanaBus</span>
                    <span className="fjd-chip is-gold">🪙 Tới +30 Xu (Trạm + Minigame + Giftcode)</span>
                  </div>
                  <button
                    type="button"
                    className={`fjd-action-btn ${busBoardConfirmed ? 'is-green is-tapped' : busBoardFocused ? 'is-focus' : ''}`}
                    onClick={() => jumpTo(15)}
                  >
                    {busBoardConfirmed
                      ? '✓ Đã xác nhận lên xe buýt Tuyến 05 (+5 Xu trạm xanh)!'
                      : '🚌 Xác nhận tham gia chuyến đi này (+5 Xu)'}
                    {busBoardFocused && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* CHAPTER 2: ~32s On-Bus Waiting Screen (Tò te + Minigame + QR/Giftcode + Stop Alert) */}
          {chapterIndex === 2 && (
            <section className="fjd-bus-stage" aria-label="Chặng 2: Trải nghiệm trên xe buýt điện Tuyến 05">
              {busStopAlert && (
                <div className="fjd-bus-alert" role="alert">
                  <strong>🔔 SẮP ĐẾN TRẠM CUỐI CÔNG VIÊN BIỂN ĐÔNG!</strong>
                  <p>
                    Xe buýt Tuyến 05 chỉ còn cách trạm <strong>Bãi tắm số 3 – Công viên Biển Đông</strong> 180m (~1 phút). Chuẩn bị xuống xe để tiếp tục cung đường ven biển lên Chùa Linh Ứng!
                  </p>
                  <button
                    type="button"
                    className={`fjd-action-btn is-green ${elapsedSec >= 43 ? 'is-focus' : ''}`}
                    onClick={() => jumpTo(47)}
                  >
                    🚶 Đã xuống xe · Tiếp tục lên Chùa Linh Ứng →
                    {elapsedSec >= 43 && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                  </button>
                </div>
              )}

              {/* Animated "tò te" bus stage */}
              <div className="fjd-bus-hero-card">
                <div className="fjd-bus-sky-row">
                  <span className="fjd-bus-route-tag">🚌 TUYẾN 05 ⚡ · ĐANG CHẠY QUA CẦU SÔNG HÀN</span>
                  <span className="fjd-bus-notes" aria-hidden="true">♪ ♫ tò te~</span>
                </div>

                <div className="fjd-bus-scenery" aria-hidden="true">
                  <span>🌴</span><span>🌉</span><span>🏢</span><span>⛵</span><span>🌴</span><span>🌊</span>
                </div>

                <div className="fjd-bus-vehicle" aria-hidden="true">
                  <div className="fjd-bus-roof">⚡ DANABUS · 05</div>
                  <div className="fjd-bus-windows">
                    <span /><span /><span /><span />
                  </div>
                  <div className="fjd-bus-stripe" />
                  <div className="fjd-bus-wheels">
                    <b /><b />
                  </div>
                </div>

                <div className="fjd-bus-progress-box">
                  <div className="fjd-bus-progress-top">
                    <span>
                      {busStopAlert
                        ? '🏁 Đang tiến vào trạm cuối Công viên Biển Đông!'
                        : '🚌 Đang qua Cầu Sông Hàn → đường Phạm Văn Đồng'}
                    </span>
                    <span>{busRidePct}%</span>
                  </div>
                  <div className="fjd-bus-track">
                    <div className="fjd-bus-track-fill" style={{ width: `${busRidePct}%` }} />
                  </div>
                  <div className="fjd-bus-stops-line">
                    <span>📍 Số 9 Lê Duẩn</span>
                    <span>🌉 Cầu Sông Hàn</span>
                    <span>🏁 CV Biển Đông</span>
                  </div>
                </div>
              </div>

              {/* Interactive Bus Sub-tabs */}
              <div className="fjd-bus-tabs">
                <button
                  type="button"
                  className={`fjd-bus-tab ${busSubTab === 'wait' ? 'is-active' : ''}`}
                  onClick={() => jumpTo(15.5)}
                >
                  🔔 Màn hình chờ & Báo ngầm
                </button>
                <button
                  type="button"
                  className={`fjd-bus-tab ${busSubTab === 'quiz' ? 'is-active' : ''}`}
                  onClick={() => jumpTo(19.5)}
                >
                  🎮 Minigame (+10 Xu)
                </button>
                <button
                  type="button"
                  className={`fjd-bus-tab ${busSubTab === 'giftcode' ? 'is-active' : ''}`}
                  onClick={() => jumpTo(30.5)}
                >
                  🎁 Quét QR / Giftcode (+15 Xu)
                </button>
              </div>

              {busSubTab === 'wait' && (
                <div className="fjd-bus-subcard">
                  <strong>✨ Xác nhận lên xe thành công — Chế độ chờ thông minh</strong>
                  <p style={{ margin: 0, fontSize: 13.5, color: '#2f5568' }}>
                    Bạn có thể thoát ra lướt Facebook, TikTok hoặc YouTube. Hệ thống vẫn theo dõi lộ trình ngầm và sẽ reo chuông báo ngay khi gần tới trạm xuống!
                  </p>
                  <button
                    type="button"
                    className={`fjd-action-btn ${busNotifOn ? 'is-green' : 'is-focus'}`}
                    onClick={() => jumpTo(19.5)}
                  >
                    {busNotifOn
                      ? '✓ Đang theo dõi ngầm · Sắp tới trạm sẽ reo thông báo!'
                      : '🔔 Bật thông báo reo khi sắp đến trạm'}
                    {!busNotifOn && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                  </button>
                </div>
              )}

              {busSubTab === 'quiz' && (
                <div className="fjd-bus-subcard">
                  {quizPhase === 'q1' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800 }}>
                        <span>🎮 Minigame trên xe · Câu 1/2</span>
                        <span>Thưởng: +10 Xu Dana</span>
                      </div>
                      <strong>{quiz1.question}</strong>
                      <div className="fjd-quiz-opts">
                        {quiz1.options.map((opt, idx) => (
                          <div key={opt} className={`fjd-quiz-opt ${q1Picked && idx === quiz1.correctIndex ? 'is-picked' : ''}`}>
                            {q1Picked && idx === quiz1.correctIndex ? '✅ ' : ''}{opt}
                          </div>
                        ))}
                      </div>
                      {q1Picked && <div className="fjd-ok-banner">✅ Chính xác! {quiz1.fact}</div>}
                    </>
                  )}

                  {quizPhase === 'q2' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800 }}>
                        <span>🎮 Minigame trên xe · Câu 2/2</span>
                        <span>Đúng: 1/2</span>
                      </div>
                      <strong>{quiz2.question}</strong>
                      <div className="fjd-quiz-opts">
                        {quiz2.options.map((opt, idx) => (
                          <div key={opt} className={`fjd-quiz-opt ${q2Picked && idx === quiz2.correctIndex ? 'is-picked' : ''}`}>
                            {q2Picked && idx === quiz2.correctIndex ? '✅ ' : ''}{opt}
                          </div>
                        ))}
                      </div>
                      {q2Picked && <div className="fjd-ok-banner">✅ Chính xác! {quiz2.fact}</div>}
                    </>
                  )}

                  {quizPhase === 'done' && (
                    <>
                      <strong>🎉 Xuất sắc! Bạn trả lời đúng 100% câu đố trên xe Tuyến 05!</strong>
                      <button
                        type="button"
                        className={`fjd-action-btn ${quizClaimed ? 'is-green' : 'is-focus'}`}
                        onClick={() => jumpTo(30.5)}
                      >
                        {quizClaimed ? '✓ Đã cộng +10 Xu Dana vào ví!' : '🪙 Nhận +10 Xu Dana thưởng Minigame'}
                        {!quizClaimed && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                      </button>
                    </>
                  )}
                </div>
              )}

              {busSubTab === 'giftcode' && (
                <div className="fjd-bus-subcard">
                  <div className="fjd-qr-grid">
                    <div className="fjd-qr-scanner" aria-label="Mô phỏng camera quét mã QR trên xe buýt">
                      <div className="fjd-qr-box" aria-hidden="true">
                        {QR_PATTERN.map((cell, i) => (
                          <i key={i} className={cell ? '' : 'is-blank'} />
                        ))}
                      </div>
                      {!qrScanned && <div className="fjd-qr-laser" aria-hidden="true" />}
                      <small style={{ fontSize: 11, fontWeight: 800 }}>
                        {qrScanned ? '✅ Đã quét QR DanaBus!' : '📷 Đang quét QR dán trên xe…'}
                      </small>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>🎁 Quét mã QR hoặc nhập Giftcode dán trên xe</strong>
                      <small style={{ color: '#396174', fontSize: 12 }}>
                        Mỗi tuyến có 6 mã (VD: DANABUS05, DANABUS05A… DANABUS05E) · Mỗi tài khoản dùng mỗi mã 1 lần.
                      </small>
                      <div className="fjd-gift-input-row">
                        <input
                          type="text"
                          readOnly
                          className="fjd-gift-input"
                          value={typedGiftcode}
                          placeholder="Đang quét mã QR…"
                          aria-label="Mã giftcode mô phỏng"
                        />
                        <button
                          type="button"
                          className={`fjd-action-btn ${giftcodeClaimed ? 'is-green' : qrScanned ? 'is-focus' : ''}`}
                          style={{ width: 'auto', minWidth: 112 }}
                          onClick={() => jumpTo(40.2)}
                        >
                          {giftcodeClaimed ? '✓ +15 Xu' : 'Nhận xu'}
                          {qrScanned && !giftcodeClaimed && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                        </button>
                      </div>
                      {giftcodeClaimed && (
                        <div className="fjd-ok-banner">
                          🎉 Nhập mã {DEMO_GIFTCODE} thành công (+15 Xu Dana vào ví tài khoản)!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* CHAPTER 3: Coastal Road up Son Tra Peninsula -> Chùa Linh Ứng */}
          {chapterIndex === 3 && (
            <section className="fjd-map-stage" aria-label="Chặng 3: Di chuyển dọc biển Hoàng Sa lên Chùa Linh Ứng">
              <div className="fjd-map-banner-top">
                <span>
                  ⛰️ <strong>Công viên Biển Đông</strong> → Đường ven biển <strong>Hoàng Sa</strong> → <strong>Chùa Linh Ứng – Bãi Bụt</strong>
                </span>
                <span>{arrivedAtPagoda ? 'Đã tới điểm hẹn!' : `Còn ~${Math.max(0.1, +((1 - sonTraProgress) * 5.2).toFixed(1))} km`}</span>
              </div>

              <DemoLeafletMap
                mode="bus-to-pagoda"
                progress={sonTraProgress}
                busApproachProgress={1}
                avatar={activeAvatar}
              />

              {arrivedAtPagoda && (
                <div className="fjd-map-card-overlay" role="status">
                  <div className="fjd-invite-head">
                    <span className="fjd-invite-icon" aria-hidden="true">🛕</span>
                    <div className="fjd-invite-copy">
                      <h3>Bạn đã đến Chùa Linh Ứng – Bãi Bụt, Sơn Trà!</h3>
                      <p>
                        Hệ thống GPS xác nhận vị trí trong bán kính điểm hẹn. Mở Quest <strong>“{quest?.title || 'Dấu lặng trên Sơn Trà'}”</strong> ngay để bắt đầu giải mật thư!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="fjd-action-btn is-green is-focus"
                    onClick={() => jumpTo(57)}
                  >
                    ✦ Xác nhận đã đến · Bắt đầu Quest ngay →
                    <span className="fjd-tap-hand" aria-hidden="true">👆</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* CHAPTER 4: Authentic Quest Play ("Dấu lặng trên Sơn Trà") */}
          {chapterIndex === 4 && quest && ch1 && ch2 && (
            <section className="fjd-quest-stage" aria-label="Chặng 4: Chơi Quest Dấu lặng trên Sơn Trà">
              <div className="fjd-quest-hud">
                <span>⌖ {questStep.startsWith('ch1') ? '1/2' : '2/2'} · {quest.title}</span>
                <span>Tự do · Không đếm giờ</span>
                <span style={{ color: '#b45309' }}>ϟ {earnedXp} XP</span>
              </div>

              <div className="fjd-quest-card">
                {questStep === 'ch1-story' && (
                  <>
                    <span className="fjd-quest-phase-pill">Câu chuyện 1</span>
                    <h3>{ch1.title}</h3>
                    <img
                      className="fjd-quest-photo"
                      src={`${base}photos/chua-linh-ung-bai-but.jpg`}
                      alt="Chùa Linh Ứng – Bãi Bụt, Sơn Trà"
                    />
                    <p className="fjd-quest-story">{ch1.story}</p>
                    <button
                      type="button"
                      className={`fjd-action-btn is-green ${elapsedSec >= 60.5 ? 'is-focus' : ''}`}
                      onClick={() => jumpTo(63.2)}
                    >
                      Tiếp tục đến thử thách
                      {elapsedSec >= 60.5 && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                    </button>
                  </>
                )}

                {questStep === 'ch1-challenge' && (
                  <>
                    <span className="fjd-quest-phase-pill">Thử thách 1 (Nhập đáp án)</span>
                    <h3>{ch1.title}</h3>
                    <p className="fjd-quest-story" style={{ fontWeight: 800 }}>
                      {ch1.challenge.prompt}
                    </p>
                    <input
                      type="text"
                      readOnly
                      className="fjd-quest-input"
                      value={typedCh1Text}
                      placeholder={ch1.challenge.type === 'text' ? ch1.challenge.placeholder : ''}
                      aria-label="Đáp án thử thách 1"
                    />
                    <button
                      type="button"
                      className={`fjd-action-btn is-green ${typedCh1Chars >= DEMO_CH1_ANSWER.length ? 'is-focus' : ''}`}
                      onClick={() => jumpTo(72.2)}
                    >
                      Kiểm tra đáp án
                      {typedCh1Chars >= DEMO_CH1_ANSWER.length && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                    </button>
                  </>
                )}

                {questStep === 'ch1-feedback' && (
                  <div className="fjd-quest-feedback">
                    <div className="fjd-check-seal" aria-hidden="true">✓</div>
                    <h3>Bạn đã giải đúng!</h3>
                    <div className="fjd-ok-banner">Đã ghi nhận +{ch1.reward.xp} XP và +{ch1.reward.coins} xu.</div>
                    <p className="fjd-quest-story">{ch1.feedback}</p>
                    <button
                      type="button"
                      className={`fjd-action-btn is-green ${elapsedSec >= 75 ? 'is-focus' : ''}`}
                      onClick={() => jumpTo(77.2)}
                    >
                      Tiếp tục câu chuyện
                      {elapsedSec >= 75 && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                    </button>
                  </div>
                )}

                {questStep === 'ch2-story' && (
                  <>
                    <span className="fjd-quest-phase-pill">Câu chuyện 2</span>
                    <h3>{ch2.title}</h3>
                    <p className="fjd-quest-story">{ch2.story}</p>
                    <button
                      type="button"
                      className={`fjd-action-btn is-green ${elapsedSec >= 80 ? 'is-focus' : ''}`}
                      onClick={() => jumpTo(82.2)}
                    >
                      Tiếp tục đến thử thách
                      {elapsedSec >= 80 && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                    </button>
                  </>
                )}

                {questStep === 'ch2-challenge' && ch2.challenge.type === 'single-choice' && (() => {
                  const singleChoice = ch2.challenge
                  return (
                    <>
                      <span className="fjd-quest-phase-pill">Thử thách 2 (Chọn một đáp án)</span>
                      <h3>{ch2.title}</h3>
                      <p className="fjd-quest-story" style={{ fontWeight: 800 }}>
                        {singleChoice.prompt}
                      </p>
                      <div className="fjd-quest-choices">
                        {singleChoice.options.map(opt => {
                          const isCorrect = opt.id === singleChoice.correctOptionId
                          const isPicked = ch2Selected && isCorrect
                          return (
                            <div key={opt.id} className={`fjd-quest-choice ${isPicked ? 'is-selected' : ''}`}>
                              <span aria-hidden="true">{isPicked ? '🟢' : '⚪'}</span>
                              <span>{opt.label}</span>
                            </div>
                          )
                        })}
                      </div>
                      <button
                        type="button"
                        className={`fjd-action-btn is-green ${ch2Selected ? 'is-focus' : ''}`}
                        onClick={() => jumpTo(88.2)}
                      >
                        Kiểm tra đáp án
                        {ch2Selected && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                      </button>
                    </>
                  )
                })()}

                {questStep === 'ch2-feedback' && (
                  <div className="fjd-quest-feedback">
                    <div className="fjd-check-seal" aria-hidden="true">✓</div>
                    <h3>Bạn đã giải đúng!</h3>
                    <div className="fjd-ok-banner">Đã ghi nhận +{ch2.reward.xp} XP và +{ch2.reward.coins} xu.</div>
                    <p className="fjd-quest-story">{ch2.feedback}</p>
                    <button
                      type="button"
                      className="fjd-action-btn is-focus"
                      onClick={() => jumpTo(92.2)}
                    >
                      🏆 Xem tổng kết & Nhận Thẻ Thông Hành
                      <span className="fjd-tap-hand" aria-hidden="true">👆</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* CHAPTER 5: Celebration + Total Coins/EXP + Explorer Pass / Journey Card */}
          {chapterIndex === 5 && quest && (
            <section className="fjd-summary-stage" aria-label="Chặng 5: Tổng kết Xu, EXP và Thẻ Thông Hành">
              <div className="fjd-summary-hero">
                <div>
                  <h3>🎉 Hành trình đã hoàn thành — {quest.title}!</h3>
                  <p>
                    06:00 Nhà hát Trưng Vương → 🚌 Xe buýt điện Tuyến 05 → 🛕 Chùa Linh Ứng – Bãi Bụt, Sơn Trà
                  </p>
                </div>
                <div className="fjd-summary-totals">
                  <div className="fjd-total-pill">
                    <strong>+120 EXP</strong>
                    <small>Điểm kinh nghiệm</small>
                  </div>
                  <div className="fjd-total-pill">
                    <strong>+50 Xu</strong>
                    <small>Xu Dana tích lũy</small>
                  </div>
                </div>
              </div>

              <div className="fjd-receipt-grid">
                <div className="fjd-receipt-item">
                  <strong>+5 Xu</strong>
                  <span>🚌 Lên trạm xanh Tuyến 05</span>
                </div>
                <div className="fjd-receipt-item">
                  <strong>+10 Xu</strong>
                  <span>🎮 Minigame trên xe buýt</span>
                </div>
                <div className="fjd-receipt-item">
                  <strong>+15 Xu</strong>
                  <span>🎁 Giftcode {DEMO_GIFTCODE}</span>
                </div>
                <div className="fjd-receipt-item">
                  <strong>+120 EXP · +20 Xu</strong>
                  <span>📖 2/2 Thử thách Quest</span>
                </div>
              </div>

              <div className="fjd-pass-card">
                <div className="fjd-pass-header">
                  <span className="fjd-pass-badge">✦ THẺ THÔNG HÀNH · THẺ HÀNH TRÌNH ĐÀ NẴNG</span>
                  <span className="fjd-chip">🌿 Huy hiệu Du khách Xanh Sơn Trà</span>
                </div>

                {cardPreviewUrl ? (
                  <img
                    className="fjd-pass-png"
                    src={cardPreviewUrl}
                    alt="Thẻ hành trình cá nhân Dấu lặng trên Sơn Trà"
                  />
                ) : (
                  <div className="fjd-pass-fallback">
                    <img src={`${base}photos/chua-linh-ung-bai-but.jpg`} alt="Chùa Linh Ứng" />
                    <div>
                      <strong style={{ display: 'block', fontSize: 16 }}>{quest.title}</strong>
                      <small style={{ display: 'block', color: '#2b5568', margin: '3px 0 6px' }}>
                        {quest.area} · 2/2 thử thách đã chinh phục · 06:00–06:42
                      </small>
                      <span className="fjd-chip is-gold">⚡ 120 EXP · 🪙 50 Xu Dana · ✓ ĐÃ ĐÓNG DẤU</span>
                    </div>
                  </div>
                )}

                {cardNotice && <div className="fjd-ok-banner">{cardNotice}</div>}

                <div className="fjd-pass-actions">
                  <button
                    type="button"
                    className="fjd-action-btn"
                    style={{ fontSize: 13, padding: '10px 12px' }}
                    disabled={cardSaving}
                    onClick={() => void handleDownloadPass()}
                  >
                    {cardSaving ? 'Đang tạo PNG…' : '📥 Tải Thẻ Thông Hành (.PNG)'}
                  </button>
                  <button
                    type="button"
                    className="fjd-secondary-link"
                    onClick={() => {
                      setElapsedSec(0)
                      setPlaying(true)
                    }}
                  >
                    🔄 Xem lại Demo từ đầu
                  </button>
                  <a
                    className="fjd-secondary-link"
                    href="#/map"
                    onClick={() => {
                      if (onClose) onClose()
                    }}
                  >
                    🗺️ Mở bản đồ chơi thật →
                  </a>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
