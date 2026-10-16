import { useEffect, useState } from 'react'
import { isCorruptStateError, newState, type ProgressAction } from './progress'
import { loadProgress, resetProgressData, saveAction } from './storage'

export function useProgress() {
  const [state, setState] = useState(newState)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [corrupt, setCorrupt] = useState(false)
  useEffect(() => {
    let active = true
    const load = () => loadProgress().then(value => { if (active) { setState(value); setError(''); setCorrupt(false); setLoading(false) } }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : 'Không đọc được tiến độ. Kiểm tra kết nối và tải lại; dữ liệu cũ chưa bị ghi đè.'); setCorrupt(isCorruptStateError(cause)); setLoading(false) } })
    void load()
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dana-quest-updates') : null
    if (channel) channel.onmessage = () => { void load() }
    window.addEventListener('focus', load)
    return () => { active = false; channel?.close(); window.removeEventListener('focus', load) }
  }, [])
  async function dispatch(action: ProgressAction) {
    setBusy(true)
    try {
      const value = await saveAction(action)
      setState(value); setError(''); setCorrupt(false)
      if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel('dana-quest-updates'); channel.postMessage('updated'); channel.close() }
      return true
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không lưu được thay đổi.'); setCorrupt(isCorruptStateError(cause)); return false }
    finally { setBusy(false) }
  }
  // Đặt lại tiến độ khi dữ liệu đã lưu bị hỏng. Bản sao dữ liệu hỏng được giữ
  // lại để có thể khôi phục thủ công; ảnh đã lưu không bị xóa.
  async function resetProgress() {
    setBusy(true)
    try {
      const value = await resetProgressData()
      setState(value); setError(''); setCorrupt(false)
      if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel('dana-quest-updates'); channel.postMessage('updated'); channel.close() }
      return true
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không đặt lại được tiến độ.'); return false }
    finally { setBusy(false) }
  }
  return { state, loading, busy, error, corrupt, dispatch, resetProgress }
}
