import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'
import { requestLocationAfterAuthentication } from './lib/locationPermission'
import './Onboarding.css'
import './Auth.css'

type Mode = 'login' | 'register'

export default function AuthPage({ initialMode = 'login' }: { initialMode?: Mode }) {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function switchMode(target: Mode) {
    setMode(target)
    setError('')
    window.location.hash = target === 'register' ? '#/dang-ky' : '#/dang-nhap'
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth.configured || busy) return
    setBusy(true); setError('')
    try {
      const user = mode === 'register'
        ? await auth.register({ username: username.trim(), password })
        : await auth.login({ username: username.trim(), password })
      requestLocationAfterAuthentication()
      window.location.hash = user.avatarId ? '#/kham-pha' : '#/chon-nhan-vat'
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể thực hiện thao tác lúc này.') }
    finally { setBusy(false) }
  }

  return <main className="onboarding auth-screen">
    <header className="auth-header">
      <a href="#/" className="back-link"><span aria-hidden="true">←</span> Trang chủ</a>
    </header>
    <section className="auth-card" aria-labelledby="auth-title">
      <span className="game-kicker">DANA QUEST</span>
      <h1 id="auth-title">{mode === 'register' ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
      <div className="auth-tabs" role="group" aria-label="Chọn hình thức xác thực">
        <button type="button" aria-pressed={mode === 'login'} onClick={() => switchMode('login')}>Đăng nhập</button>
        <button type="button" aria-pressed={mode === 'register'} onClick={() => switchMode('register')}>Đăng ký</button>
      </div>
      {!auth.configured && <div className="notice auth-config-notice" role="status"><strong>Chưa cấu hình dịch vụ tài khoản.</strong><p>Để đăng ký và đăng nhập an toàn, cần cấu hình `VITE_AUTH_API_URL` và backend tạo cookie phiên HttpOnly.</p></div>}
      {auth.status === 'error' && <p className="notice error" role="alert">Không kiểm tra được phiên với backend: {auth.error}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <form onSubmit={event => void submit(event)}>
        <fieldset disabled={busy}>
          <label>{mode === 'register' ? 'Tên người dùng' : 'Tên đăng nhập hoặc Email'}
            <input
              type="text"
              autoComplete={mode === 'register' ? 'username' : 'username email'}
              required
              minLength={2}
              value={username}
              onChange={event => setUsername(event.target.value)}
              placeholder={mode === 'register' ? 'Tên người dùng bạn muốn chọn' : 'Tên người dùng hoặc email'}
            />
          </label>
          <label>Mật khẩu
            <input
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={6}
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Từ 6 ký tự trở lên"
            />
          </label>
          <button className="game-button" type="submit" disabled={!auth.configured || busy}>
            {busy ? 'Đang kết nối…' : mode === 'register' ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>
        </fieldset>
      </form>

      <div className="auth-footer-options">
        {mode === 'login' ? (
          <p className="auth-switch-prompt">
            Chưa có tài khoản?{' '}
            <button type="button" className="auth-link-button" onClick={() => switchMode('register')}>
              Đăng ký ngay
            </button>
          </p>
        ) : (
          <p className="auth-switch-prompt">
            Đã có tài khoản?{' '}
            <button type="button" className="auth-link-button" onClick={() => switchMode('login')}>
              Đăng nhập ngay
            </button>
          </p>
        )}
      </div>
      <p className="auth-privacy-note">Đăng ký chỉ cần tên người dùng và mật khẩu. Bạn có thể bổ sung Email và Số điện thoại sau trong trang Tài khoản.</p>
    </section>
  </main>
}
