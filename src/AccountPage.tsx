import { useState } from 'react'
import type { AuthUser } from './lib/auth'
import { getDestination } from './data/destinations'
import { getMissions } from './data/missions'
import { useProgress } from './lib/useProgress'
import { coinBalance } from './lib/progress'
import { avatars } from './lib/avatar'
import { useAuth } from './AuthContext'
import PixelAvatar from './PixelAvatar'
import ConfirmDialog from './ConfirmDialog'
import { notify } from './lib/notifications'
import './Quest.css'
import './Account.css'
import InstallAppCard from './InstallAppCard'

function recordedDate(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? new Date(value).toLocaleString('vi-VN') : 'Ngày chưa được lưu'
}

export default function AccountPage({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  const auth = useAuth()
  const { state, loading, error, corrupt, resetProgress } = useProgress()
  const [logoutError, setLogoutError] = useState('')
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [emailInput, setEmailInput] = useState(user.email || '')
  const [phoneInput, setPhoneInput] = useState(user.phone || '')
  const [updateMsg, setUpdateMsg] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [saving, setSaving] = useState(false)
  const avatar = avatars.find(item => item.id === user.avatarId)

  const entries = Object.entries(state.destinations).flatMap(([destinationId, progress]) => {
    const place = getDestination(destinationId)
    if (!place) return []
    return progress.completed.map(missionId => ({
      place,
      progress,
      mission: getMissions(place).find(item => item.id === missionId),
      missionId,
      completedAt: progress.completedAt?.[missionId],
    })).filter(entry => !!entry.mission)
  })
  const visits = entries.filter(entry => entry.missionId === 'arrival')
  const activities = entries.filter(entry => entry.mission?.kind === 'self')

  async function logout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutError('')
    try { await onLogout(); setLogoutOpen(false); notify('Bạn đã đăng xuất an toàn.'); window.location.hash = '#/dang-nhap' }
    catch (error) { setLogoutError(error instanceof Error ? error.message : 'Chưa thể đăng xuất. Hãy thử lại.') }
    finally { setLoggingOut(false) }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setUpdateMsg('')
    setUpdateError('')
    try {
      await auth.updateProfile({ email: emailInput.trim(), phone: phoneInput.trim() })
      setUpdateMsg('Cập nhật thông tin thành công!')
      setShowEditProfile(false)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Cập nhật thất bại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="account-page screen-page" aria-labelledby="account-title">
      <header className="screen-heading">
        <h1 id="account-title">Tài khoản</h1>
        <button type="button" className="account-logout-btn" onClick={() => setLogoutOpen(true)}>
          Đăng xuất
        </button>
      </header>

      {/* Header Profile Card inspired by Grab/DanaQuest dashboard */}
      <section className="account-hero-card" aria-label="Thông tin nhân vật">
        <div className="account-hero-avatar">
          {avatar ? (
            <PixelAvatar avatar={avatar} />
          ) : (
            <div className="account-avatar-placeholder">👤</div>
          )}
        </div>
        <div className="account-hero-info">
          <h2>{user.name}</h2>
          <div className="account-hero-badge">
            <span className="badge-text">{avatar?.name ?? 'Chưa chọn nhân vật'}</span>
          </div>
          <p className="account-contact-summary">
            {user.phone ? `📱 ${user.phone}` : ''} {user.email ? `✉️ ${user.email}` : ''}
            {!user.phone && !user.email && 'Chưa cập nhật SĐT/Email'}
          </p>
        </div>
        <a href="#/nhan-vat" className="account-edit-avatar-link" aria-label="Đổi nhân vật" title="Đổi nhân vật">
          ›
        </a>
      </section>

      <section className="account-journey" aria-label="Hành trình của bạn">
        <span className="game-kicker">HÀNH TRÌNH CỦA BẠN</span>
        <h2>{entries.length ? 'Tiếp tục khám phá Đà Nẵng' : 'Điểm đến đầu tiên đang chờ'}</h2>
        <p>{entries.length ? `Bạn đã hoàn thành ${entries.length} nhiệm vụ tại ${visits.length} điểm đến. Cùng lưu thêm những kỷ niệm mới nhé.` : 'Chọn một địa điểm trên bản đồ, khám phá và hoàn thành nhiệm vụ để lưu dấu hành trình.'}</p>
        <a href="#/kham-pha">{entries.length ? 'Tiếp tục hành trình' : 'Khám phá bản đồ'} <span aria-hidden="true">→</span></a>
      </section>
      <InstallAppCard />

      {/* Quick stats summary */}
      <section className="account-stats-row" aria-label="Thống kê nhanh">
        <div className="stat-card">
          <span className="stat-value">{visits.length}</span>
          <span className="stat-label">Đã ghé</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{entries.length}</span>
          <span className="stat-label">Nhiệm vụ</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{loading ? '…' : coinBalance(state)}</span>
          <span className="stat-label">Xu demo</span>
        </div>
      </section>

      {/* "Tài khoản của tôi" Circular Action Buttons */}
      <section className="account-quick-section" aria-label="Tài khoản của tôi">
        <h2>Tài khoản của tôi</h2>
        <div className="account-quick-grid">
          <a href="#/nhan-vat" className="quick-action-item">
            <div className="action-icon-circle color-purple">🎨</div>
            <span>Nhân vật</span>
          </a>
          <button type="button" className="quick-action-item" onClick={() => setShowEditProfile(!showEditProfile)}>
            <div className="action-icon-circle color-blue">✏️</div>
            <span>Cập nhật SĐT/Email</span>
          </button>
          <a href="#/cua-hang" className="quick-action-item">
            <div className="action-icon-circle color-orange">🎁</div>
            <span>Phần thưởng</span>
          </a>
          <a href="#/album" className="quick-action-item">
            <div className="action-icon-circle color-green">🖼️</div>
            <span>Thư viện</span>
          </a>
        </div>
      </section>

      {/* Inline edit profile section */}
      {showEditProfile && (
        <section className="account-edit-section" aria-label="Cập nhật thông tin">
          <h3>Cập nhật Email & Số điện thoại</h3>
          <form onSubmit={handleSaveProfile} className="account-edit-form">
            <label>
              Email
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="ví dụ: email@gmail.com"
              />
            </label>
            <label>
              Số điện thoại
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="ví dụ: 0901234567"
              />
            </label>
            <div className="account-edit-actions">
              <button type="button" className="secondary-button" onClick={() => setShowEditProfile(false)}>
                Hủy
              </button>
              <button type="submit" className="game-button small-button" disabled={saving}>
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </section>
      )}

      {updateMsg && <p className="success-msg" role="status">{updateMsg}</p>}
      {updateError && <p className="error" role="alert">{updateError}</p>}
      {logoutError && <p className="error" role="alert">{logoutError}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {corrupt && <div className="error" role="alert"><p>Dữ liệu tiến độ đã lưu bị hỏng. Bạn có thể đặt lại tiến độ để chơi tiếp — một bản sao dữ liệu hỏng được giữ lại để khôi phục thủ công, ảnh đã lưu không bị xóa.</p><button type="button" onClick={() => setResetOpen(true)}>Đặt lại tiến độ</button></div>}
      <ConfirmDialog open={resetOpen} title="Đặt lại tiến độ?" message="Toàn bộ tiến độ nhiệm vụ, xu và voucher đã đổi sẽ bị xóa và bắt đầu lại từ đầu. Ảnh trong album được giữ lại. Bạn có chắc chắn?" confirmLabel="Đặt lại" busyLabel="Đang đặt lại…" busy={false} tone="danger" onCancel={() => setResetOpen(false)} onConfirm={() => void resetProgress().then(ok => { if (ok) setResetOpen(false) })} />

      {loading ? (
        <p role="status" className="account-loading">Đang đọc lịch sử khám phá…</p>
      ) : (
        <>
          <section className="account-history-section" aria-labelledby="visited-title">
            <h2 id="visited-title">📍 Địa điểm đã ghé</h2>
            {visits.length === 0 ? (
              <p className="account-empty">Chưa có lượt ghé nào được ghi nhận bằng nhiệm vụ có mặt.</p>
            ) : (
              <ul className="account-history-list">
                {visits.map(entry => (
                  <li key={`${entry.place.id}:${entry.missionId}`}>
                    <strong>{entry.place.name}</strong>
                    <span>{recordedDate(entry.completedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="account-history-section" aria-labelledby="activities-title">
            <h2 id="activities-title">🌟 Hoạt động đã trải nghiệm</h2>
            {activities.length === 0 ? (
              <p className="account-empty">Các hoạt động đã hoàn thành sẽ xuất hiện tại đây.</p>
            ) : (
              <ul className="account-history-list">
                {activities.map(entry => (
                  <li key={`${entry.place.id}:${entry.missionId}`}>
                    <strong>{entry.mission?.title} · {entry.place.name}</strong>
                    <span>{recordedDate(entry.completedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="account-history-section" aria-labelledby="missions-title">
            <h2 id="missions-title">🎯 Nhiệm vụ đã hoàn thành</h2>
            {entries.length === 0 ? (
              <p className="account-empty">Lịch sử sẽ bắt đầu sau khi bạn hoàn thành nhiệm vụ tại một điểm đến.</p>
            ) : (
              <ul className="account-history-list">
                {entries.map(entry => (
                  <li key={`${entry.place.id}:${entry.missionId}`}>
                    <strong>{entry.mission?.title} · {entry.place.name}</strong>
                    <span>{recordedDate(entry.completedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p className="account-data-note">
        Tiến độ, ảnh và xu được lưu theo tài khoản trên máy chủ.
      </p>
      <a href="#/kham-pha" className="account-map-link">
        ← Về bản đồ
      </a>
      <ConfirmDialog open={logoutOpen} title="Đăng xuất khỏi DANA QUEST?" message="Bạn cần đăng nhập lại để tiếp tục hành trình. Tiến độ, ảnh và xu đã lưu trong tài khoản vẫn được giữ." confirmLabel="Đăng xuất" busyLabel="Đang đăng xuất…" busy={loggingOut} tone="danger" onCancel={() => setLogoutOpen(false)} onConfirm={() => void logout()} />
    </main>
  )
}
