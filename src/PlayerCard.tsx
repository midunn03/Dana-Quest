import { useProgress } from './lib/useProgress'
import { coinBalance } from './lib/progress'
import { useEffect, useState } from 'react'
import { readAvatar } from './lib/avatar'
import PixelAvatar from './PixelAvatar'
import './Onboarding.css'
export default function PlayerCard() {
  const { state, loading } = useProgress()
  const [avatar, setAvatar] = useState(readAvatar)
  useEffect(() => {
    const refresh = () => setAvatar(readAvatar())
    window.addEventListener('storage', refresh)
    window.addEventListener('dana-avatar-changed', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('dana-avatar-changed', refresh) }
  }, [])
  return <div className="player-card" aria-label="Nhân vật của bạn">{avatar && <PixelAvatar avatar={avatar} />}<div><span>NHÀ KHÁM PHÁ</span><strong>{avatar?.name ?? 'Chào bạn, sẵn sàng khám phá?'}</strong></div><span className="player-coins" aria-label="Xu demo">● {loading ? '…' : coinBalance(state)}</span><a href="#/nhan-vat">{avatar ? 'Đổi nhân vật' : 'Chọn nhân vật'}</a></div>
}

