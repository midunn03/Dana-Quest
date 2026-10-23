import { useRef, useState } from 'react'
import type { AdminPhoto } from './lib/placeContent'

/** Bộ ảnh do admin tự tải lên cho địa điểm (vuốt ngang hoặc bấm mũi tên). */
export default function AdminGallery({ name, photos }: { name: string; photos: AdminPhoto[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  if (photos.length === 0) return null
  const goTo = (next: number) => {
    const target = Math.max(0, Math.min(photos.length - 1, next))
    track.current?.scrollTo({ left: target * track.current.clientWidth, behavior: 'smooth' })
  }
  return <section className="destination-gallery admin-gallery" aria-label={`Ảnh ${name}`}>
    <div className="gallery-frame">
      <div className="gallery-track" ref={track} tabIndex={0} aria-label="Vuốt ngang để xem ảnh"
        onScroll={event => { const el = event.currentTarget; if (el.clientWidth) setIndex(Math.max(0, Math.min(photos.length - 1, Math.round(el.scrollLeft / el.clientWidth)))) }}>
        {photos.map((photo, position) => <figure className="gallery-slide" key={photo.url}>
          <img className="admin-photo" src={photo.url} alt={photo.caption || `${name} (${position + 1}/${photos.length})`} draggable={false} />
          {(photo.caption || photo.credit) && <figcaption>{photo.caption}{photo.caption && photo.credit ? ' · ' : ''}{photo.credit && `Ảnh: ${photo.credit}`}</figcaption>}
        </figure>)}
      </div>
      {photos.length > 1 && <>
        <span className="gallery-counter" aria-live="polite">{index + 1}/{photos.length}</span>
        <button className="gallery-arrow previous" type="button" aria-label="Ảnh trước" disabled={index === 0} onClick={() => goTo(index - 1)}>‹</button>
        <button className="gallery-arrow next" type="button" aria-label="Ảnh tiếp theo" disabled={index === photos.length - 1} onClick={() => goTo(index + 1)}>›</button>
      </>}
    </div>
  </section>
}
