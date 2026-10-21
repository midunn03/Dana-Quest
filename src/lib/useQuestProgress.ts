import { useState } from 'react'
import { migrateQuestState, newQuestState, updateQuestProgress, type QuestProgressAction } from './questProgress'

const STORAGE_KEY = 'dana-quest-progress-v2'

function loadQuestProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? migrateQuestState(JSON.parse(saved)) : newQuestState()
  } catch {
    return newQuestState()
  }
}

export function useQuestProgress() {
  const [state, setState] = useState(loadQuestProgress)
  const [error, setError] = useState('')

  function dispatch(action: QuestProgressAction) {
    try {
      const next = updateQuestProgress(state, action)
      if (next !== state) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setState(next)
      setError('')
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được tiến trình quest.')
      return false
    }
  }

  return { state, error, dispatch }
}

