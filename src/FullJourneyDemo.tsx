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

function getSimMorningClock(elapsedSec: number): string {
  // Bắt đầu đúng 06:00 sáng và tự tăng nhẹ theo mạch hành trình thực tế
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
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

interface DemoMapProps {
  mode: 'start-to-bus' | 'bus-to-pagoda'
  progress: number
  busApproachProgress: number
  avatar: Avatar
}

function DemoLeafletMap({ mode, progress, busApproachProgress, avatar }: DemoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
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
    createBaseTileLayer().addTo(map)

    if (mode === 'start-to-bus') {
      L.polyline(DEMO_WALK_TO_BUS, { color: '#2563eb', weight: 5, dashArray: '7 7', opacity: 0.9 }).addTo(map)
      L.polyline(route05ApproachSegment, { color: '#eab308', weight: 5, opacity: 0.9 }).addTo(map)
      L.polyline(route05RideSegment, { color: '#16a34a', weight: 4, opacity: 0.65, dashArray: '6 6' }).addTo(map)

      L.marker(START_POINT, {
        icon: L.divIcon({
          className: 'fjd-map-pin-wrap',
          html: '<span class="fjd-map-pin-label">🎭 Nhà hát Trưng Vương</span>',
          iconSize: [154, 24],
          iconAnchor: [77, 30],
        }),
      }).addTo(map)

      L.marker(BUS_BOARD_STOP, {
        icon: L.divIcon({
          className: 'fjd-map-pin-wrap',
          html: '<span class="fjd-map-pin-label">🚏 Trạm Số 9 Lê Duẩn</span>',
          iconSize: [144, 24],
          iconAnchor: [72, 28],
        }),
      }).addTo(map)

      const busInit = interpolatePolylineAtProgress(route05ApproachSegment, 0).position
      busMarkerRef.current = L.marker(busInit, {
        zIndexOffset: 1500,
        icon: L.divIcon({
          className: 'fjd-bus-icon-wrap',
          html: '<div class="fjd-map-bus-marker">🚌 05⚡</div>',
          iconSize: [46, 26],
          iconAnchor: [23, 13],
        }),
      }).addTo(map)
    } else {
      L.polyline(route05RideSegment, { color: '#94a3b8', weight: 4, opacity: 0.55, dashArray: '5 6' }).addTo(map)
      L.polyline(DEMO_SON_TRA_PATH, { color: '#0d9488', weight: 5, opacity: 0.95 }).addTo(map)

      L.marker(BUS_ALIGHT_STOP, {
        icon: L.divIcon({
          className: 'fjd-map-pin-wrap',
          html: '<span class="fjd-map-pin-label">🚏 CV Biển Đông</span>',
          iconSize: [116, 24],
          iconAnchor: [58, 26],
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
          iconSize: [168, 24],
          iconAnchor: [84, 26],
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

  return <div ref={containerRef} className="fjd-map-canvas" aria-label={t('Bản đồ hành trình Đà Nẵng', 'Da Nang journey map')} />
}

export default function FullJourneyDemo({ onClose, standalone = false }: { onClose?: () => void; standalone?: boolean }) {
  const auth = useOptionalAuth()
  const user = auth?.user ?? null
  const activeAvatar = useMemo(() => resolveAvatar(user?.avatarId) ?? readAvatar() ?? avatars[0], [user?.avatarId])
  const quest = useMemo(() => getQuest(DEMO_QUEST_ID), [])

  const [elapsedSec, setElapsedSec] = useState(0)
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

  useEffect(() => {
    if (standalone) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Pure natural gameplay simulation ticker (no demo speed bar)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSec(prev => (prev >= DEMO_TOTAL_SECONDS ? DEMO_TOTAL_SECONDS : +(prev + 0.1).toFixed(2)))
    }, 100)
    return () => window.clearInterval(timer)
  }, [])

  const stage = useMemo(() => {
    if (elapsedSec < 15) return 1
    if (elapsedSec < 47) return 2
    if (elapsedSec < 57) return 3
    if (elapsedSec < 92) return 4
    return 5
  }, [elapsedSec])

  const earnedCoins =
    (elapsedSec >= 13.5 ? 5 : 0) +
    (elapsedSec >= 28.5 ? 10 : 0) +
    (elapsedSec >= 37.5 ? 15 : 0) +
    (elapsedSec >= 72 ? 10 : 0) +
    (elapsedSec >= 88 ? 10 : 0)

  const earnedXp = (elapsedSec >= 72 ? 50 : 0) + (elapsedSec >= 88 ? 70 : 0)

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
        1: '🚌 +5 Xu · Lên Tuyến 05!',
        2: '🎮 +10 Xu · Minigame trên xe!',
        3: `🎁 +15 Xu · Mã ${DEMO_GIFTCODE}!`,
        4: '📖 +50 EXP · +10 Xu!',
        5: '🌟 +70 EXP · +10 Xu!',
      }
      setRewardToast(messages[milestone])
      const hideTimer = window.setTimeout(() => setRewardToast(''), 2200)
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
      try {
        playBusArrivalChime(true)
      } catch {}
    } else if (elapsedSec < 39) {
      chimedStopRef.current = false
    }
  }, [elapsedSec])

  // Render authentic PNG Journey Card when completing the quest
  useEffect(() => {
    if (stage !== 5 || !quest) return
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
  }, [stage, quest, user?.name])

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

  function advanceTo(sec: number) {
    setElapsedSec(sec)
  }

  // Stage 1: 06:00 Nhà hát Trưng Vương -> Trạm Số 9 Lê Duẩn
  const walkToBusProgress = Math.max(0, Math.min(1, elapsedSec / 11))
  const busApproachProgress = Math.max(0, Math.min(1, elapsedSec / 13.5))
  const showBusInvite = elapsedSec >= 3.2
  const busBoardFocused = elapsedSec >= 9.5 && elapsedSec < 13.5
  const busBoardConfirmed = elapsedSec >= 13.5

  // Stage 2: On-bus Tuyến 05 (~32s)
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

  // Stage 3: Công viên Biển Đông -> Chùa Linh Ứng
  const sonTraProgress = Math.max(0, Math.min(1, (elapsedSec - 47) / 6.5))
  const arrivedAtPagoda = elapsedSec >= 52.5

  // Stage 4: Authentic Quest Play ("Dấu lặng trên Sơn Trà")
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
      aria-label={t('Hành trình Dana Quest: Nhà hát Trưng Vương đến Chùa Linh Ứng', 'Dana Quest Journey')}
    >
      <div className="fjd-shell">
        {/* Ultra-slim single-row status bar: only morning clock starting at 06:00 + EXP/Xu + Close */}
        <header className="fjd-topbar">
          <span className="fjd-clock-badge" aria-label="Thời gian hành trình">
            🌅 {getSimMorningClock(elapsedSec)}
          </span>
          <div className="fjd-hud-metrics">
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
              aria-label={t('Đóng mô phỏng', 'Close simulation')}
            >
              ✕
            </button>
          </div>
        </header>

        {rewardToast && (
          <div className="fjd-reward-toast" role="status">
            {rewardToast}
          </div>
        )}

        {/* Full-screen pure gameplay viewport */}
        <div className="fjd-stage-viewport">
          {/* STAGE 1: 06:00 Start at Nhà hát Trưng Vương + DanaBus Suggestion */}
          {stage === 1 && (
            <section className="fjd-map-stage" aria-label="Bản đồ xuất phát từ Nhà hát Trưng Vương">
              <div className="fjd-map-banner-top">
                <span className="fjd-ellipsis">
                  📍 <strong>Nhà hát Trưng Vương</strong> → <strong>Chùa Linh Ứng</strong>
                </span>
                <span className="fjd-map-dist-pill">
                  ~{Math.max(0, Math.round((1 - walkToBusProgress) * 400))}m
                </span>
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
                        Xe <strong>Tuyến 05 ⚡</strong> sắp tới trạm <strong>Số 9 Lê Duẩn</strong>, chạy thẳng qua Cầu Sông Hàn → Công viên Biển Đông (hướng lên Chùa Linh Ứng).{' '}
                        <strong>Bạn có muốn đi chuyến này để nhận thêm xu không?</strong>
                      </p>
                    </div>
                  </div>
                  <div className="fjd-invite-meta">
                    <span className="fjd-chip is-gold">⏱️ 2 phút nữa tới trạm</span>
                    <span className="fjd-chip">🌿 Xe buýt điện</span>
                    <span className="fjd-chip is-gold">🪙 Tới +30 Xu</span>
                  </div>
                  <button
                    type="button"
                    className={`fjd-action-btn ${busBoardConfirmed ? 'is-green is-tapped' : busBoardFocused ? 'is-focus' : ''}`}
                    onClick={() => advanceTo(15)}
                  >
                    {busBoardConfirmed
                      ? '✓ Đã lên Tuyến 05 (+5 Xu trạm xanh)!'
                      : '🚌 Xác nhận tham gia chuyến đi này (+5 Xu)'}
                    {busBoardFocused && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* STAGE 2: On-Bus Waiting Screen (Tò te + Minigame + QR/Giftcode + Stop Alert) */}
          {stage === 2 && (
            <section className="fjd-bus-stage" aria-label="Màn hình trên xe buýt điện Tuyến 05">
              {/* Compact animated "tò te" bus */}
              <div className="fjd-bus-hero-card">
                <div className="fjd-bus-sky-row">
                  <span className="fjd-bus-route-tag">🚌 Tuyến 05 ⚡</span>
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
                    <span className="fjd-ellipsis">
                      {busStopAlert
                        ? '🏁 Sắp tới trạm cuối CV Biển Đông!'
                        : '🚌 Cầu Sông Hàn → Phạm Văn Đồng'}
                    </span>
                    <strong>{busRidePct}%</strong>
                  </div>
                  <div className="fjd-bus-track">
                    <div className="fjd-bus-track-fill" style={{ width: `${busRidePct}%` }} />
                  </div>
                  <div className="fjd-bus-stops-line">
                    <span>📍 Lê Duẩn</span>
                    <span>🌉 Sông Hàn</span>
                    <span>🏁 Biển Đông</span>
                  </div>
                </div>
              </div>

              {busStopAlert ? (
                <div className="fjd-bus-subcard is-alert-card" role="alert">
                  <strong style={{ fontSize: 'clamp(14.5px, 4vw, 16px)' }}>
                    🔔 SẮP ĐẾN TRẠM CUỐI CÔNG VIÊN BIỂN ĐÔNG!
                  </strong>
                  <p style={{ margin: 0, fontSize: 'clamp(13px, 3.5vw, 14px)', lineHeight: 1.45 }}>
                    Xe buýt Tuyến 05 chỉ còn cách trạm <strong>Bãi tắm số 3 – Công viên Biển Đông</strong> 180m (~1 phút). Chuẩn bị xuống xe để tiếp tục lên Bán đảo Sơn Trà → Chùa Linh Ứng!
                  </p>
                  <div className="fjd-quest-footer-cta">
                    <button
                      type="button"
                      className={`fjd-action-btn is-green ${elapsedSec >= 42.5 ? 'is-focus' : ''}`}
                      onClick={() => advanceTo(47)}
                    >
                      🚶 Đã xuống xe · Lên Chùa Linh Ứng →
                      {elapsedSec >= 42.5 && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="fjd-bus-tabs">
                    <button
                      type="button"
                      className={`fjd-bus-tab ${busSubTab === 'wait' ? 'is-active' : ''}`}
                      onClick={() => advanceTo(15.5)}
                    >
                      🔔 Chờ xe
                    </button>
                    <button
                      type="button"
                      className={`fjd-bus-tab ${busSubTab === 'quiz' ? 'is-active' : ''}`}
                      onClick={() => advanceTo(19.5)}
                    >
                      🎮 Minigame
                    </button>
                    <button
                      type="button"
                      className={`fjd-bus-tab ${busSubTab === 'giftcode' ? 'is-active' : ''}`}
                      onClick={() => advanceTo(30.5)}
                    >
                      🎁 QR / Code
                    </button>
                  </div>

                  {busSubTab === 'wait' && (
                    <div className="fjd-bus-subcard">
                      <strong style={{ fontSize: 'clamp(14px, 3.8vw, 15.5px)' }}>
                        ✨ Đã lên xe Tuyến 05 — Bật báo trạm ngầm
                      </strong>
                      <p style={{ margin: 0, fontSize: 'clamp(12.5px, 3.4vw, 14px)', lineHeight: 1.5, color: '#2f5568' }}>
                        Bạn có thể thoát app xem Facebook, TikTok hay YouTube. Hệ thống vẫn theo dõi lộ trình ngầm và sẽ reo chuông báo khi sắp tới trạm xuống!
                      </p>
                      <div className="fjd-quest-footer-cta">
                        <button
                          type="button"
                          className={`fjd-action-btn ${busNotifOn ? 'is-green' : 'is-focus'}`}
                          onClick={() => advanceTo(19.5)}
                        >
                          {busNotifOn
                            ? '✓ Đang theo dõi ngầm · Sắp tới trạm sẽ reo!'
                            : '🔔 Bật thông báo reo khi sắp đến trạm'}
                          {!busNotifOn && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                        </button>
                      </div>
                    </div>
                  )}

                  {busSubTab === 'quiz' && (
                    <div className="fjd-bus-subcard">
                      {quizPhase === 'q1' && (
                        <>
                          <div className="fjd-bus-subcard-head">
                            <span>🎮 Minigame · Câu 1/2</span>
                            <span>+10 Xu Dana</span>
                          </div>
                          <p className="fjd-quiz-question">{quiz1.question}</p>
                          <div className="fjd-quiz-opts">
                            {quiz1.options.map((opt, idx) => (
                              <button
                                key={opt}
                                type="button"
                                className={`fjd-quiz-opt ${q1Picked && idx === quiz1.correctIndex ? 'is-picked' : ''}`}
                                onClick={() => advanceTo(21.5)}
                              >
                                {q1Picked && idx === quiz1.correctIndex ? '✅ ' : ''}{opt}
                              </button>
                            ))}
                          </div>
                          {q1Picked && <div className="fjd-ok-banner">✅ Chính xác! {quiz1.fact}</div>}
                        </>
                      )}

                      {quizPhase === 'q2' && (
                        <>
                          <div className="fjd-bus-subcard-head">
                            <span>🎮 Minigame · Câu 2/2</span>
                            <span>Đúng: 1/2</span>
                          </div>
                          <p className="fjd-quiz-question">{quiz2.question}</p>
                          <div className="fjd-quiz-opts">
                            {quiz2.options.map((opt, idx) => (
                              <button
                                key={opt}
                                type="button"
                                className={`fjd-quiz-opt ${q2Picked && idx === quiz2.correctIndex ? 'is-picked' : ''}`}
                                onClick={() => advanceTo(25.5)}
                              >
                                {q2Picked && idx === quiz2.correctIndex ? '✅ ' : ''}{opt}
                              </button>
                            ))}
                          </div>
                          {q2Picked && <div className="fjd-ok-banner">✅ Chính xác! {quiz2.fact}</div>}
                        </>
                      )}

                      {quizPhase === 'done' && (
                        <>
                          <strong style={{ fontSize: 'clamp(14.5px, 3.8vw, 16px)' }}>
                            🎉 Tuyệt vời! Trả lời đúng 2/2 câu đố trên xe!
                          </strong>
                          <div className="fjd-quest-footer-cta">
                            <button
                              type="button"
                              className={`fjd-action-btn ${quizClaimed ? 'is-green' : 'is-focus'}`}
                              onClick={() => advanceTo(30.5)}
                            >
                              {quizClaimed ? '✓ Đã cộng +10 Xu Dana vào ví!' : '🪙 Nhận +10 Xu Dana'}
                              {!quizClaimed && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {busSubTab === 'giftcode' && (
                    <div className="fjd-bus-subcard">
                      <div className="fjd-qr-layout">
                        <div className="fjd-qr-scanner" aria-label="Quét mã QR trên xe buýt">
                          <div className="fjd-qr-box" aria-hidden="true">
                            {QR_PATTERN.map((cell, i) => (
                              <i key={i} className={cell ? '' : 'is-blank'} />
                            ))}
                          </div>
                          {!qrScanned && <div className="fjd-qr-laser" aria-hidden="true" />}
                          <span className="fjd-qr-caption">
                            {qrScanned ? '✅ Đã quét QR!' : '📷 Quét QR…'}
                          </span>
                        </div>

                        <div className="fjd-qr-right">
                          <strong>🎁 Quét QR / Nhập Giftcode</strong>
                          <small>Mã dán trên xe buýt DanaBus · Mỗi tài khoản dùng 1 lần/mã.</small>
                          <div className="fjd-gift-input-row">
                            <input
                              type="text"
                              readOnly
                              className="fjd-gift-input"
                              value={typedGiftcode}
                              placeholder="Đang quét…"
                              aria-label="Mã giftcode xe buýt"
                            />
                            <button
                              type="button"
                              className={`fjd-action-btn fjd-gift-submit ${giftcodeClaimed ? 'is-green' : qrScanned ? 'is-focus' : ''}`}
                              onClick={() => advanceTo(40.2)}
                            >
                              {giftcodeClaimed ? '✓ +15 Xu' : 'Nhận xu'}
                              {qrScanned && !giftcodeClaimed && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                            </button>
                          </div>
                        </div>
                      </div>
                      {giftcodeClaimed && (
                        <div className="fjd-ok-banner">
                          🎉 Nhập mã {DEMO_GIFTCODE} thành công (+15 Xu Dana)!
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* STAGE 3: Coastal Road up Son Tra -> Chùa Linh Ứng */}
          {stage === 3 && (
            <section className="fjd-map-stage" aria-label="Di chuyển dọc biển Hoàng Sa lên Chùa Linh Ứng">
              <div className="fjd-map-banner-top">
                <span className="fjd-ellipsis">
                  ⛰️ <strong>Hoàng Sa</strong> → <strong>Chùa Linh Ứng – Bãi Bụt</strong>
                </span>
                <span className="fjd-map-dist-pill">
                  {arrivedAtPagoda ? 'Đã tới!' : `~${Math.max(0.1, +((1 - sonTraProgress) * 5.2).toFixed(1))} km`}
                </span>
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
                        GPS đã xác nhận điểm hẹn. Bắt đầu mở Quest <strong>“{quest?.title || 'Dấu lặng trên Sơn Trà'}”</strong> ngay!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="fjd-action-btn is-green is-focus"
                    onClick={() => advanceTo(57)}
                  >
                    ✦ Xác nhận đã đến · Bắt đầu Quest →
                    <span className="fjd-tap-hand" aria-hidden="true">👆</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* STAGE 4: Authentic Quest Play ("Dấu lặng trên Sơn Trà") */}
          {stage === 4 && quest && ch1 && ch2 && (
            <section className="fjd-quest-stage" aria-label="Chơi Quest Dấu lặng trên Sơn Trà">
              <div className="fjd-quest-hud">
                <span className="fjd-ellipsis">⌖ {questStep.startsWith('ch1') ? '1/2' : '2/2'} · {quest.title}</span>
                <span style={{ color: '#b45309', flexShrink: 0 }}>ϟ {earnedXp} XP</span>
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
                    <div className="fjd-quest-footer-cta">
                      <button
                        type="button"
                        className={`fjd-action-btn is-green ${elapsedSec >= 60.5 ? 'is-focus' : ''}`}
                        onClick={() => advanceTo(63.2)}
                      >
                        Tiếp tục đến thử thách
                        {elapsedSec >= 60.5 && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                      </button>
                    </div>
                  </>
                )}

                {questStep === 'ch1-challenge' && (
                  <>
                    <span className="fjd-quest-phase-pill">Thử thách 1 · Nhập đáp án</span>
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
                    <div className="fjd-quest-footer-cta">
                      <button
                        type="button"
                        className={`fjd-action-btn is-green ${typedCh1Chars >= DEMO_CH1_ANSWER.length ? 'is-focus' : ''}`}
                        onClick={() => advanceTo(72.2)}
                      >
                        Kiểm tra đáp án
                        {typedCh1Chars >= DEMO_CH1_ANSWER.length && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                      </button>
                    </div>
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
                      onClick={() => advanceTo(77.2)}
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
                    <div className="fjd-quest-footer-cta">
                      <button
                        type="button"
                        className={`fjd-action-btn is-green ${elapsedSec >= 80 ? 'is-focus' : ''}`}
                        onClick={() => advanceTo(82.2)}
                      >
                        Tiếp tục đến thử thách
                        {elapsedSec >= 80 && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                      </button>
                    </div>
                  </>
                )}

                {questStep === 'ch2-challenge' && ch2.challenge.type === 'single-choice' && (() => {
                  const singleChoice = ch2.challenge
                  return (
                    <>
                      <span className="fjd-quest-phase-pill">Thử thách 2 · Chọn đáp án</span>
                      <h3>{ch2.title}</h3>
                      <p className="fjd-quest-story" style={{ fontWeight: 800 }}>
                        {singleChoice.prompt}
                      </p>
                      <div className="fjd-quest-choices">
                        {singleChoice.options.map(opt => {
                          const isCorrect = opt.id === singleChoice.correctOptionId
                          const isPicked = ch2Selected && isCorrect
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              className={`fjd-quest-choice ${isPicked ? 'is-selected' : ''}`}
                              onClick={() => advanceTo(85)}
                            >
                              <span aria-hidden="true">{isPicked ? '🟢' : '⚪'}</span>
                              <span>{opt.label}</span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="fjd-quest-footer-cta">
                        <button
                          type="button"
                          className={`fjd-action-btn is-green ${ch2Selected ? 'is-focus' : ''}`}
                          onClick={() => advanceTo(88.2)}
                        >
                          Kiểm tra đáp án
                          {ch2Selected && <span className="fjd-tap-hand" aria-hidden="true">👆</span>}
                        </button>
                      </div>
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
                      onClick={() => advanceTo(92.2)}
                    >
                      🏆 Xem tổng kết & Thẻ Thông Hành
                      <span className="fjd-tap-hand" aria-hidden="true">👆</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* STAGE 5: Celebration + Coins/EXP + Explorer Pass */}
          {stage === 5 && quest && (
            <section className="fjd-summary-stage" aria-label="Tổng kết hành trình và Thẻ Thông Hành">
              <div className="fjd-summary-hero">
                <div>
                  <h3>🎉 Hoàn thành — {quest.title}!</h3>
                  <p>Nhà hát Trưng Vương → Tuyến 05 ⚡ → Chùa Linh Ứng, Sơn Trà</p>
                </div>
                <div className="fjd-summary-totals">
                  <div className="fjd-total-pill">
                    <strong>+120 EXP</strong>
                    <small>Kinh nghiệm</small>
                  </div>
                  <div className="fjd-total-pill">
                    <strong>+50 Xu</strong>
                    <small>Xu Dana</small>
                  </div>
                </div>
              </div>

              <div className="fjd-receipt-grid">
                <div className="fjd-receipt-item">
                  <strong>+5 Xu</strong>
                  <span>🚌 Lên Tuyến 05</span>
                </div>
                <div className="fjd-receipt-item">
                  <strong>+10 Xu</strong>
                  <span>🎮 Minigame xe buýt</span>
                </div>
                <div className="fjd-receipt-item">
                  <strong>+15 Xu</strong>
                  <span>🎁 Mã {DEMO_GIFTCODE}</span>
                </div>
                <div className="fjd-receipt-item">
                  <strong>+120 EXP · +20 Xu</strong>
                  <span>📖 2/2 Thử thách Quest</span>
                </div>
              </div>

              <div className="fjd-pass-card">
                <div className="fjd-pass-header">
                  <span className="fjd-pass-badge">✦ THẺ THÔNG HÀNH ĐÀ NẴNG</span>
                  <span className="fjd-chip">🌿 Du khách Xanh</span>
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
                      <strong style={{ display: 'block', fontSize: 14.5 }}>{quest.title}</strong>
                      <small style={{ display: 'block', color: '#2b5568', margin: '3px 0 6px', fontSize: 12 }}>
                        {quest.area} · 2/2 thử thách
                      </small>
                      <span className="fjd-chip is-gold">⚡ 120 EXP · 🪙 50 Xu · ✓ ĐÃ ĐÓNG DẤU</span>
                    </div>
                  </div>
                )}

                {cardNotice && <div className="fjd-ok-banner">{cardNotice}</div>}

                <div className="fjd-pass-actions">
                  <button
                    type="button"
                    className="fjd-action-btn"
                    disabled={cardSaving}
                    onClick={() => void handleDownloadPass()}
                  >
                    {cardSaving ? 'Đang tạo PNG…' : '📥 Tải Thẻ Thông Hành (.PNG)'}
                  </button>
                  <div className="fjd-pass-actions-row">
                    <button
                      type="button"
                      className="fjd-secondary-link"
                      onClick={() => setElapsedSec(0)}
                    >
                      🔄 Chơi lại
                    </button>
                    <a
                      className="fjd-secondary-link"
                      href="#/map"
                      onClick={() => {
                        if (onClose) onClose()
                      }}
                    >
                      🗺️ Mở bản đồ →
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
