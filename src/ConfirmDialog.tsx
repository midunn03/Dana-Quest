import './ui/PixelUI.css'
import { t } from './i18n/locale'
import { useEffect, useRef } from 'react'
import './ConfirmDialog.css'

interface Props {
  open: boolean; title: string; message: string; confirmLabel: string
  cancelLabel?: string
  busyLabel?: string; busy?: boolean; tone?: 'danger' | 'primary'
  onCancel(): void; onConfirm(): void
}

export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = t("Hủy"), busyLabel = t("Đang xử lý…"), busy = false, tone = 'primary', onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open, busy, onCancel])
  if (!open) return null
  return <div className="confirm-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onCancel() }}>
    <section className="confirm-dialog px-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <span className={`confirm-symbol ${tone}`} aria-hidden="true">{tone === 'danger' ? '!' : '?'}</span>
      <h2 id="confirm-title">{title}</h2><p id="confirm-message">{message}</p>
      <div className="confirm-actions"><button ref={cancelRef} className="px-button px-button--secondary px-button--sm" type="button" disabled={busy} onClick={onCancel}>{cancelLabel}</button><button type="button" className={`confirm-action ${tone} px-button px-button--${tone} px-button--sm`} disabled={busy} onClick={onConfirm}>{busy ? busyLabel : confirmLabel}</button></div>
    </section>
  </div>
}
