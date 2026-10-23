import { getQuest } from './data/quests'
import { useQuestProgress } from './lib/useQuestProgress'

export default function QuestDetailsPage({ id }: { id: string }) {
  const quest = getQuest(id)
  const { state, dispatch } = useQuestProgress()
  if (!quest) return <main className="quest-page"><h1>Không tìm thấy quest</h1><a href="#/kham-pha">← Bản đồ</a></main>
  const progress = state.quests[id]
  const finished = progress?.completedCheckpointIds.length ?? 0
  const start = () => {
    if (dispatch({ type: 'start', questId: id })) window.location.hash = `#/quest/${id}/chi-duong`
  }

  return <main className="quest-page quest-experience">
    <nav className="quest-nav"><a href="#/kham-pha">← Bản đồ</a><span className="quest-badge">Quest mẫu</span></nav>
    <header className="quest-intro">
      <p className="eyebrow">ĐẠI HỌC KINH TẾ · ĐẠI HỌC ĐÀ NẴNG</p>
      <h1>{quest.title}</h1>
      <p>{quest.summary}</p>
      <div className="quest-meta"><span>◷ {quest.estimatedMinutes} phút</span><span>◎ {quest.checkpoints.length} nhiệm vụ</span><span>⌖ {quest.area}</span></div>
    </header>
    <section className="quest-panel">
      <h2>Hành trình của bạn</h2>
      <ol className="checkpoint-preview">{quest.checkpoints.map((checkpoint, index) => <li key={checkpoint.id}><span>{index + 1}</span><div><strong>{checkpoint.title}</strong><p>{checkpoint.placeLabel}</p></div></li>)}</ol>
    </section>
    <aside className="travel-tip"><strong>Đi an toàn</strong><p>{quest.safetyNote}</p></aside>
    <button type="button" className="primary-button quest-start" onClick={start}>{progress ? `Tiếp tục hành trình · ${finished}/${quest.checkpoints.length}` : 'Chỉ đường đến điểm bắt đầu'} →</button>
  </main>
}

