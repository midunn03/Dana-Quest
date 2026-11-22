import { useEffect, useState, useMemo } from 'react'
import {
  getRecordedTrack,
  trimTrack,
  clearRecordedTrack,
  finishTrackSession,
  type TrackPoint,
} from './lib/journeyTrack'
import { getCachedStreak } from './lib/streak'
import { t, interpolate } from './i18n/locale'
import './JourneyRecap.css'

function calculateDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const dPhi = ((lat2 - lat1) * Math.PI) / 180
  const dLambda = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function JourneyRecapPage() {
  const [rawTrack, setRawTrack] = useState<TrackPoint[]>(() => getRecordedTrack())
  const [hidePrivacyZones, setHidePrivacyZones] = useState(true)
  const [shareFormat, setShareFormat] = useState<'story' | 'square'>('story')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [savedBonus, setSavedBonus] = useState<number | null>(null)

  // Demo fallback if no track points yet
  const track = useMemo(() => {
    if (rawTrack.length >= 2) {
      return hidePrivacyZones ? trimTrack(rawTrack, 200) : rawTrack
    }
    // Demo path across Da Nang (Cầu Rồng -> Cầu Sông Hàn -> Biển Mỹ Khê)
    const baseTime = 1_774_000_000_000
    const demo = [
      { lat: 16.061, lng: 108.227, timestamp: baseTime - 3600000 },
      { lat: 16.064, lng: 108.226, timestamp: baseTime - 2800000 },
      { lat: 16.071, lng: 108.224, timestamp: baseTime - 1800000 },
      { lat: 16.065, lng: 108.238, timestamp: baseTime - 600000 },
      { lat: 16.060, lng: 108.245, timestamp: baseTime },
    ]
    return hidePrivacyZones ? trimTrack(demo, 100) : demo
  }, [rawTrack, hidePrivacyZones])

  // Compute metrics
  const metrics = useMemo(() => {
    let meters = 0
    for (let i = 1; i < track.length; i++) {
      meters += calculateDist(track[i - 1].lat, track[i - 1].lng, track[i].lat, track[i].lng)
    }
    const durationSec = track.length >= 2 ? Math.max(1, (track[track.length - 1].timestamp - track[0].timestamp) / 1000) : 0
    const avgSpeed = durationSec > 0 ? (meters / durationSec) * 3.6 : 0
    const km = (meters / 1000).toFixed(1)
    const mins = Math.round(durationSec / 60)
    return { meters, km, durationSec, mins, avgSpeed: avgSpeed.toFixed(1) }
  }, [track])

  const streak = getCachedStreak()?.currentStreak ?? 1

  // Finalize session on server once
  useEffect(() => {
    if (rawTrack.length >= 2 && savedBonus === null) {
      finishTrackSession(rawTrack).then((res) => {
        if (res.success && res.coinsAwarded) {
          setSavedBonus(res.coinsAwarded)
        }
      })
    }
  }, [rawTrack, savedBonus])

  // Bounding box for SVG and Canvas
  const bounds = useMemo(() => {
    if (track.length === 0) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 }
    let minLat = track[0].lat
    let maxLat = track[0].lat
    let minLng = track[0].lng
    let maxLng = track[0].lng
    for (const p of track) {
      if (p.lat < minLat) minLat = p.lat
      if (p.lat > maxLat) maxLat = p.lat
      if (p.lng < minLng) minLng = p.lng
      if (p.lng > maxLng) maxLng = p.lng
    }
    const padLat = Math.max((maxLat - minLat) * 0.15, 0.002)
    const padLng = Math.max((maxLng - minLng) * 0.15, 0.002)
    return {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
    }
  }, [track])

  const getSvgPoint = (lat: number, lng: number, w = 400, h = 260) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * w
    const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * h
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }

  const svgPolyline = useMemo(() => {
    return track
      .map((p) => {
        const x = ((p.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 400
        const y = (1 - (p.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 260
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }, [track, bounds])

  // Generate PNG for sharing
  const generatePng = () => {
    const isStory = shareFormat === 'story'
    const w = isStory ? 1080 : 1080
    const h = isStory ? 1920 : 1080

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#0f172a')
    bg.addColorStop(1, '#022c22')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    // Title & Brand
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 54px sans-serif'
    ctx.fillText('DANA QUEST', 80, 140)

    ctx.fillStyle = '#10b981'
    ctx.font = 'bold 36px sans-serif'
    ctx.fillText(t('TỔNG KẾT HÀNH TRÌNH KHÁM PHÁ'), 80, 200)

    // Route map box
    const mapY = 280
    const mapH = isStory ? 760 : 420
    const mapW = w - 160
    ctx.fillStyle = '#1e293b'
    ctx.roundRect(80, mapY, mapW, mapH, 24)
    ctx.fill()

    // Draw route polyline
    if (track.length >= 2) {
      ctx.beginPath()
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 12
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (let i = 0; i < track.length; i++) {
        const x = 80 + 30 + ((track[i].lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (mapW - 60)
        const y = mapY + mapH - 30 - ((track[i].lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (mapH - 60)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Start marker
      const startX = 80 + 30 + ((track[0].lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (mapW - 60)
      const startY = mapY + mapH - 30 - ((track[0].lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (mapH - 60)
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(startX, startY, 16, 0, Math.PI * 2)
      ctx.fill()

      // End marker
      const endPt = track[track.length - 1]
      const endX = 80 + 30 + ((endPt.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (mapW - 60)
      const endY = mapY + mapH - 30 - ((endPt.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (mapH - 60)
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(endX, endY, 16, 0, Math.PI * 2)
      ctx.fill()
    }

    // Metrics cards
    const statsY = mapY + mapH + 60
    const stats = [
      { label: t('QUÃNG ĐƯỜNG'), val: `${metrics.km} km` },
      { label: t('THỜI GIAN'), val: `${metrics.mins} ${t('phút')}` },
      { label: t('TỐC ĐỘ TB'), val: `${metrics.avgSpeed} km/h` },
      { label: t('CHUỖI KHÁM PHÁ'), val: `🔥 ${streak} ${t('ngày')}` },
    ]

    const boxW = (mapW - 30) / 2
    const boxH = 140

    stats.forEach((st, idx) => {
      const bx = 80 + (idx % 2) * (boxW + 30)
      const by = statsY + Math.floor(idx / 2) * (boxH + 24)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.roundRect(bx, by, boxW, boxH, 16)
      ctx.fill()

      ctx.fillStyle = '#94a3b8'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(st.label, bx + 24, by + 45)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 44px sans-serif'
      ctx.fillText(st.val, bx + 24, by + 105)
    })

    // Watermark / Privacy notice
    ctx.fillStyle = '#64748b'
    ctx.font = '22px sans-serif'
    ctx.fillText('danaquest.vn · Hành trình xanh bảo vệ Đà Nẵng', 80, h - 80)

    const url = canvas.toDataURL('image/png')
    setPreviewUrl(url)
  }

  const handleShare = async () => {
    if (!previewUrl) return
    setSharing(true)
    try {
      const blob = await (await fetch(previewUrl)).blob()
      const file = new File([blob], 'dana-quest-recap.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'DANA QUEST Recap',
          text: interpolate('Tôi vừa hoàn thành chuyến khám phá ${0} km tại Đà Nẵng cùng Dana Quest!', [metrics.km]),
        })
      } else {
        const a = document.createElement('a')
        a.href = previewUrl
        a.download = 'dana-quest-recap.png'
        a.click()
      }
    } catch {
      const a = document.createElement('a')
      a.href = previewUrl
      a.download = 'dana-quest-recap.png'
      a.click()
    } finally {
      setSharing(false)
    }
  }

  const handleClear = () => {
    if (window.confirm(t('Bạn có chắc muốn xóa lịch sử hành trình hiện tại không?'))) {
      clearRecordedTrack()
      setRawTrack([])
    }
  }

  return (
    <main className="recap-page">
      <div className="recap-card">
        <header className="recap-header">
          <h1>🏃‍♂️ {t('Recap Hành Trình')}</h1>
          <a href="#/kham-pha" style={{ color: '#ea580c', fontWeight: 'bold', textDecoration: 'none' }}>
            {t('← Khám phá')}
          </a>
        </header>

        {/* Bản đồ hành trình tự vẽ bằng SVG */}
        <div className="recap-map-container" role="img" aria-label={t('Bản đồ đường đi của hành trình')}>
          <svg className="recap-svg-map" viewBox="0 0 400 260">
            <polyline
              points={svgPolyline}
              fill="none"
              stroke="#22c55e"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {track.length >= 2 && (
              <>
                <circle cx={getSvgPoint(track[0].lat, track[0].lng).split(',')[0]} cy={getSvgPoint(track[0].lat, track[0].lng).split(',')[1]} r="7" fill="#3b82f6" />
                <circle cx={getSvgPoint(track[track.length - 1].lat, track[track.length - 1].lng).split(',')[0]} cy={getSvgPoint(track[track.length - 1].lat, track[track.length - 1].lng).split(',')[1]} r="7" fill="#ef4444" />
              </>
            )}
          </svg>
        </div>

        {/* Chỉ số hành trình kiểu Strava */}
        <div className="recap-stats-grid">
          <div className="recap-stat-box">
            <span className="recap-stat-label">{t('Quãng đường')}</span>
            <span className="recap-stat-val">{metrics.km} km</span>
          </div>
          <div className="recap-stat-box">
            <span className="recap-stat-label">{t('Thời gian')}</span>
            <span className="recap-stat-val">{metrics.mins} {t('phút')}</span>
          </div>
          <div className="recap-stat-box">
            <span className="recap-stat-label">{t('Tốc độ TB')}</span>
            <span className="recap-stat-val">{metrics.avgSpeed} km/h</span>
          </div>
          <div className="recap-stat-box">
            <span className="recap-stat-label">{t('Chuỗi Streak')}</span>
            <span className="recap-stat-val">🔥 {streak} {t('ngày')}</span>
          </div>
        </div>

        {savedBonus !== null && (
          <div style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '10px 14px', borderRadius: '6px', color: '#047857' }}>
            🎉 {interpolate('Đã cộng +${0} xu thưởng di chuyển xanh vào ví của bạn!', [savedBonus])}
          </div>
        )}

        {/* Tùy chọn quyền riêng tư: Ẩn 200m đầu và cuối */}
        <div className="recap-privacy-row">
          <span>🛡️ {t('Ẩn 200m đầu & cuối (bảo vệ nơi ở / khách sạn)')}</span>
          <input
            type="checkbox"
            checked={hidePrivacyZones}
            onChange={(e) => setHidePrivacyZones(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
        </div>

        {/* Nút hành động */}
        <div className="recap-btn-row">
          <button
            className="recap-share-btn"
            onClick={() => {
              generatePng()
            }}
          >
            📸 {t('Xuất ảnh chia sẻ')}
          </button>
          <button className="recap-clear-btn" onClick={handleClear}>
            {t('Xóa hành trình')}
          </button>
        </div>
      </div>

      {/* Modal xem trước & chia sẻ ảnh PNG */}
      {previewUrl && (
        <div className="recap-share-modal" role="dialog" aria-label={t('Xem trước ảnh recap')}>
          <div className="recap-share-box">
            <h3>{t('Chia sẻ hành trình')}</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button
                style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #ccc', background: shareFormat === 'story' ? '#ea580c' : '#fff', color: shareFormat === 'story' ? '#fff' : '#333', cursor: 'pointer' }}
                onClick={() => { setShareFormat('story'); setTimeout(generatePng, 50) }}
              >
                Story 9:16
              </button>
              <button
                style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #ccc', background: shareFormat === 'square' ? '#ea580c' : '#fff', color: shareFormat === 'square' ? '#fff' : '#333', cursor: 'pointer' }}
                onClick={() => { setShareFormat('square'); setTimeout(generatePng, 50) }}
              >
                Vuông 1:1
              </button>
            </div>
            <img className="recap-share-preview" src={previewUrl} alt={t('Xem trước ảnh recap')} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="recap-share-btn" disabled={sharing} onClick={() => void handleShare()}>
                {sharing ? t('Đang chia sẻ…') : t('Tải về / Chia sẻ')}
              </button>
              <button className="recap-clear-btn" onClick={() => setPreviewUrl(null)}>
                {t('Đóng')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
