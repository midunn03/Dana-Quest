import { coinBalance } from './lib/progress'
import { useProgress } from './lib/useProgress'

export default function QuestLinks() {
  const { state, loading, error } = useProgress()
  return <nav className="quest-links" aria-label="Tiện ích hành trình">
    <a href="#/kham-pha">Bản đồ</a><a href="#/album">Album ảnh</a><a href="#/cua-hang">Cửa hàng demo</a>
    <span>{loading ? 'Đang đọc xu…' : error ? 'Chưa đọc được số xu' : `${coinBalance(state)} Green Coins (demo)`}</span>
  </nav>
}
