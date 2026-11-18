// [UX-FLOW] Component NextStepChip: Chip nổi thông minh luôn chỉ dẫn bước tiếp theo
import './NextStepChip.css'
import { t } from './i18n/locale'
import { isUxFlagEnabled } from './lib/uxFlags'
import { quests, getQuest } from './data/quests'
import { useQuestProgress } from './lib/useQuestProgress'
import { usePlayerLocation } from './lib/usePlayerLocation'
import { distanceMeters } from './lib/location'
import { formatMeters } from './lib/routing'

export interface NextStepChipProps {
  currentRoute: string
}

export default function NextStepChip({ currentRoute }: NextStepChipProps) {
  if (!isUxFlagEnabled('NEXT_STEP_CHIP')) {
    return null
  }

  // Không hiện trên màn hình chơi immersive, camera, chúc mừng, đăng nhập hoặc đang tìm điểm / chỉ đường
  const isHiddenRoute =
    currentRoute === '#/' ||
    currentRoute === '#/dang-nhap' ||
    currentRoute === '#/dang-ky' ||
    currentRoute.startsWith('#/may-anh/') ||
    currentRoute.startsWith('#/hoan-thanh/') ||
    currentRoute.includes('/choi') ||
    currentRoute.includes('/chi-duong') ||
    currentRoute.includes('/dan-duong') ||
    currentRoute.startsWith('#/chi-duong/')

  if (isHiddenRoute) return null

  const { state } = useQuestProgress()
  const { sample } = usePlayerLocation()

  // Tìm quest đang dở
  const activeEntry = Object.entries(state.quests)
    .filter(([, run]) => !run.completedAt)
    .sort((a, b) => b[1].startedAt - a[1].startedAt)[0]

  let text = ''
  let href = '#/kham-pha'
  let icon = '✦'

  if (activeEntry) {
    const [id, run] = activeEntry
    const quest = getQuest(id)
    if (!quest) return null

    if (run.arrivalConfirmedAt) {
      // Đã đến nơi, đang trong thử thách
      const currentCheckpointIndex = run.completedCheckpointIds.length
      const currentCheckpoint = quest.checkpoints[currentCheckpointIndex] || quest.checkpoints[0]
      icon = '⚡'
      text = `${t('Tiếp tục:', 'Continue:')} ${currentCheckpoint.title}`
      href = `#/quest/${id}/choi`
    } else {
      // Đã bắt đầu quest nhưng chưa đến điểm
      const dist = sample ? distanceMeters([sample.latitude, sample.longitude], quest.startPosition) : null
      const distText = dist !== null ? ` (${formatMeters(dist)})` : ''
      icon = '⌖'
      text = `${t('Đến điểm hẹn:', 'Go to:')} ${quest.title}${distText}`
      href = `#/quest/${id}/chi-duong`
    }
  } else {
    // Chưa có quest nào: Gợi ý quest gần nhất
    const defaultQuest = quests[0]
    if (!defaultQuest) return null

    const dist = sample ? distanceMeters([sample.latitude, sample.longitude], defaultQuest.startPosition) : null
    const distText = dist !== null ? ` (${formatMeters(dist)})` : ''
    icon = '➜'
    text = `${t('Gợi ý:', 'Suggested:')} ${defaultQuest.title}${distText}`
    href = `#/quest/${defaultQuest.id}`
  }

  return (
    <aside className="next-step-chip-container" aria-label={t('Chỉ dẫn bước tiếp theo', 'Next step guidance')}>
      <a className="next-step-chip" href={href}>
        <span className="next-step-icon" aria-hidden="true">{icon}</span>
        <span className="next-step-text">{text}</span>
        <span className="next-step-arrow" aria-hidden="true">→</span>
      </a>
    </aside>
  )
}
