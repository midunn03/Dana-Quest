import { getDestination } from './data/destinations'
import { useProgress } from './lib/useProgress'

export default function ActiveMissionIndicator() {
  const { state, loading } = useProgress()
  if (loading) return null
  const active = Object.entries(state.destinations).find(([, progress]) => progress.started && progress.completed.length < progress.selected.length)
  if (!active) return null
  const [destinationId, progress] = active
  const place = getDestination(destinationId)
  if (!place) return null
  return <a className="active-mission-indicator" href={`#/nhiem-vu/${destinationId}`} aria-label={`Nhiệm vụ đang làm tại ${place.name}`} title={`Tiếp tục nhiệm vụ tại ${place.name}`}><span aria-hidden="true">!</span><small>{progress.completed.length}/{progress.selected.length}</small></a>
}
