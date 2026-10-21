import { getQuest, type QuestChallenge } from '../data/quests'
import { newState, readState, type ProgressState } from './progress'

export interface QuestRunProgress {
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
  | { type: 'start'; questId: string; now?: number }
  | { type: 'complete-checkpoint'; questId: string; checkpointId: string; answer?: string; photoAvailable?: boolean; now?: number }

export const newQuestState = (legacy = newState()): QuestProgressState => ({
  version: 2,
  legacy,
  quests: {},
})

const normalizeAnswer = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('vi')

function isAnswerCorrect(challenge: QuestChallenge, answer?: string, photoAvailable = false) {
  if (challenge.type === 'photo') return photoAvailable
  if (challenge.type === 'observation') return answer === 'confirmed'
  if (!answer) return false
  if (challenge.type === 'single-choice') return answer === challenge.correctOptionId
  const normalized = normalizeAnswer(answer)
  return challenge.acceptedAnswers.some(item => normalizeAnswer(item) === normalized)
}

function validateQuestRun(questId: string, run: QuestRunProgress) {
  const quest = getQuest(questId)
  if (!quest || !run || !Number.isFinite(run.startedAt) || !Array.isArray(run.completedCheckpointIds)) throw new Error('Tiến trình quest không hợp lệ.')
  const completed = run.completedCheckpointIds
  if (new Set(completed).size !== completed.length || completed.some((id, index) => quest.checkpointOrder[index] !== id)) throw new Error('Thứ tự checkpoint không hợp lệ.')
  if (!run.completedAtByCheckpoint || Object.keys(run.completedAtByCheckpoint).some(id => !completed.includes(id)) || completed.some(id => !Number.isFinite(run.completedAtByCheckpoint[id]))) throw new Error('Thời điểm hoàn thành checkpoint không hợp lệ.')
  const isComplete = completed.length === quest.checkpointOrder.length
  if ((run.completedAt !== undefined) !== isComplete || (run.completedAt !== undefined && !Number.isFinite(run.completedAt))) throw new Error('Trạng thái hoàn thành quest không hợp lệ.')
}

export function migrateQuestState(value: unknown): QuestProgressState {
  if (value === undefined) return newQuestState()
  const candidate = value as { version?: number; legacy?: unknown; quests?: unknown }
  if (candidate?.version === 1) return newQuestState(readState(value))
  if (candidate?.version !== 2 || !candidate.quests || typeof candidate.quests !== 'object' || Array.isArray(candidate.quests)) throw new Error('Dữ liệu quest không hợp lệ.')
  const state: QuestProgressState = {
    version: 2,
    legacy: readState(candidate.legacy),
    quests: candidate.quests as Record<string, QuestRunProgress>,
  }
  Object.entries(state.quests).forEach(([questId, run]) => validateQuestRun(questId, run))
  return state
}

export function updateQuestProgress(state: QuestProgressState, action: QuestProgressAction): QuestProgressState {
  const quest = getQuest(action.questId)
  if (!quest) throw new Error('Không tìm thấy quest.')
  const current = state.quests[quest.id]
  const now = action.now ?? Date.now()
  if (!Number.isFinite(now)) throw new Error('Thời điểm cập nhật không hợp lệ.')

  if (action.type === 'start') {
    if (current) return state
    return {
      ...state,
      quests: { ...state.quests, [quest.id]: { startedAt: now, completedCheckpointIds: [], completedAtByCheckpoint: {} } },
    }
  }

  if (!current) throw new Error('Quest chưa được bắt đầu.')
  if (current.completedCheckpointIds.includes(action.checkpointId)) return state
  const expectedId = quest.checkpointOrder[current.completedCheckpointIds.length]
  if (action.checkpointId !== expectedId) throw new Error('Hãy hoàn thành checkpoint theo đúng thứ tự.')
  const checkpoint = quest.checkpoints.find(item => item.id === action.checkpointId)
  if (!checkpoint || !isAnswerCorrect(checkpoint.challenge, action.answer, action.photoAvailable)) throw new Error('Câu trả lời hoặc minh chứng chưa chính xác.')

  const completedCheckpointIds = [...current.completedCheckpointIds, checkpoint.id]
  const completed = completedCheckpointIds.length === quest.checkpointOrder.length
  const next: QuestRunProgress = {
    ...current,
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

