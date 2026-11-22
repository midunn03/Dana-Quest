import { useRef, useState, type CSSProperties } from 'react'
import { quests } from './data/quests'
import { getDestination } from './data/destinations'
import { t } from './i18n/locale'
import CoastalScene from './CoastalScene'
import './HomeQuestCarousel.css'

export default function HomeQuestCarousel() {
  const [active, setActive] = useState(0)
  const touchStart = useRef<number | null>(null)
  const move = (direction: number) => setActive(current => (current + direction + quests.length) % quests.length)
  return <div className="home-quest-carousel" role="region" aria-roledescription="carousel" aria-label={t('Lựa chọn quest', 'Choose a quest')} onKeyDown={event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1) }
  }}>
    <div className="home-quest-slides" onTouchStart={event => { touchStart.current = event.changedTouches[0].clientX }} onTouchEnd={event => {
      if (touchStart.current === null) return
      const distance = event.changedTouches[0].clientX - touchStart.current
      if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1)
      touchStart.current = null
    }}>
      {quests.map((quest, index) => {
        const offset = ((index - active + quests.length + Math.floor(quests.length / 2)) % quests.length) - Math.floor(quests.length / 2)
        const destination = getDestination(quest.id)
        return <a key={quest.id} className="home-quest-card home-quest-slide" href={`#/quest/${quest.id}`} data-active={offset === 0} aria-current={offset === 0 ? 'true' : undefined} aria-hidden={Math.abs(offset) > 1 ? true : undefined} tabIndex={offset === 0 ? 0 : -1} style={{ '--quest-offset': offset, '--quest-scale': offset === 0 ? 1 : .88, '--quest-opacity': offset === 0 ? 1 : Math.abs(offset) === 1 ? .48 : 0, zIndex: offset === 0 ? 3 : Math.abs(offset) === 1 ? 2 : 0, pointerEvents: Math.abs(offset) > 1 ? 'none' : undefined } as CSSProperties}>
          <div className={`home-quest-art scene-${index}`}>{quest.id === 'due-dau-an-50-nam' ? <img src={`${import.meta.env.BASE_URL}art/home/due-campus-hd.png`} className="home-due-photo" alt="Trường Đại học Kinh tế – Đại học Đà Nẵng" loading="lazy" width="1200" height="675" /> : destination?.photo ? <img src={`${import.meta.env.BASE_URL}${destination.photo.replace(/^\//, '')}`} alt={quest.checkpoints[0].placeLabel} loading="lazy" width="1200" height="800" /> : <CoastalScene compact />}</div>
          <div className="home-quest-info"><small>{quest.area}</small><h3>{quest.title}</h3><p>{quest.summary}</p><div className="home-quest-meta"><span>{quest.estimatedMinutes} {t('phút', 'min')}</span><span>{quest.checkpoints.length} {t('điểm dừng', 'checkpoints')}</span></div></div>
        </a>
      })}
    </div>
    <div className="home-quest-controls"><button type="button" onClick={() => move(-1)} aria-label={t('Quest trước', 'Previous quest')}>←</button><span aria-live="polite" aria-atomic="true">{active + 1} / {quests.length}<span className="home-carousel-title">{quests[active].title}</span></span><button type="button" onClick={() => move(1)} aria-label={t('Quest tiếp theo', 'Next quest')}>→</button></div>
  </div>
}
