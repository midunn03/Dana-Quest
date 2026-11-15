// [UX-FLOW] Component StartHub: Trung tâm xuất phát giúp người chơi biết bắt đầu ở đâu
import React, { useState, useMemo } from 'react'
import './StartHub.css'
import { t, interpolate } from './i18n/locale'
import { isUxFlagEnabled } from './lib/uxFlags'
import { quests, getQuest } from './data/quests'
import { destinations, getDestination } from './data/destinations'
import { useQuestProgress } from './lib/useQuestProgress'
import { useProgress } from './lib/useProgress'
import { usePlayerLocation } from './lib/usePlayerLocation'
import { distanceMeters } from './lib/location'
import { formatMeters } from './lib/routing'

export interface StartHubProps {
  variant?: 'inline' | 'overlay'
  onSelectQuest?: (questId: string) => void
  onDismiss?: () => void
}

export default function StartHub({ variant = 'inline', onSelectQuest, onDismiss }: StartHubProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { state: questState } = useQuestProgress()
  const { state: destState } = useProgress()
  const { sample } = usePlayerLocation()

  if (!isUxFlagEnabled('START_HUB')) {
    return null
  }

  // 1. Kiểm tra xem người chơi có quest đang dở không
  const activeQuestEntry = Object.entries(questState.quests)
    .filter(([, run]) => !run.completedAt)
    .sort((a, b) => b[1].startedAt - a[1].startedAt)[0]

  const activeQuest = activeQuestEntry ? getQuest(activeQuestEntry[0]) : null
  const activeRun = activeQuestEntry ? activeQuestEntry[1] : null

  // Hoặc địa điểm nhiệm vụ đang dở
  const activeDestEntry = !activeQuest
    ? Object.entries(destState.destinations).find(
        ([id, run]) => !getQuest(id) && run.started && run.completed.length < run.selected.length
      )
    : null
  const activeDest = activeDestEntry ? getDestination(activeDestEntry[0]) : null
  const activeDestRun = activeDestEntry ? activeDestEntry[1] : null

  // 2. Tìm quest gợi ý cho người mới (nếu không có quest dở)
  const recommendedQuest = useMemo(() => {
    if (activeQuest || activeDest) return null

    // Ưu tiên quest cốt truyện gần GPS nhất
    if (sample && quests.length > 0) {
      const sorted = [...quests].sort((a, b) => {
        const distA = distanceMeters([sample.latitude, sample.longitude], a.startPosition)
        const distB = distanceMeters([sample.latitude, sample.longitude], b.startPosition)
        return distA - distB
      })
      return sorted[0]
    }

    // Mặc định: Cầu Rồng hoặc DUE
    return quests.find(q => q.id === 'cau-rong') || quests[0]
  }, [activeQuest, activeDest, sample])

  // Khoảng cách tới quest gợi ý
  const distToRecommended = sample && recommendedQuest
    ? distanceMeters([sample.latitude, sample.longitude], recommendedQuest.startPosition)
    : null

  // RENDER: Nếu có quest đang dở -> Chế độ TIẾP TỤC
  if (activeQuest && activeRun) {
    const completedCount = activeRun.completedCheckpointIds.length
    const totalCount = activeQuest.checkpoints.length
    const resumeHref = `#/quest/${activeQuest.id}/${activeRun.arrivalConfirmedAt ? 'choi' : 'chi-duong'}`

    return (
      <aside
        className={`start-hub start-hub-${variant} ${collapsed ? 'is-collapsed' : ''}`}
        aria-label={t('Trung tâm xuất phát', 'Start Hub')}
      >
        <div className="start-hub-header">
          <div className="start-hub-badge resume-badge">
            <span aria-hidden="true">▶</span>
            <span>{t('Tiếp tục hành trình', 'Continue Journey')}</span>
          </div>
          {variant === 'overlay' && (
            <button
              className="start-hub-toggle"
              onClick={() => setCollapsed(v => !v)}
              aria-label={collapsed ? t('Mở rộng', 'Expand') : t('Thu nhỏ', 'Minimize')}
            >
              {collapsed ? '▲' : '▼'}
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="start-hub-body">
            <div className="start-hub-info">
              <h3 className="start-hub-title">{activeQuest.title}</h3>
              <p className="start-hub-progress">
                {t('Tiến độ:', 'Progress:')}{' '}
                <strong>
                  {completedCount}/{totalCount} {t('thử thách', 'challenges')}
                </strong>
                {activeRun.arrivalConfirmedAt
                  ? ` · ${t('Đang làm nhiệm vụ', 'In progress')}`
                  : ` · ${t('Chưa đến điểm hẹn', 'Heading to start')}`}
              </p>
            </div>

            <div className="start-hub-actions">
              <a
                className="start-hub-primary-btn"
                href={resumeHref}
                onClick={() => onSelectQuest?.(activeQuest.id)}
              >
                {t('Chơi tiếp ngay', 'Resume Now')} →
              </a>
              <a className="start-hub-secondary-btn" href="#/map">
                {t('Xem bản đồ', 'View Map')}
              </a>
            </div>
          </div>
        )}
      </aside>
    )
  }

  // RENDER: Nếu có địa điểm nhiệm vụ đang dở
  if (activeDest && activeDestRun) {
    const resumeHref = `#/nhiem-vu/${activeDest.id}`
    return (
      <aside
        className={`start-hub start-hub-${variant} ${collapsed ? 'is-collapsed' : ''}`}
        aria-label={t('Trung tâm xuất phát', 'Start Hub')}
      >
        <div className="start-hub-header">
          <div className="start-hub-badge resume-badge">
            <span aria-hidden="true">▶</span>
            <span>{t('Tiếp tục khám phá', 'Continue Exploring')}</span>
          </div>
          {variant === 'overlay' && (
            <button
              className="start-hub-toggle"
              onClick={() => setCollapsed(v => !v)}
              aria-label={collapsed ? t('Mở rộng', 'Expand') : t('Thu nhỏ', 'Minimize')}
            >
              {collapsed ? '▲' : '▼'}
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="start-hub-body">
            <div className="start-hub-info">
              <h3 className="start-hub-title">{activeDest.name}</h3>
              <p className="start-hub-progress">
                {t('Nhiệm vụ:', 'Missions:')}{' '}
                <strong>
                  {activeDestRun.completed.length}/{activeDestRun.selected.length}
                </strong>
              </p>
            </div>
            <div className="start-hub-actions">
              <a className="start-hub-primary-btn" href={resumeHref}>
                {t('Làm tiếp nhiệm vụ', 'Continue Missions')} →
              </a>
            </div>
          </div>
        )}
      </aside>
    )
  }

  // RENDER: Người chơi mới / Chưa chọn quest nào -> HÀNH TRÌNH ĐẦU TIÊN
  if (!recommendedQuest) return null

  return (
    <aside
      className={`start-hub start-hub-${variant} ${collapsed ? 'is-collapsed' : ''}`}
      aria-label={t('Bắt đầu chơi tại đây', 'Start Playing Here')}
    >
      <div className="start-hub-header">
        <div className="start-hub-badge recommend-badge">
          <span aria-hidden="true">✦</span>
          <span>{t('Hành trình đầu tiên của bạn', 'Your First Quest')}</span>
        </div>
        {distToRecommended !== null && (
          <span className="start-hub-distance">
            ⌖ {t('Cách bạn', 'Distance:')} {formatMeters(distToRecommended)}
          </span>
        )}
        {variant === 'overlay' && (
          <button
            className="start-hub-toggle"
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? t('Mở rộng', 'Expand') : t('Thu nhỏ', 'Minimize')}
          >
            {collapsed ? '▲' : '▼'}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="start-hub-body">
          <div className="start-hub-hero">
            <div className="start-hub-title-row">
              <h3 className="start-hub-title">{recommendedQuest.title}</h3>
              <span className="start-hub-meta-tag">
                ~{recommendedQuest.estimatedMinutes} {t('phút', 'min')} · {recommendedQuest.checkpoints.length} {t('thử thách', 'steps')}
              </span>
            </div>
            <p className="start-hub-summary">{recommendedQuest.summary}</p>
          </div>

          <div className="start-hub-steps" aria-label={t('3 bước chơi đơn giản', '3 Simple Steps')}>
            <div className="start-step-item">
              <span className="start-step-num">①</span>
              <span className="start-step-text">{t('Đến điểm hẹn', 'Reach start point')}</span>
            </div>
            <span className="start-step-arrow" aria-hidden="true">→</span>
            <div className="start-step-item">
              <span className="start-step-num">②</span>
              <span className="start-step-text">{t('Giải thử thách tại chỗ', 'Solve local riddle')}</span>
            </div>
            <span className="start-step-arrow" aria-hidden="true">→</span>
            <div className="start-step-item">
              <span className="start-step-num">③</span>
              <span className="start-step-text">{t('Nhận Xu & Quà', 'Get Coins & Rewards')}</span>
            </div>
          </div>

          <div className="start-hub-actions">
            <a
              className="start-hub-primary-btn"
              href={`#/quest/${recommendedQuest.id}`}
              onClick={() => onSelectQuest?.(recommendedQuest.id)}
            >
              {t('Bắt đầu ngay', 'Start Now')} ↗
            </a>
            <a className="start-hub-secondary-btn" href="#/map">
              {t('Xem trên bản đồ', 'Explore Map')}
            </a>
            <a className="start-hub-help-link" href="#/huong-dan">
              ? {t('Hướng dẫn chơi', 'How to Play')}
            </a>
          </div>
        </div>
      )}
    </aside>
  )
}
