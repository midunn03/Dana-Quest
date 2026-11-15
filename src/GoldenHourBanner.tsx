import { useEffect, useState } from 'react'
import { fetchGoldenHours, claimGoldenHourReward, type GoldenHourItem } from './lib/goldenHour'
import { usePlayerLocation } from './lib/usePlayerLocation'
import { t, interpolate } from './i18n/locale'
import './GoldenHour.css'

export default function GoldenHourBanner({ destinationId }: { destinationId: string }) {
  const [challenge, setChallenge] = useState<GoldenHourItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { sample } = usePlayerLocation()

  useEffect(() => {
    let alive = true
    fetchGoldenHours().then((res) => {
      if (!alive || !res) return
      const found = res.challenges.find(
        (c) => c.destinationId === destinationId || (destinationId.includes('cau-rong') && c.destinationId === 'cau-rong')
      )
      if (found && (found.isActive || found.isUpcoming)) {
        setChallenge(found)
      }
    })
    return () => {
      alive = false
    }
  }, [destinationId])

  if (!challenge) return null

  const handleClaim = async () => {
    if (!sample) {
      setMessage(t('Đang tìm vị trí GPS…'))
      return
    }
    setBusy(true)
    setMessage(null)
    const res = await claimGoldenHourReward(challenge.id, {
      latitude: sample.latitude,
      longitude: sample.longitude,
      accuracy: sample.accuracy,
      isSimulated: (sample as any).isSimulated ?? false,
    })
    setBusy(false)
    if (res.success) {
      setChallenge((prev) => (prev ? { ...prev, claimedToday: true } : null))
      setMessage(res.message || t('Đã nhận thưởng giờ vàng!'))
    } else {
      setMessage(res.message || t('Không thể nhận thưởng.'))
    }
  }

  if (challenge.isActive) {
    return (
      <div className="golden-banner is-active" role="region" aria-label={t('Thử thách giờ vàng')}>
        <div className="golden-header">
          <span className="golden-icon" aria-hidden="true">⚡</span>
          <div>
            <h4 className="golden-title">
              {interpolate('GIỜ VÀNG ĐANG DIỄN RA: ${0} (+${1} XU)', [challenge.title, challenge.bonusCoins])}
            </h4>
            <p className="golden-desc">
              {challenge.description} ({challenge.startTime} – {challenge.endTime})
            </p>
          </div>
        </div>
        {challenge.claimedToday ? (
          <span className="golden-claimed-badge">✓ {t('Bạn đã nhận thưởng giờ vàng hôm nay.')}</span>
        ) : (
          <button className="golden-claim-btn" disabled={busy} onClick={() => void handleClaim()}>
            {busy ? t('Đang kiểm tra vị trí…') : interpolate('Nhận thưởng giờ vàng (+${0} xu)', [challenge.bonusCoins])}
          </button>
        )}
        {message && <small role="status">{message}</small>}
      </div>
    )
  }

  if (challenge.isUpcoming) {
    return (
      <div className="golden-banner is-upcoming" role="region" aria-label={t('Sắp đến giờ vàng')}>
        <div className="golden-header">
          <span className="golden-icon" aria-hidden="true">⏳</span>
          <div>
            <h4 className="golden-title">
              {interpolate('Sắp đến giờ vàng: ${0}', [challenge.title])}
            </h4>
            <p className="golden-desc">
              {interpolate('Khung giờ ${0} – ${1} hôm nay (còn khoảng ${2} phút). Đến đúng giờ để nhận thêm +${3} xu!', [
                challenge.startTime,
                challenge.endTime,
                challenge.minutesUntil ?? 0,
                challenge.bonusCoins,
              ])}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
