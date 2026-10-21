import { getDestination } from './data/destinations'
import { useProgress } from './lib/useProgress'
import { quests } from './data/quests'
import { useQuestProgress } from './lib/useQuestProgress'

export default function ActiveMissionIndicator() {
  const { state, loading } = useProgress()
  const { state: questState } = useQuestProgress()
  const activeQuest = quests.find(quest => {
    const run = questState.quests[quest.id]
    return run && !run.completedAt
  })
  if (activeQuest) {
    const run = questState.quests[activeQuest.id]
    return <a className="active-mission-indicator active-quest-indicator" href={`#/quest/${activeQuest.id}/choi`} aria-label={`Tiếp tục quest ${activeQuest.title}`} title={`Tiếp tục ${activeQuest.title}`}><span aria-hidden="true">★</span><small>{run.completedCheckpointIds.length}/{activeQuest.checkpoints.length}</small></a>
  }
  if (loading) return null
  const active = Object.entries(state.destinations).find(([, progress]) => progress.started && progress.completed.length < progress.selected.length)
  if (!active) return null
  const [destinationId, progress] = active
  const place = getDestination(destinationId)
  if (!place) return null
  return <a className="active-mission-indicator" href={`#/nhiem-vu/${destinationId}`} aria-label={`Nhiệm vụ đang làm tại ${place.name}`} title={`Tiếp tục nhiệm vụ tại ${place.name}`}><span aria-hidden="true">!</span><small>{progress.completed.length}/{progress.selected.length}</small></a>
}
