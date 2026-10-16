import { useEffect, useRef, useState } from 'react'
import { type Destination } from './data/destinations'
import LandmarkArt from './LandmarkArt'
import DestinationGallery from './DestinationGallery'
import { visitInfo } from './data/visitInfo'
import { useLiveVisitInfo } from './lib/useLiveVisitInfo'

type Drag = { pointerId: number; startX: number; startY: number; gallery: boolean; height: number; full: number; lastY: number; lastTime: number; velocity: number; moved: boolean }

export default function DestinationSheet({ place, onClose }: { place: Destination; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const ignoreClick = useRef(false)
  const fallbackInfo = visitInfo[place.id]
  const { info, loading } = useLiveVisitInfo(place, fallbackInfo)
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    if (closing) return
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setVisible(true))
    })
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second) }
  }, [closing])

  useEffect(() => {
    if (!closing) return
    // Also finish dismissal if reduced motion is enabled or transitionend is interrupted.
    const timer = window.setTimeout(onClose, 340)
    return () => window.clearTimeout(timer)
  }, [closing, onClose])

  function close() {
    drag.current = null
    setHeight(null)
    setClosing(true)
    setVisible(false)
  }

  function cancelDrag() {
    drag.current = null
    setHeight(null)
    ignoreClick.current = true
  }

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (closing || drag.current || event.button !== 0 || target.closest('a, button')) return
    // Expanded content scrolls normally; the header remains the drag handle.
    if (expanded && !target.closest('.sheet-drag-zone')) return
    const rect = panel.current!.getBoundingClientRect()
    drag.current = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, height: rect.height,
      gallery: !!target.closest('.gallery-track'),
      full: panel.current!.parentElement!.clientHeight,
      lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, moved: false,
    }
    ignoreClick.current = false
    setVisible(true)
    if (!drag.current.gallery) {
      setHeight(rect.height)
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const delta = event.clientY - current.startY
    // Let horizontal swipes scroll the gallery; vertical swipes still lift the sheet.
    if (current.gallery && !current.moved) {
      const across = Math.abs(event.clientX - current.startX)
      if (across > 6 && across >= Math.abs(delta)) { drag.current = null; return }
      if (Math.abs(delta) < 6) return
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
    current.moved ||= Math.abs(delta) > 6
    const elapsed = event.timeStamp - current.lastTime
    if (elapsed >= 8) current.velocity = (event.clientY - current.lastY) / elapsed
    current.lastY = event.clientY
    current.lastTime = event.timeStamp
    // No easing while held: the panel's top follows the pointer one-for-one.
    setHeight(Math.max(0, Math.min(current.full, current.height - delta)))
  }

  function pointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const delta = event.clientY - current.startY
    ignoreClick.current = current.moved || Math.abs(delta) > 6
    const remaining = Math.max(0, Math.min(current.full, current.height - delta))
    const peek = Math.min(300, current.full * .44)
    const velocity = event.timeStamp - current.lastTime < 100 ? current.velocity : 0
    const projected = remaining - Math.max(-120, Math.min(120, velocity * 120))
    drag.current = null
    setHeight(null)
    if (!ignoreClick.current) return
    // An intentional upward swipe from the preview always opens the whole sheet,
    // even when it starts on the picture or the user pauses before releasing.
    if (!expanded && delta <= -24) setExpanded(true)
    else if (remaining < peek * .35 || projected < peek / 2) close()
    else if (projected > (peek + current.full) / 2) setExpanded(true)
    else setExpanded(false)
  }

  return <div ref={panel} className={`destination-sheet gesture-sheet ${visible ? 'open' : ''} ${expanded ? 'expanded' : ''} ${height !== null ? 'dragging' : ''}`}
    role="region" aria-label={`Thông tin ${place.name}`} onKeyDown={event => { if (event.key === 'Escape') close() }}
    onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
    onPointerCancel={cancelDrag} onLostPointerCapture={() => { if (drag.current) cancelDrag() }}
    style={height !== null ? { height: `${height}px` } : undefined}
    onTransitionEnd={event => { if (closing && event.target === event.currentTarget && event.propertyName === 'height') onClose() }}>
    <div className="sheet-drag-zone" tabIndex={0} aria-label="Kéo để điều chỉnh thẻ. Phím mũi tên lên để mở hết, xuống để thu lại." onKeyDown={event => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setExpanded(event.key === 'ArrowUp') }
    }}>
      <div className="sheet-grab" aria-hidden="true"><span className="sheet-handle" /></div>
      <div className="sheet-header">
        <div className="sheet-thumbnail" aria-hidden="true"><LandmarkArt id={place.id}/></div>
        <div><h2>{place.name}</h2></div>
        <button type="button" className="sheet-close" aria-label="Đóng thông tin điểm đến" onClick={close}>×</button>
      </div>
    </div>
    <div className="sheet-body" id="destination-sheet-details">
      <DestinationGallery key={place.id} place={place}/>
      <section className="sheet-detail-group visit-section"><h3>Tổng quan</h3><p>{place.description}</p><p>{place.detail}</p></section>
      <section className="sheet-detail-group visit-section"><h3>Gợi ý hoạt động</h3><ul>{place.suggestedActivities.map(activity => <li key={activity}>{activity}</li>)}</ul></section>
      <section className="sheet-detail-group visit-section"><h3>Giờ mở cửa</h3><p className="visit-hours">{info?.hours ?? 'Chưa có thông tin giờ mở cửa'}</p><p>{info?.hoursNote}</p>
        {info?.live && <p className="visit-live-state"><span className={info.openNow ? 'open' : 'closed'}>{info.openNow ? 'Đang mở cửa' : 'Đang đóng cửa'}</span><span>Cập nhật từ Google Places {info.checkedOn ? `· ${info.checkedOn}` : ''}</span></p>}
        {!info?.live && loading && <p className="crowd-note">Đang cập nhật thông tin mới nhất…</p>}
      </section>
      <section className="sheet-detail-group visit-section crowd-section"><h3>Thời gian đông đúc</h3><div className="crowd-chart" aria-label="Biểu đồ thời gian đông đúc chưa có dữ liệu">{Array.from({ length: 12 }, (_, index) => <span key={index} className="crowd-bar unavailable" style={{ height: `${18 + (index % 4) * 7}%` }} />)}</div><div className="crowd-axis"><span>6:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div><span className="crowd-status">Chưa có dữ liệu thời gian thực</span><p className="crowd-note">Google Places hiện chưa cung cấp dữ liệu giờ đông qua API. Biểu đồ sẽ tự cập nhật khi hệ thống có nguồn dữ liệu hợp lệ.</p></section>
    </div>
    <div className="sheet-actions">
      <a className="primary-button" href={`#/dia-diem/${place.id}`}>Bắt đầu khám phá</a>
    </div>
  </div>
}
