import { useEffect, useState } from 'react'
import { fetchUserBadges, type BadgeResponse } from './lib/badges'
import { t, interpolate } from './i18n/locale'
import './Badges.css'

export default function BadgeCollectionPage() {
  const [data, setData] = useState<BadgeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchUserBadges().then((res) => {
      if (alive) {
        setData(res)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <section className="badge-page" role="status">
        <p>{t('Đang tải bộ sưu tập huy hiệu…')}</p>
      </section>
    )
  }

  const themes = data?.themes ?? []
  const total = data?.totalBadges ?? 0
  const unlocked = data?.totalUnlocked ?? 0

  return (
    <div className="badge-page">
      <div className="badge-summary-card">
        <div className="badge-summary-info">
          <h2>{t('Huy hiệu đã đạt được')}</h2>
          <p>{t('Khám phá địa điểm, hoàn thành quest để mở khóa huy hiệu và nhận thưởng xu.')}</p>
        </div>
        <div className="badge-summary-stat">
          {unlocked}/{total}
        </div>
      </div>

      {themes.map((theme) => (
        <section key={theme.slug} className="badge-theme-section">
          <div className="badge-theme-header">
            <div className="badge-theme-title">
              <span className="badge-theme-icon" aria-hidden="true">{theme.icon}</span>
              <div>
                <h3>{theme.name}</h3>
                <small>{theme.description}</small>
              </div>
            </div>
            <span className={`badge-theme-badge-count ${theme.completed ? 'is-completed' : ''}`}>
              {theme.completed ? '✓ ' + t('Đã đủ bộ (+${0} xu)', [theme.completionBonusCoins]) : `${theme.unlockedCount}/${theme.totalCount}`}
            </span>
          </div>

          <div className="badge-grid">
            {theme.badges.map((badge) => (
              <div
                key={badge.id}
                className={`badge-item-card ${badge.unlocked ? 'is-unlocked' : ''}`}
                aria-label={interpolate('${0} (${1})', [badge.title, badge.unlocked ? t('Đã mở khóa') : t('Chưa mở khóa')])}
              >
                <div className="badge-item-icon-box" aria-hidden="true">
                  {badge.image ? <img src={badge.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : badge.icon}
                </div>
                <div className="badge-item-info">
                  <div className="badge-item-header">
                    <strong>{badge.title}</strong>
                    <span className={`badge-rarity-pill ${badge.rarity}`}>
                      {badge.rarity === 'legendary' ? t('Huyền thoại') : badge.rarity === 'rare' ? t('Hiếm') : t('Thường')}
                    </span>
                  </div>
                  <p className="badge-item-desc">{badge.description}</p>
                  <div className="badge-item-reward">
                    {badge.unlocked ? t('✓ Đã nhận +${0} xu', [badge.bonusCoins]) : t('Thưởng +${0} xu', [badge.bonusCoins])}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
