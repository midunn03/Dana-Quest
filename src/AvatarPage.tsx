import { useState } from 'react'
import { avatars, readAvatar, saveAvatar } from './lib/avatar'
import PixelAvatar from './PixelAvatar'
import './Onboarding.css'
export default function AvatarPage({ initialAvatarId, onAvatarConfirmed, editing = false }: { initialAvatarId?: string | null; onAvatarConfirmed?: (id: string) => Promise<void>; editing?: boolean }) {
  const [selected, setSelected] = useState(() => avatars.find(item => item.id === initialAvatarId) ?? readAvatar() ?? avatars[0])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  function step(direction: number) { setSelected(avatars[(avatars.findIndex(item => item.id === selected.id) + direction + avatars.length) % avatars.length]) }
  async function confirm() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      if (onAvatarConfirmed) await onAvatarConfirmed(selected.id)
      else saveAvatar(selected.id)
      window.location.hash = editing ? '#/tai-khoan' : '#/kham-pha'
    }
    catch { setError('Chưa lưu được nhân vật. Hãy kiểm tra kết nối và thử lại. Lựa chọn trước vẫn được giữ.') }
    finally { setSaving(false) }
  }
  return <main className="onboarding avatar-screen"><section className="avatar-card" aria-labelledby="avatar-title">
    <a href={editing ? '#/tai-khoan' : '#/kham-pha'} className="avatar-back">{editing ? '← Tài khoản' : '← Khám phá'}</a><span className="game-kicker">SẴN SÀNG LÊN ĐƯỜNG</span>
    <h1 id="avatar-title">Chọn nhân vật</h1><p>Đồng hành cùng bạn khám phá<br />Đà Nẵng theo cách riêng.</p>
    <div className="avatar-stage"><button aria-label="Nhân vật trước" onClick={() => step(-1)}>‹</button><div className="avatar-spotlight"><span className="pixel-spark spark-one" aria-hidden="true">✦</span><PixelAvatar avatar={selected} /><span className="pixel-spark spark-two" aria-hidden="true">✦</span></div><button aria-label="Nhân vật tiếp theo" onClick={() => step(1)}>›</button></div>
    <div className="avatar-caption" aria-live="polite"><h2>{selected.name}</h2><p>{selected.note}</p></div>
    <div className="avatar-options" role="group" aria-label="Các nhân vật">{avatars.map(avatar => <button key={avatar.id} aria-label={avatar.name} aria-pressed={selected.id === avatar.id} onClick={() => setSelected(avatar)}><PixelAvatar avatar={avatar} />{selected.id === avatar.id && <span className="avatar-check" aria-hidden="true">✓</span>}</button>)}</div>
    {error && <p role="alert" className="error">{error}</p>}
    <button className="game-button" disabled={saving} onClick={() => void confirm()}>{saving ? 'Đang lưu…' : editing ? 'Lưu nhân vật' : 'Xác nhận nhân vật'} <span aria-hidden="true">→</span></button><p className="avatar-hint">Đổi nhân vật không làm mất tiến độ, ảnh hay xu của bạn.</p>
  </section></main>
}
