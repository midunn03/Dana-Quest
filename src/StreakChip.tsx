import { useEffect, useState } from 'react'
import { fetchStreak, getCachedStreak, type StreakData } from './lib/streak'
import { t, interpolate } from './i18n/locale'
import './Streak.css'

export default function StreakChip() {
  const [streak, setStreak] = useState<StreakData | null>(() => getCachedStreak())
  const [milestoneNotice, setMilestoneNotice] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchStreak().then((data) => {
      if (alive && data) setStreak(data)
    })

    const onUpdate = (e: Event) => {
      const custom = e as CustomEvent<StreakData>
      if (custom.detail) setStreak(custom.detail)
    }

    const onMilestone = (e: Event) => {
      const custom = e as CustomEvent<Array<{ days: number; bonusCoins: number; message?: string }>>
      if (custom.detail && custom.detail.length > 0) {
        const item = custom.detail[0]
        setMilestoneNotice(item.message || interpolate('Đạt mốc ${0} ngày liên tiếp (+${1} xu)!', [item.days, item.bonusCoins]))
        setTimeout(() => setMilestoneNotice(null), 6000)
      }
    }

    window.addEventListener('dana-streak-updated', onUpdate)
    window.addEventListener('dana-streak-milestone', onMilestone)

    return () => {
      alive = false
      window.removeEventListener('dana-streak-updated', onUpdate)
      window.removeEventListener('dana-streak-milestone', onMilestone)
    }
  }, [])

  const count = streak?.currentStreak ?? 0
  const active = count > 0

  return (
    <>
      <span
        className={`streak-chip ${active ? '' : 'streak-chip-inactive'}`}
        title={active ? interpolate('Chuỗi ${0} ngày khám phá liên tiếp', [count]) : t('Chưa có chuỗi ngày liên tiếp')}
        aria-label={interpolate('Chuỗi ${0} ngày liên tiếp', [count])}
      >
        <span className="streak-chip-flame" aria-hidden="true">🔥</span>
        <span>{interpolate('${0} ngày', [count])}</span>
      </span>
      {milestoneNotice && (
        <div className="streak-milestone-banner" role="status">
          <strong>🎉 {t('Thưởng chuỗi ngày!')}</strong>
          <p>{milestoneNotice}</p>
        </div>
      )}
    </>
  )
}
