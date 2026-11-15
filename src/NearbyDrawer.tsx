import { t } from './i18n/locale'
import { useRef, useState, type ReactNode } from 'react'
import './NearbyDrawer.css'

export default function NearbyDrawer({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const [height, setHeight] = useState<number | null>(null)
  const panel = useRef<HTMLElement>(null)
  const drag = useRef<{ y: number; height: number; max: number; pointer: number } | null>(null)
  const moved = useRef(false)
  return <section ref={panel} className={`destination-dock nearby-drawer ${expanded ? 'drawer-open' : ''} ${height !== null ? 'drawer-dragging' : ''}`} style={height !== null ? { height } : undefined} aria-label={t("Gợi ý địa điểm")}>
    <button className="nearby-handle" aria-expanded={expanded} aria-controls="nearby-content"
      onClick={() => { if (!moved.current) setExpanded(value => !value) }}
      onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setExpanded(event.key === 'ArrowUp') } }}
      onPointerDown={event => {
        if (event.button !== 0 || drag.current) return
        moved.current = false
        drag.current = { y: event.clientY, height: panel.current!.getBoundingClientRect().height, max: panel.current!.parentElement!.clientHeight * .65, pointer: event.pointerId }
        event.currentTarget.setPointerCapture?.(event.pointerId)
      }}
      onPointerMove={event => { const start = drag.current; if (!start || start.pointer !== event.pointerId) return; const delta = start.y - event.clientY; if (Math.abs(delta) > 5) moved.current = true; if (moved.current) setHeight(Math.max(54, Math.min(start.max, start.height + delta))) }}
      onPointerUp={event => { const start = drag.current; if (!start || start.pointer !== event.pointerId) return; if (moved.current) setExpanded(start.y - event.clientY > 0); drag.current = null; setHeight(null) }}
      onPointerCancel={() => { drag.current = null; moved.current = true; setHeight(null) }}>
      <span className="sheet-handle" aria-hidden="true"/><span>{t("NỔI BẬT TRONG KHU VỰC")}</span>
    </button>
    <div id="nearby-content" className="nearby-content" hidden={!expanded && height === null}>{children}</div>
  </section>
}
