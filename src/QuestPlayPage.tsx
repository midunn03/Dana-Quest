import { useState } from 'react'
import { getQuest, type QuestChallenge } from './data/quests'
import { questRewardTotal } from './lib/questProgress'
import { useQuestProgress } from './lib/useQuestProgress'

function ChallengeInput({ challenge, answer, setAnswer }: { challenge: QuestChallenge; answer: string; setAnswer: (value: string) => void }) {
  if (challenge.type === 'single-choice') return <fieldset className="choice-list"><legend>{challenge.prompt}</legend>{challenge.options.map(option => <label key={option.id}><input type="radio" name="quest-answer" value={option.id} checked={answer === option.id} onChange={() => setAnswer(option.id)} />{option.label}</label>)}</fieldset>
  if (challenge.type === 'observation') return <label className="confirm-answer"><input type="checkbox" checked={answer === 'confirmed'} onChange={event => setAnswer(event.target.checked ? 'confirmed' : '')} />{challenge.confirmationLabel}</label>
  if (challenge.type === 'photo') return <p className="notice">Chức năng ảnh sẽ được nối với camera ở phần sau.</p>
  return <label className="text-answer">{challenge.prompt}<input value={answer} onChange={event => setAnswer(event.target.value)} placeholder={challenge.placeholder} autoComplete="off" /></label>
}

export default function QuestPlayPage({ id }: { id: string }) {
  const quest = getQuest(id)
  const { state, error, dispatch } = useQuestProgress()
  const [answer, setAnswer] = useState('')
  if (!quest) return <main className="quest-page"><h1>Không tìm thấy quest</h1><a href="#/kham-pha">← Bản đồ</a></main>
  const progress = state.quests[id]
  if (!progress) {
    return <main className="quest-page quest-experience"><h1>Quest chưa bắt đầu</h1><p>Hãy xem thông tin và bắt đầu quest trước khi mở nhiệm vụ.</p><a className="primary-button quest-start" href={`#/quest/${id}`}>Mở thông tin quest</a></main>
  }
  const index = progress.completedCheckpointIds.length
  const checkpoint = quest.checkpoints[index]
  const totals = questRewardTotal(state)

  if (!checkpoint) return <main className="quest-page quest-experience quest-finished">
    <p className="eyebrow">HOÀN THÀNH</p><h1>{quest.title}</h1><p>Bạn đã giải xong cả hai nhiệm vụ của quest mẫu.</p>
    <div className="quest-meta"><span>★ {totals.xp} XP</span><span>● {totals.coins} xu quest</span></div>
    <a className="primary-button quest-start" href="#/kham-pha">Trở lại bản đồ</a>
  </main>

  const submit = () => {
    if (dispatch({ type: 'complete-checkpoint', questId: id, checkpointId: checkpoint.id, answer })) setAnswer('')
  }
  return <main className="quest-page quest-experience">
    <nav className="quest-nav"><a href={`#/quest/${id}`}>← Thông tin quest</a><span>{index + 1}/{quest.checkpoints.length}</span></nav>
    <progress max={quest.checkpoints.length} value={index} aria-label={`Đã hoàn thành ${index} trên ${quest.checkpoints.length} nhiệm vụ`} />
    <section className="quest-panel checkpoint-card">
      <p className="eyebrow">NHIỆM VỤ {index + 1}</p><h1>{checkpoint.title}</h1><p className="checkpoint-story">{checkpoint.story}</p>
      <div className="checkpoint-place">⌖ {checkpoint.placeLabel}</div><p>{checkpoint.instruction}</p>
      <ChallengeInput challenge={checkpoint.challenge} answer={answer} setAnswer={setAnswer} />
      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="primary-button quest-start" onClick={submit} disabled={!answer}>Kiểm tra đáp án</button>
    </section>
  </main>
}

