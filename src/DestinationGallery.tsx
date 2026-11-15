import { interpolate } from './i18n/locale'
import { t } from './i18n/locale'
import { useRef, useState } from 'react'
import type { Destination } from './data/destinations'
import LandmarkArt from './LandmarkArt'

const scenes = [
  { key: 'day', label: t("Ban ngày") },
  { key: 'sunset', label: t("Hoàng hôn") },
  { key: 'night', label: t("Đêm bên thành phố") },
] as const

export default function DestinationGallery({ place }: { place: Destination }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const mouse = useRef<{ id: number; x: number; y: number; left: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)
  function goTo(next: number) {
    const target = Math.max(0, Math.min(scenes.length - 1, next))
    track.current?.scrollTo({ left: target * track.current.clientWidth, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  function finishMouse() {
    const moved = mouse.current?.moved
    mouse.current = null
    setDragging(false)
    if (moved && track.current?.clientWidth) goTo(Math.round(track.current.scrollLeft / track.current.clientWidth))
  }
  return <section className="destination-gallery" aria-label={interpolate("Bộ ảnh minh họa ${0}",[place.name])}>
    <div className="gallery-frame">
      <div className={`gallery-track ${dragging ? 'is-dragging' : ''}`} ref={track} tabIndex={0} aria-label={t("Vuốt ngang để xem ảnh")}
        onDragStart={event => event.preventDefault()}
        onPointerDown={event => { if (event.pointerType === 'mouse' && event.button === 0) mouse.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, moved: false } }}
        onPointerMove={event => {
          const start = mouse.current
          if (!start || start.id !== event.pointerId) return
          const dx = event.clientX - start.x
          if (!start.moved && (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY - start.y))) return
          start.moved = true
          setDragging(true)
          event.currentTarget.setPointerCapture?.(event.pointerId)
          event.currentTarget.scrollLeft = start.left - dx
          event.preventDefault()
        }}
        onPointerUp={finishMouse} onPointerCancel={finishMouse} onLostPointerCapture={finishMouse}
        onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); goTo(index + (event.key === 'ArrowRight' ? 1 : -1)) } }}
        onScroll={event => { const el = event.currentTarget; if (el.clientWidth) setIndex(Math.max(0, Math.min(2, Math.round(el.scrollLeft / el.clientWidth)))) }}>
        {scenes.map((scene, position) => <figure className="gallery-slide" key={scene.key} role="img" aria-label={interpolate("${0} – ${1} (minh họa ${2}/3)",[place.name,scene.label,position + 1])}>
          <LandmarkArt id={place.id} scene={scene.key}/><figcaption>{scene.label} {" " + t("· Hình minh họa")}</figcaption>
        </figure>)}
      </div>
      <span className="gallery-counter" aria-live="polite">{index + 1}/3</span>
      <button className="gallery-arrow previous" type="button" aria-label={t("Ảnh trước")} disabled={index === 0} onClick={() => goTo(index - 1)}>‹</button>
      <button className="gallery-arrow next" type="button" aria-label={t("Ảnh tiếp theo")} disabled={index === 2} onClick={() => goTo(index + 1)}>›</button>
    </div>
    <div className="gallery-dots" role="group" aria-label={t("Chọn ảnh minh họa")}>{scenes.map((scene, position) => <button type="button" key={scene.key} aria-label={interpolate("Xem ảnh ${0}: ${1}",[position + 1,scene.label])} aria-pressed={index === position} onClick={() => goTo(position)}><span/></button>)}</div>
  </section>
}
