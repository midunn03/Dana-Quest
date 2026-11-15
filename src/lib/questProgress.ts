import { t } from '../i18n/locale'
import { getQuest } from '../data/quests'
import { newState, readState, type ProgressState } from './progress'
import {isChallengeCorrect,migrateCatalogRun} from '../../shared/quest-challenges.mjs'

export interface QuestRunProgress {
  catalogVersion?:number
  previousCompletionAt?:number
  arrivalConfirmedAt?: number
  arrivalMethod?: 'visual'
  phase?: 'story' | 'challenge' | 'feedback' | 'results'
  paused?: boolean
  startedAt: number
  completedCheckpointIds: string[]
  completedAtByCheckpoint: Record<string, number>
  completedAt?: number
}

export interface QuestProgressState {
  version: 2
  legacy: ProgressState
  quests: Record<string, QuestRunProgress>
}

export type QuestProgressAction =
  | { type: 'continue-story' | 'advance' | 'pause' | 'resume'; questId: string; checkpointId?: string }
  | { type: 'start' | 'confirm-arrival'; questId: string; now?: number }
  | { type: 'complete-checkpoint'; questId: string; checkpointId: string; answer?: string; photoAvailable?: boolean; now?: number }

export const newQuestState = (legacy = newState()): QuestProgressState => ({
  version: 2,
  legacy,
  quests: {},
})

function validateQuestRun(questId: string, run: QuestRunProgress) {
  const quest = getQuest(questId)
  if (!quest || !run || !Number.isFinite(run.startedAt) || !Array.isArray(run.completedCheckpointIds)) throw new Error(t("Tiến trình quest không hợp lệ."))
  const completed = run.completedCheckpointIds
  if ((run.phase!==undefined&&!['story','challenge','feedback','results'].includes(run.phase))||(run.paused!==undefined&&typeof run.paused!=='boolean')) throw new Error(t("Trạng thái bước chơi không hợp lệ."))
  if (new Set(completed).size !== completed.length || completed.some((id, index) => quest.checkpointOrder[index] !== id)) throw new Error(t("Thứ tự checkpoint không hợp lệ."))
  if (!run.completedAtByCheckpoint || Object.keys(run.completedAtByCheckpoint).some(id => !completed.includes(id)) || completed.some(id => !Number.isFinite(run.completedAtByCheckpoint[id]))) throw new Error(t("Thời điểm hoàn thành checkpoint không hợp lệ."))
  const isComplete = completed.length === quest.checkpointOrder.length
  if ((run.completedAt !== undefined) !== isComplete || (run.completedAt !== undefined && !Number.isFinite(run.completedAt))) throw new Error(t("Trạng thái hoàn thành quest không hợp lệ."))
}

export function migrateQuestState(value: unknown): QuestProgressState {
  if (value === undefined) return newQuestState()
  const candidate = value as { version?: number; legacy?: unknown; quests?: unknown }
  if (candidate?.version === 1) return newQuestState(readState(value))
  if (candidate?.version !== 2 || !candidate.quests || typeof candidate.quests !== 'object' || Array.isArray(candidate.quests)) throw new Error(t("Dữ liệu quest không hợp lệ."))
  const state: QuestProgressState = {
    version: 2,
    legacy: readState(candidate.legacy),
    quests: Object.fromEntries(Object.entries(candidate.quests).map(([id,run])=>[id,migrateCatalogRun(id,run)])) as Record<string, QuestRunProgress>,
  }
  Object.entries(state.quests).forEach(([questId, run]) => validateQuestRun(questId, run))
  return state
}

export function updateQuestProgress(state: QuestProgressState, action: QuestProgressAction): QuestProgressState {
  const quest = getQuest(action.questId)
  if (!quest) throw new Error(t("Không tìm thấy quest."))
  const current = state.quests[quest.id]
  const now = ('now' in action ? action.now : undefined) ?? Date.now()
  if (!Number.isFinite(now)) throw new Error(t("Thời điểm cập nhật không hợp lệ."))

  if (action.type === 'start') {
    if (current) return state
    return {
      ...state,
      quests: { ...state.quests, [quest.id]: { startedAt: now, completedCheckpointIds: [], completedAtByCheckpoint: {},catalogVersion:quest.catalogVersion||1 } },
    }
  }

  if (!current) throw new Error(t("Quest chưa được bắt đầu."))
  if (action.type === 'confirm-arrival') return current.arrivalConfirmedAt ? state : { ...state, quests: { ...state.quests, [quest.id]: { ...current, arrivalConfirmedAt: now, arrivalMethod: 'visual' } } }
  if (action.type === 'pause' || action.type === 'resume') return { ...state, quests: { ...state.quests, [quest.id]: { ...current, paused: action.type === 'pause' } } }
  if (current.paused) throw new Error(t("Quest đang tạm dừng."))
  if (action.type === 'continue-story' || action.type === 'advance') return { ...state, quests: { ...state.quests, [quest.id]: { ...current, phase: action.type === 'continue-story' ? 'challenge' : current.completedAt ? 'results' : 'story' } } }
  if (action.type !== 'complete-checkpoint') throw new Error(t("Thao tác không hợp lệ."))
  if (current.completedCheckpointIds.includes(action.checkpointId)) return state
  const expectedId = quest.checkpointOrder[current.completedCheckpointIds.length]
  if (action.checkpointId !== expectedId) throw new Error(t("Hãy hoàn thành checkpoint theo đúng thứ tự."))
  const checkpoint = quest.checkpoints.find(item => item.id === action.checkpointId)
  if (!checkpoint || !isChallengeCorrect(checkpoint.challenge, action.answer, action.photoAvailable)) throw new Error(t("Câu trả lời hoặc minh chứng chưa chính xác."))

  const completedCheckpointIds = [...current.completedCheckpointIds, checkpoint.id]
  const completed = completedCheckpointIds.length === quest.checkpointOrder.length
  const next: QuestRunProgress = {
    ...current,
    phase: 'feedback',
    completedCheckpointIds,
    completedAtByCheckpoint: { ...current.completedAtByCheckpoint, [checkpoint.id]: now },
    ...(completed ? { completedAt: now } : {}),
  }
  return { ...state, quests: { ...state.quests, [quest.id]: next } }
}

export function questRewardTotal(state: QuestProgressState) {
  return Object.entries(state.quests).reduce((total, [questId, run]) => {
    const quest = getQuest(questId)
    if (!quest) return total
    return run.completedCheckpointIds.reduce((sum, checkpointId) => {
      const reward = quest.checkpoints.find(item => item.id === checkpointId)?.reward
      return { xp: sum.xp + (reward?.xp ?? 0), coins: sum.coins + (reward?.coins ?? 0) }
    }, total)
  }, { xp: 0, coins: 0 })
}

