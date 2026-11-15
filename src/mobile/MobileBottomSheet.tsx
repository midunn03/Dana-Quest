import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { t } from '../i18n/locale'

export interface MobileBottomSheetProps {
  open?: boolean
  title?: string
  children: ReactNode
  onClose?: () => void
  initialHeightPercent?: number // e.g. 40, 75
}

export default function MobileBottomSheet({
  open = true,
  title,
  children,
  onClose,
  initialHeightPercent = 45,
}: MobileBottomSheetProps) {
  const [heightPercent, setHeightPercent] = useState(initialHeightPercent)
  const [dragging, setDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartPercent = useRef(heightPercent)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHeightPercent(initialHeightPercent)
  }, [initialHeightPercent])

  if (!open) return null

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY
    dragStartPercent.current = heightPercent
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const deltaY = dragStartY.current - e.clientY
    const windowH = window.innerHeight || 800
    const deltaPercent = (deltaY / windowH) * 100
    const nextPercent = Math.min(90, Math.max(15, dragStartPercent.current + deltaPercent))
    setHeightPercent(nextPercent)
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}

    // Snap points: 20% (peek), 50% (half), 85% (expanded), or close if < 15%
    if (heightPercent < 20 && onClose) {
      onClose()
    } else if (heightPercent < 35) {
      setHeightPercent(25)
    } else if (heightPercent < 70) {
      setHeightPercent(50)
    } else {
      setHeightPercent(85)
    }
  }

  return (
    <div
      ref={sheetRef}
      className={`device-mobile-bottom-sheet ${dragging ? 'dragging' : ''}`}
      style={{ height: `${heightPercent}vh` }}
      role="region"
      aria-label={title || t('Bảng thông tin di động', 'Mobile bottom sheet')}
    >
      <div
        className="device-mobile-sheet-grabber"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="device-mobile-sheet-handle" aria-hidden="true" />
      </div>
      {title && (
        <div className="device-mobile-sheet-header">
          <h3>{title}</h3>
          {onClose && (
            <button
              type="button"
              className="device-mobile-sheet-close"
              onClick={onClose}
              aria-label={t('Đóng', 'Close')}
            >
              ✕
            </button>
          )}
        </div>
      )}
      <div className="device-mobile-sheet-content">{children}</div>
    </div>
  )
}
