import { useEffect, useMemo, useRef, useState } from 'react'
import type { BusRouteMatch } from './lib/danabusEngine'
import { distanceMeters, type LocationSample } from './lib/location'
import { formatMeters } from './lib/routing'
import {
  BUS_MINIGAME_REWARD_COINS,
  claimBusMinigameReward,
  getRedeemedBusGiftcodes,
  pickBusQuizRound,
  redeemBusGiftcode,
} from './lib/busCompanion'
import {
  getBusNotificationPermission,
  playBusArrivalChime,
  requestBusNotificationPermission,
  sendBusSystemNotification,
  triggerBusStopAlert,
  type BusNotifPermission,
} from './lib/busNotifications'
import { requestLogin } from './lib/authPrompt'
import { interpolate, t } from './i18n/locale'
import './BusRideCompanion.css'

interface BusRideCompanionProps {
  match: BusRouteMatch
  destinationName: string
  playerSample: LocationSample | null
  simulating: boolean
  minimized: boolean
  onMinimize: () => void
  onRestore: () => void
  onExitRide: () => void
}

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>
}

export default function BusRideCompanion({
  match,
  destinationName,
  playerSample,
  simulating,
  minimized,
  onMinimize,
  onRestore,
  onExitRide,
}: BusRideCompanionProps) {
  const [activeTab, setActiveTab] = useState<'quiz' | 'giftcode'>('quiz')
  const [notifPermission, setNotifPermission] = useState<BusNotifPermission>(() => getBusNotificationPermission())
  const [demoFraction, setDemoFraction] = useState<number | null>(null)
  const [demoRunning, setDemoRunning] = useState(false)

  // Quiz state
  const [roundSeed, setRoundSeed] = useState(() => `${match.route.code}-${match.alightStop.id}-1`)
  const questions = useMemo(() => pickBusQuizRound(roundSeed, 5), [roundSeed])
  const [qIndex, setQIndex] = useState(0)
  const [pickedOption, setPickedOption] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [quizClaimBusy, setQuizClaimBusy] = useState(false)
  const [quizClaimStatus, setQuizClaimStatus] = useState<{ ok: boolean; message: string; requiresAuth?: boolean } | null>(null)

  // Giftcode + QR state
  const [codeInput, setCodeInput] = useState('')
  const [redeemBusy, setRedeemBusy] = useState(false)
  const [redeemStatus, setRedeemStatus] = useState<{ ok: boolean; message: string; requiresAuth?: boolean } | null>(null)
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>(() => getRedeemedBusGiftcodes())
  const [qrOpen, setQrOpen] = useState(false)
  const [qrNotice, setQrNotice] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const codeInputRef = useRef<HTMLInputElement | null>(null)

  // Alert deduplication refs
  const alertedApproaching = useRef(false)
  const alertedArrived = useRef(false)
  const rideStartMs = useRef(0)

  useEffect(() => {
    rideStartMs.current = Date.now()
  }, [match.route.code, match.alightStop.id])

  const totalRideMeters = useMemo(
    () => Math.max(400, distanceMeters(match.boardStop.position, match.alightStop.position)),
    [match.boardStop.position, match.alightStop.position],
  )

  // Demo timer when player presses "Demo sắp đến trạm" or simulating mode is on
  useEffect(() => {
    if (!demoRunning) return
    const timer = window.setInterval(() => {
      setDemoFraction(prev => {
        const current = prev ?? 0.2
        const next = Math.min(1, current + 0.08)
        if (next >= 1) setDemoRunning(false)
        return next
      })
    }, 900)
    return () => window.clearInterval(timer)
  }, [demoRunning])

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - rideStartMs.current) / 1000))
    }, 3000)
    return () => window.clearInterval(timer)
  }, [])

  // Effective ride progress & remaining distance to alighting stop
  const { progressPct, remainingMeters, remainingMinutes, stopStage } = useMemo(() => {
    if (demoFraction !== null) {
      const pct = Math.max(0, Math.min(100, Math.round(demoFraction * 100)))
      const remM = Math.max(0, Math.round((1 - demoFraction) * totalRideMeters))
      const remMin = Math.max(0, Math.ceil((1 - demoFraction) * match.rideMinutes))
      const stage: 'riding' | 'approaching' | 'arrived' =
        demoFraction >= 0.99 || remM <= 120
          ? 'arrived'
          : demoFraction >= 0.8 || remM <= 350
          ? 'approaching'
          : 'riding'
      return { progressPct: pct, remainingMeters: remM, remainingMinutes: remMin, stopStage: stage }
    }

    if (playerSample && !simulating) {
      const gpsDist = Math.round(distanceMeters([playerSample.latitude, playerSample.longitude], match.alightStop.position))
      const frac = Math.max(0.05, Math.min(1, 1 - gpsDist / totalRideMeters))
      const remMin = Math.max(1, Math.round((gpsDist / Math.max(1, totalRideMeters)) * match.rideMinutes))
      const stage: 'riding' | 'approaching' | 'arrived' =
        gpsDist <= 120 ? 'arrived' : gpsDist <= 350 ? 'approaching' : 'riding'
      return {
        progressPct: Math.round(frac * 100),
        remainingMeters: gpsDist,
        remainingMinutes: stage === 'arrived' ? 0 : remMin,
        stopStage: stage,
      }
    }

    const totalSec = Math.max(60, match.rideMinutes * 60)
    const frac = Math.max(0.05, Math.min(1, elapsedSeconds / totalSec))
    const remM = Math.max(0, Math.round((1 - frac) * totalRideMeters))
    const remMin = Math.max(0, Math.ceil((1 - frac) * match.rideMinutes))
    const stage: 'riding' | 'approaching' | 'arrived' =
      frac >= 0.99 || remM <= 120 ? 'arrived' : frac >= 0.82 || remM <= 350 ? 'approaching' : 'riding'
    return { progressPct: Math.round(frac * 100), remainingMeters: remM, remainingMinutes: remMin, stopStage: stage }
  }, [demoFraction, playerSample, simulating, match.alightStop.position, match.rideMinutes, totalRideMeters, elapsedSeconds])

  // Trigger audio + vibration + system notification when approaching / arriving at alighting stop
  useEffect(() => {
    if (stopStage === 'approaching' && !alertedApproaching.current) {
      alertedApproaching.current = true
      triggerBusStopAlert({
        stage: 'approaching',
        routeCode: match.route.code,
        stopName: match.alightStop.name,
        destinationName,
        remainingMeters,
      })
    } else if (stopStage === 'arrived' && !alertedArrived.current) {
      alertedArrived.current = true
      triggerBusStopAlert({
        stage: 'arrived',
        routeCode: match.route.code,
        stopName: match.alightStop.name,
        destinationName,
        remainingMeters: 0,
      })
    }
  }, [stopStage, match.route.code, match.alightStop.name, destinationName, remainingMeters])

  // Update document title & background notification status every 30s so user can browse other apps
  useEffect(() => {
    const prevTitle = document.title
    document.title = stopStage === 'arrived'
      ? `🔔 Xuống trạm ${match.alightStop.name} · Dana Quest`
      : `🚌 Tuyến ${match.route.code} (~${remainingMinutes}p) · Dana Quest`
    return () => { document.title = prevTitle }
  }, [stopStage, match.route.code, match.alightStop.name, remainingMinutes])

  useEffect(() => {
    if (notifPermission !== 'granted' || stopStage === 'arrived') return
    const pushStatus = () => {
      void sendBusSystemNotification(
        'danabus-ride-status',
        `🚌 Đang đi Tuyến ${match.route.code} → ${destinationName}`,
        `Trạm xuống: ${match.alightStop.name} · Còn ${formatMeters(remainingMeters)} (~${remainingMinutes} phút)`,
        { silent: true },
      )
    }
    pushStatus()
    const timer = window.setInterval(pushStatus, 30000)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pushStatus()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [notifPermission, stopStage, match.route.code, match.alightStop.name, destinationName, remainingMeters, remainingMinutes])

  // Camera QR Scanner effect
  useEffect(() => {
    if (!qrOpen) return
    let active = true
    let stream: MediaStream | null = null
    let scanTimer: number | null = null

    const startScan = async () => {
      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
      if (!navigator.mediaDevices?.getUserMedia) {
        setQrNotice(t('Thiết bị không mở được camera quét QR. Hãy nhập mã giftcode trực tiếp bên dưới.', 'Camera unavailable. Please enter the giftcode manually below.'))
        setQrOpen(false)
        codeInputRef.current?.focus()
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!active) {
          stream.getTracks().forEach(tr => tr.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        if (!Detector) {
          setQrNotice(t('Trình duyệt chưa hỗ trợ tự đọc QR trực tiếp. Bạn có thể đọc mã trên xe rồi nhập nhanh vào ô bên dưới.', 'Live QR auto-detect is unsupported in this browser. Read the code on the bus and enter it below.'))
          return
        }
        const detector = new Detector({ formats: ['qr_code'] })
        scanTimer = window.setInterval(async () => {
          if (!active || !videoRef.current || videoRef.current.readyState < 2) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            const value = barcodes[0]?.rawValue
            if (value) {
              setQrOpen(false)
              setCodeInput(value)
              void handleRedeemGiftcode(value)
            }
          } catch {}
        }, 280)
      } catch {
        setQrNotice(t('Chưa được cấp quyền camera. Bạn vẫn có thể nhập thẳng giftcode dán trên xe bên dưới.', 'Camera permission denied. You can enter the giftcode printed on the bus below.'))
        setQrOpen(false)
        codeInputRef.current?.focus()
      }
    }

    void startScan()
    return () => {
      active = false
      if (scanTimer !== null) window.clearInterval(scanTimer)
      stream?.getTracks().forEach(tr => tr.stop())
    }
  }, [qrOpen])

  async function handleEnableNotifications() {
    const result = await requestBusNotificationPermission()
    setNotifPermission(result)
    if (result === 'granted') {
      playBusArrivalChime(false)
      void sendBusSystemNotification(
        'danabus-ride-status',
        `🔔 Đã bật báo trạm · Tuyến ${match.route.code}`,
        `Bạn có thể chuyển sang app khác. Sắp tới trạm ${match.alightStop.name} hệ thống sẽ reo báo!`,
        { silent: false },
      )
    }
  }

  async function handleRedeemGiftcode(overrideCode?: string) {
    const raw = overrideCode ?? codeInput
    setRedeemBusy(true)
    setRedeemStatus(null)
    const res = await redeemBusGiftcode(raw)
    setRedeemBusy(false)
    setRedeemStatus({ ok: res.success, message: res.message, requiresAuth: res.requiresAuth })
    if (res.success) {
      setCodeInput('')
      setRedeemedCodes(getRedeemedBusGiftcodes())
    }
  }

  function handleAnswerQuiz(optionIdx: number) {
    if (pickedOption !== null || quizDone) return
    setPickedOption(optionIdx)
    const q = questions[qIndex]
    if (optionIdx === q.correctIndex) {
      setScore(s => s + 1)
    }
  }

  function handleNextQuestion() {
    if (qIndex + 1 >= questions.length) {
      setQuizDone(true)
    } else {
      setQIndex(i => i + 1)
      setPickedOption(null)
    }
  }

  function handleReplayQuiz() {
    setRoundSeed(`${match.route.code}-${Date.now()}`)
    setQIndex(0)
    setPickedOption(null)
    setScore(0)
    setQuizDone(false)
    setQuizClaimStatus(null)
  }

  async function handleClaimQuizReward() {
    setQuizClaimBusy(true)
    const res = await claimBusMinigameReward(match.route.code, score, questions.length)
    setQuizClaimBusy(false)
    setQuizClaimStatus({ ok: res.success, message: res.message, requiresAuth: res.requiresAuth })
  }

  function handleDemoApproaching() {
    alertedApproaching.current = false
    alertedArrived.current = false
    setDemoFraction(0.74)
    setDemoRunning(true)
  }

  // Minimized bar floating on the live map so player can peek at the map anytime
  if (minimized) {
    return (
      <div className={`bus-ride-mini-bar ${stopStage !== 'riding' ? 'is-alert' : ''}`} role="region" aria-label={t('Chuyến xe buýt đang tham gia', 'Active bus ride')}>
        <button type="button" className="bus-ride-mini-main" onClick={onRestore}>
          <span className="bus-ride-mini-icon" aria-hidden="true">🚌</span>
          <span className="bus-ride-mini-copy">
            <strong>
              {stopStage === 'arrived'
                ? t('🔔 ĐÃ ĐẾN TRẠM XUỐNG!', '🔔 ARRIVED AT STOP!')
                : stopStage === 'approaching'
                ? t('🔔 Sắp đến trạm xuống!', '🔔 Approaching stop!')
                : `${t('Đang đi Tuyến', 'Riding Bus')} ${match.route.code}`}
            </strong>
            <small>
              {match.alightStop.name} · {stopStage === 'arrived' ? t('Xuống xe ngay', 'Get off now') : `${formatMeters(remainingMeters)} (~${remainingMinutes}p)`}
            </small>
          </span>
          <span className="bus-ride-mini-cta">{t('Mở màn hình chờ', 'Open ride')} ▲</span>
        </button>
      </div>
    )
  }

  const currentQuestion = questions[qIndex]

  return (
    <div className="bus-ride-overlay" role="dialog" aria-modal="true" aria-label={interpolate('Đang đi xe buýt Tuyến ${0}', [match.route.code])}>
      <div className="bus-ride-shell">
        {/* Top bar */}
        <header className="bus-ride-header">
          <div className="bus-ride-title-group">
            <span className="bus-ride-route-badge">
              🚌 {t('Tuyến', 'Bus')} {match.route.code}
              {match.route.electric && <em className="bus-ride-elec">⚡</em>}
            </span>
            <div>
              <h2>{match.route.shortName}</h2>
              <small>{t('Trạm xuống:', 'Alight stop:')} {match.alightStop.name}</small>
            </div>
          </div>
          <div className="bus-ride-header-actions">
            <button type="button" className="bus-ride-icon-btn" onClick={onMinimize} title={t('Thu nhỏ xem bản đồ', 'Minimize to map')}>
              🗺️ {t('Bản đồ', 'Map')}
            </button>
            <button type="button" className="bus-ride-icon-btn is-exit" onClick={onExitRide} aria-label={t('Kết thúc chuyến xe buýt', 'End bus ride')}>
              ✕
            </button>
          </div>
        </header>

        <div className="bus-ride-body">
          {/* Cảnh báo khẩn khi sắp đến hoặc đã đến trạm xuống */}
          {stopStage !== 'riding' && (
            <div className={`bus-ride-alert-banner is-${stopStage}`} role="alert">
              <div>
                <strong>
                  {stopStage === 'arrived'
                    ? `🔔 ${t('ĐÃ ĐẾN TRẠM XUỐNG!', 'ARRIVED AT YOUR STOP!')}`
                    : `🔔 ${t('CHUẨN BỊ XUỐNG XE!', 'GET READY TO ALIGHT!')}`}
                </strong>
                <p>
                  {stopStage === 'arrived'
                    ? interpolate('Hãy xuống tại ${0} rồi đi bộ ~${1}m tới ${2}.', [match.alightStop.name, String(match.walkFromAlightMeters), destinationName])
                    : interpolate('Chỉ còn ${0} tới trạm ${1} — nhớ bấm chuông xin xuống trạm!', [formatMeters(remainingMeters), match.alightStop.name])}
                </p>
              </div>
              {stopStage === 'arrived' && (
                <button type="button" className="bus-ride-alight-btn" onClick={onExitRide}>
                  🚶 {t('Đã xuống xe · Đi bộ tới điểm hẹn →', 'Got off · Walk to destination →')}
                </button>
              )}
            </div>
          )}

          {/* Sân khấu Animation xe buýt chạy tò te */}
          <section className="bus-stage" aria-label={t('Hoạt ảnh xe buýt đang di chuyển', 'Bus ride animation')}>
            <div className="bus-stage-sky">
              <span className="bus-cloud c1" aria-hidden="true">☁</span>
              <span className="bus-cloud c2" aria-hidden="true">☁</span>
              <span className="bus-note n1" aria-hidden="true">♪</span>
              <span className="bus-note n2" aria-hidden="true">♫</span>
            </div>
            <div className="bus-stage-scenery" aria-hidden="true">
              <span>🌴</span><span>🌉</span><span>🏢</span><span>🌴</span><span>⛵</span><span>🌴</span><span>🌉</span><span>🏢</span>
            </div>
            <div className="bus-sprite-wrap" aria-hidden="true">
              <div className="bus-sprite">
                <div className="bus-sprite-roof">{match.route.electric ? '⚡ DANABUS' : 'DANABUS'} · {match.route.code}</div>
                <div className="bus-sprite-windows">
                  <span /><span /><span /><span className="bus-windshield" />
                </div>
                <div className="bus-sprite-stripes">
                  <i className="s-yellow" /><i className="s-white" /><i className="s-teal" />
                </div>
                <div className="bus-sprite-wheels">
                  <b className="bus-wheel" /><b className="bus-wheel" />
                </div>
              </div>
              <div className="bus-puffs">
                <span>{match.route.electric ? '🍃' : '💨'}</span>
              </div>
            </div>
            <div className="bus-road" aria-hidden="true"><div className="bus-road-dashes" /></div>

            <div className="bus-progress-card">
              <div className="bus-progress-stats">
                <span>
                  {stopStage === 'arrived'
                    ? t('Đã tới trạm xuống!', 'Arrived at stop!')
                    : interpolate('Còn ${0} · ~${1} phút tới trạm xuống', [formatMeters(remainingMeters), String(remainingMinutes)])}
                </span>
                <strong>{progressPct}%</strong>
              </div>
              <div className="bus-progress-bar">
                <div className="bus-progress-fill" style={{ width: `${progressPct}%` }} />
                <span className="bus-progress-icon" style={{ left: `${Math.min(96, Math.max(4, progressPct))}%` }} aria-hidden="true">🚌</span>
              </div>
              <div className="bus-progress-endpoints">
                <span>📍 {match.boardStop.name}</span>
                <span>🏁 {match.alightStop.name}</span>
              </div>
            </div>

            <div className="bus-stage-controls">
              {notifPermission === 'granted' ? (
                <span className="bus-notif-pill is-on">
                  🔔 {t('Đang theo dõi ngầm · Thoải mái xem FB/TikTok/YouTube, sắp tới trạm sẽ báo!', 'Background alerts ON · Feel free to switch apps, we will alert near your stop!')}
                </span>
              ) : (
                <button type="button" className="bus-notif-btn" onClick={() => void handleEnableNotifications()}>
                  🔔 {t('Bật thông báo reo khi sắp đến trạm', 'Enable stop arrival alerts')}
                </button>
              )}
              <button type="button" className="bus-demo-near-btn" onClick={handleDemoApproaching}>
                ⏩ {t('Demo sắp tới trạm', 'Demo stop alert')}
              </button>
            </div>
          </section>

          {/* 2 Tab tương tác: Minigame & Giftcode/QR */}
          <div className="bus-ride-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'quiz'}
              className={activeTab === 'quiz' ? 'is-active' : ''}
              onClick={() => setActiveTab('quiz')}
            >
              🎮 {t('Minigame trên xe (+10 Xu)', 'On-bus Minigame (+10 Coins)')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'giftcode'}
              className={activeTab === 'giftcode' ? 'is-active' : ''}
              onClick={() => setActiveTab('giftcode')}
            >
              🎁 {t('Quét QR / Giftcode (+15–20 Xu)', 'QR / Giftcode (+15–20 Coins)')}
            </button>
          </div>

          {activeTab === 'quiz' ? (
            <section className="bus-panel bus-quiz-panel" aria-label={t('Minigame đố vui trên xe buýt', 'Bus trivia minigame')}>
              {!quizDone && currentQuestion ? (
                <>
                  <div className="bus-quiz-meta">
                    <span>{interpolate('Câu ${0}/${1}', [String(qIndex + 1), String(questions.length)])}</span>
                    <strong>{interpolate('Đúng: ${0}', [String(score)])}</strong>
                  </div>
                  <h3 className="bus-quiz-question">{currentQuestion.question}</h3>
                  <div className="bus-quiz-options">
                    {currentQuestion.options.map((opt, idx) => {
                      const isPicked = pickedOption === idx
                      const isRight = idx === currentQuestion.correctIndex
                      const stateClass =
                        pickedOption === null
                          ? ''
                          : isRight
                          ? 'is-correct'
                          : isPicked
                          ? 'is-wrong'
                          : 'is-muted'
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`bus-quiz-option ${stateClass}`}
                          disabled={pickedOption !== null}
                          onClick={() => handleAnswerQuiz(idx)}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {pickedOption !== null && (
                    <div className="bus-quiz-feedback">
                      <p>
                        {pickedOption === currentQuestion.correctIndex ? '✅ ' : '💡 '}
                        {currentQuestion.fact}
                      </p>
                      <button type="button" className="bus-primary-btn" onClick={handleNextQuestion}>
                        {qIndex + 1 >= questions.length ? t('Xem kết quả →', 'See results →') : t('Câu tiếp theo →', 'Next question →')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bus-quiz-summary">
                  <h3>🎉 {interpolate('Bạn trả lời đúng ${0}/${1} câu!', [String(score), String(questions.length)])}</h3>
                  <p>
                    {score >= 3
                      ? interpolate('Xuất sắc! Bạn đủ điều kiện nhận +${0} Xu Dana thưởng minigame tuyến ${1}.', [String(BUS_MINIGAME_REWARD_COINS), match.route.code])
                      : t('Cần đúng ít nhất 3/5 câu để nhận +10 Xu Dana. Chơi lại vòng mới nhé!', 'Score at least 3/5 to claim +10 Dana Coins. Try another round!')}
                  </p>
                  {quizClaimStatus && (
                    <p className={`bus-status-msg ${quizClaimStatus.ok ? 'is-ok' : 'is-err'}`} role="status">
                      {quizClaimStatus.message}
                    </p>
                  )}
                  <div className="bus-quiz-summary-actions">
                    {score >= 3 && !quizClaimStatus?.ok && (
                      <button
                        type="button"
                        className="bus-primary-btn"
                        disabled={quizClaimBusy}
                        onClick={() => void handleClaimQuizReward()}
                      >
                        {quizClaimBusy ? t('Đang cộng xu…', 'Claiming…') : `🪙 ${interpolate('Nhận +${0} Xu Dana', [String(BUS_MINIGAME_REWARD_COINS)])}`}
                      </button>
                    )}
                    {quizClaimStatus?.requiresAuth && (
                      <button type="button" className="bus-secondary-btn" onClick={() => requestLogin()}>
                        {t('Đăng nhập để nhận xu', 'Sign in to claim coins')}
                      </button>
                    )}
                    <button type="button" className="bus-secondary-btn" onClick={handleReplayQuiz}>
                      🔄 {t('Chơi bộ câu mới', 'Play new round')}
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="bus-panel bus-giftcode-panel" aria-label={t('Quét mã QR hoặc nhập Giftcode trên xe buýt', 'Scan bus QR or enter giftcode')}>
              <p className="bus-gift-intro">
                {t('Quét mã QR hoặc nhập mã Giftcode dán trên thành xe buýt DanaBus để cộng thẳng Xu Dana vào ví (mỗi tài khoản nhập mỗi mã 1 lần).', 'Scan the QR code or enter the Giftcode printed on your DanaBus to earn Dana Coins (1 claim per code per account).')}
              </p>

              <div className="bus-qr-row">
                <button
                  type="button"
                  className="bus-qr-btn"
                  onClick={() => {
                    setQrNotice('')
                    setQrOpen(open => !open)
                  }}
                >
                  📷 {qrOpen ? t('Tắt camera QR', 'Close QR camera') : t('Quét mã QR trên xe', 'Scan QR on bus')}
                </button>
              </div>

              {qrOpen && (
                <div className="bus-qr-viewport">
                  <video ref={videoRef} playsInline muted autoPlay />
                  <span className="bus-qr-frame" aria-hidden="true" />
                </div>
              )}
              {qrNotice && <p className="bus-status-msg is-info">{qrNotice}</p>}

              <form
                className="bus-gift-form"
                onSubmit={event => {
                  event.preventDefault()
                  void handleRedeemGiftcode()
                }}
              >
                <label className="sr-only" htmlFor="danabus-giftcode-input">
                  {t('Nhập mã giftcode xe buýt', 'Enter bus giftcode')}
                </label>
                <input
                  id="danabus-giftcode-input"
                  ref={codeInputRef}
                  type="text"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  placeholder={interpolate('VD: DANABUS${0} hoặc DANABUS${0}A', [match.route.code])}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
                <button type="submit" className="bus-primary-btn" disabled={redeemBusy || !codeInput.trim()}>
                  {redeemBusy ? t('Đang kiểm tra…', 'Checking…') : t('Nhận xu', 'Redeem')}
                </button>
              </form>

              {redeemStatus && (
                <div className={`bus-status-msg ${redeemStatus.ok ? 'is-ok' : 'is-err'}`} role="status">
                  <span>{redeemStatus.message}</span>
                  {redeemStatus.requiresAuth && (
                    <button type="button" className="bus-inline-login-btn" onClick={() => requestLogin()}>
                      {t('Đăng nhập ngay', 'Sign in now')}
                    </button>
                  )}
                </div>
              )}

              {redeemedCodes.length > 0 && (
                <div className="bus-redeemed-list">
                  <small>{t('Mã xe buýt đã nhận trên tài khoản này:', 'Redeemed on this account:')}</small>
                  <div>
                    {redeemedCodes.map(c => (
                      <span key={c} className="bus-redeemed-chip">✓ {c}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
