import { t } from './i18n/locale'
import NavigationPage, { type NavigationTarget } from './NavigationPage'
import { getQuest } from './data/quests'

export default function QuestNavigationPage({ id }: { id: string }) {
  const quest = getQuest(id)
  if (!quest) return <main className="screen-page"><h1>{t("Không tìm thấy quest")}</h1><a href="#/kham-pha">← {t("Bản đồ")}</a></main>
  const target: NavigationTarget = {
    id: quest.id,
    name: quest.area,
    position: quest.startPosition,
    backHref: `#/quest/${quest.id}/chi-duong`,
    continueHref: `#/quest/${quest.id}/chi-duong`,
    continueLabel: t("Mở xác nhận điểm bắt đầu"),
    requireArrival: true,
  }
  return <NavigationPage id={quest.id} target={target} />
}
