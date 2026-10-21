import NavigationPage, { type NavigationTarget } from './NavigationPage'
import { getQuest } from './data/quests'

export default function QuestNavigationPage({ id }: { id: string }) {
  const quest = getQuest(id)
  if (!quest) return <main className="screen-page"><h1>Không tìm thấy quest</h1><a href="#/kham-pha">← Bản đồ</a></main>
  const target: NavigationTarget = {
    id: quest.id,
    name: quest.area,
    position: quest.startPosition,
    backHref: `#/quest/${quest.id}`,
    continueHref: `#/quest/${quest.id}/choi`,
    continueLabel: 'Mở nhiệm vụ đầu tiên',
    requireArrival: true,
  }
  return <NavigationPage id={quest.id} target={target} />
}
