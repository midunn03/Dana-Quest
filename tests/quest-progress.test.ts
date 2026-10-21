import { describe, expect, it } from 'vitest'
import { getQuest } from '../src/data/quests'
import { newState, updateProgress } from '../src/lib/progress'
import { migrateQuestState, newQuestState, questRewardTotal, updateQuestProgress } from '../src/lib/questProgress'

const questId = 'due-dau-an-50-nam'

describe('DUE demo quest data', () => {
  it('contains two ordered, distinct checkpoints with attributable sources', () => {
    const quest = getQuest(questId)!
    expect(quest.checkpoints).toHaveLength(2)
    expect(quest.checkpointOrder).toEqual(quest.checkpoints.map(item => item.id))
    expect(new Set(quest.checkpoints.map(item => item.challenge.type)).size).toBe(2)
    expect(quest.checkpoints.every(item => item.sourceUrls.every(url => url.startsWith('https://')))).toBe(true)
  })
})

describe('Quest progress version 2', () => {
  it('wraps version 1 without changing legacy progress', () => {
    const legacy = updateProgress(newState(), { type: 'assign', destinationId: 'cau-rong', count: 5 })
    const migrated = migrateQuestState(legacy)
    expect(migrated.version).toBe(2)
    expect(migrated.legacy).toEqual(legacy)
    expect(migrated.quests).toEqual({})
  })

  it('enforces order and evidence, then completes the two-checkpoint quest', () => {
    let state = updateQuestProgress(newQuestState(), { type: 'start', questId, now: 100 })
    expect(() => updateQuestProgress(state, { type: 'complete-checkpoint', questId, checkpointId: 'dau-moc-1975', answer: '1975', now: 200 })).toThrow('thứ tự')
    expect(() => updateQuestProgress(state, { type: 'complete-checkpoint', questId, checkpointId: 'cong-71', answer: '72', now: 200 })).toThrow('chưa chính xác')
    state = updateQuestProgress(state, { type: 'complete-checkpoint', questId, checkpointId: 'cong-71', answer: 'Số 71', now: 200 })
    state = updateQuestProgress(state, { type: 'complete-checkpoint', questId, checkpointId: 'dau-moc-1975', answer: '1975', now: 300 })
    expect(state.quests[questId].completedAt).toBe(300)
    expect(questRewardTotal(state)).toEqual({ xp: 120, coins: 20 })
  })

  it('is idempotent and never awards a checkpoint twice', () => {
    let state = updateQuestProgress(newQuestState(), { type: 'start', questId, now: 100 })
    state = updateQuestProgress(state, { type: 'complete-checkpoint', questId, checkpointId: 'cong-71', answer: '71', now: 200 })
    const repeated = updateQuestProgress(state, { type: 'complete-checkpoint', questId, checkpointId: 'cong-71', answer: '71', now: 250 })
    expect(repeated).toBe(state)
    expect(questRewardTotal(repeated)).toEqual({ xp: 50, coins: 10 })
  })

  it('rejects malformed version 2 data instead of overwriting it', () => {
    expect(() => migrateQuestState({ version: 2, legacy: newState(), quests: { [questId]: { startedAt: 1, completedCheckpointIds: ['dau-moc-1975'], completedAtByCheckpoint: { 'dau-moc-1975': 2 } } } })).toThrow('Thứ tự')
  })
})
