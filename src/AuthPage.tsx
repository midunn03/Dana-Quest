import { t } from './i18n/locale'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useAuth } from './AuthContext'
import { takeCodeReturn } from './lib/onboarding'
import { LoginBackdrop } from './WelcomePage'
import './LoginExperience.css'
import type { AuthUser } from './lib/auth'
import { PixelButton } from './ui/PixelUI'

type Mode = 'login' | 'register'

export default function AuthPage({ initialMode = 'login', embedded = false, inline = false, onClose, onAuthenticated }: { initialMode?: Mode; embedded?: boolean; inline?: boolean; onClose?:()=>void; onAuthenticated?:(user:AuthUser)=>void }) {
  const auth = useAuth()
  const [internalMode,setInternalMode]=useState<Mode>(initialMode)
  const [previousInitialMode,setPreviousInitialMode]=useState(initialMode)
  if(inline&&previousInitialMode!==initialMode){setPreviousInitialMode(initialMode);setInternalMode(initialMode)}
  const mode=embedded||inline?internalMode:initialMode
  const [stage, setStage] = useState<'choice' | 'form'>(inline || mode === 'register' ? 'form' : 'choice')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const panel = useRef<HTMLElement>(null)
  const errorMessage = useRef<HTMLParagraphElement>(null)
  const choice = stage === 'choice' && mode === 'login'

  useEffect(() => { if(inline)return; panel.current?.querySelector<HTMLElement>(choice ? '.login-sheet-close' : 'input')?.focus() }, [choice, mode, inline])
  useEffect(() => { if (error) errorMessage.current?.focus() }, [error])

  function switchMode(target: Mode) {
    if (busy) return
    setStage('form'); setError(''); setPassword(''); setShowPassword(false)
    if(embedded||inline){setInternalMode(target);return}
    window.location.hash = target === 'register' ? '#/dang-ky' : '#/dang-nhap'
  }
  function close() { if (!busy) {if(embedded)onClose?.();else window.location.hash = '#/'} }
  function keyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') { event.preventDefault(); close() }
    if (event.key !== 'Tab') return
    const elements = [...(panel.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled)') ?? [])]
    const first = elements[0]; const last = elements.at(-1)
    if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && (document.activeElement === last || !elements.includes(document.activeElement as HTMLElement))) { event.preventDefault(); first?.focus() }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth.configured || busy) return
    setBusy(true); setError('')
    try {
      const user = mode === 'register' ? await auth.register({ username: username.trim(), password }) : await auth.login({ username: username.trim(), password })
      if(embedded){onAuthenticated?.(user);return}
      window.location.hash = user.avatarId ? takeCodeReturn() ?? '#/kham-pha' : '#/chon-nhan-vat'
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("Không thể thực hiện thao tác lúc này.")) }
    finally { setBusy(false) }
  }

  const Container=embedded||inline?'div':'main'
  const Heading=inline?'h2':'h1'
  return <Container className={inline?'auth-inline':embedded?'auth-modal-layer':'login-experience auth-full-page'}>
    {!embedded&&!inline&&<LoginBackdrop decorative />}
    {!inline&&<div className="login-scrim" aria-hidden="true" onClick={close} />}
    <section ref={panel} className={`login-sheet ${choice ? 'login-choice' : 'login-form-sheet'}`} role={inline?undefined:'dialog'} aria-modal={inline?undefined:true} aria-labelledby="auth-title" aria-describedby="auth-description" onKeyDown={inline?undefined:keyboard} onClick={event=>{if(embedded&&(event.target as HTMLElement).closest('a[href]'))close()}}>
      {!inline&&<div className="login-sheet-top"><span className="login-sheet-handle" aria-hidden="true" />
        <button className="login-sheet-close" type="button" aria-label={t("Đóng đăng nhập")} onClick={close} disabled={busy}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      </div>}
      {inline&&<div className="login-inline-tabs" aria-label={t("Tài khoản","Account")}><button type="button" aria-pressed={mode==='login'} onClick={()=>switchMode('login')}>{t("Đăng nhập")}</button><button type="button" aria-pressed={mode==='register'} onClick={()=>switchMode('register')}>{t("Đăng ký")}</button></div>}
      {!inline&&!choice && <button className="login-sheet-back" type="button" disabled={busy} onClick={() => { setStage('choice'); setError(''); setPassword(''); setShowPassword(false);if(embedded)setInternalMode('login');else window.location.hash = '#/dang-nhap' }}><span aria-hidden="true">‹</span> {" " + t("Quay lại")}</button>}
      <Heading id="auth-title">{choice ? t("Đăng nhập hoặc tạo tài khoản") : mode === 'register' ? t("Tạo tài khoản") : t("Đăng nhập")}</Heading>
      <p id="auth-description" className="login-sheet-description">{choice ? t("Tiếp tục những quest của bạn, lưu lại kỷ niệm và khám phá các phần thưởng.") : mode === 'register' ? t("Chỉ cần tên người dùng và mật khẩu để bắt đầu hành trình.") : t("Đăng nhập bằng tên người dùng hoặc email đã liên kết với tài khoản của bạn.")}</p>
      {!auth.configured && <div className="login-service-notice" role="status"><strong>{t("Dịch vụ tài khoản chưa sẵn sàng.")}</strong><p>{t("Vui lòng thử lại sau khi dịch vụ được kết nối.")}</p></div>}
      {auth.status === 'error' && <p className="login-error" role="alert">{t("Không kết nối được dịch vụ tài khoản.") + " "}{auth.error}</p>}
      {choice ? <div className="login-methods">
        <button type="button" className="login-method" onClick={() => setStage('form')}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>{t("Tiếp tục với tài khoản")}</button>
        <button type="button" className="login-method" onClick={() => switchMode('register')}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2m3-14v8m-4-4h8"/></svg>{t("Tạo tài khoản")}</button>
      </div> : <form onSubmit={event => void submit(event)} aria-busy={busy}>
        <fieldset disabled={busy}>
          <label htmlFor="login-username">{mode === 'register' ? t("Tên người dùng") : t("Tên đăng nhập hoặc Email")}</label>
          <input id="login-username" type="text" autoComplete="username" required minLength={2} value={username} aria-invalid={!!error||undefined} aria-describedby={error?"auth-error":undefined} onChange={event => {setUsername(event.target.value);setError('')}} placeholder={mode === 'register' ? t("Tên người dùng bạn muốn chọn") : t("Tên người dùng hoặc email")} />
          <label htmlFor="login-password">{t("Mật khẩu")}</label>
          <div className="login-password"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={6} required value={password} aria-invalid={!!error||undefined} onChange={event => {setPassword(event.target.value);setError('')}} placeholder={t("Từ 6 ký tự trở lên")} aria-describedby={error?"password-hint auth-error":"password-hint"} /><button type="button" aria-label={showPassword ? t("Ẩn mật khẩu") : t("Hiện mật khẩu")} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? t("Ẩn") : t("Hiện")}</button></div>
          <small id="password-hint">{t("Mật khẩu có ít nhất 6 ký tự.")}</small>
          {error && <p id="auth-error" ref={errorMessage} tabIndex={-1} className="login-error" role="alert">{t(error)}</p>}
          <PixelButton className="login-submit" type="submit" disabled={!auth.configured || busy} loading={busy}>{busy ? t("Đang kết nối…") : mode === 'register' ? t("Tạo tài khoản") : t("Đăng nhập")}</PixelButton>
        </fieldset>
        <p className="login-switch">{mode === 'login' ? t("Chưa có tài khoản?") : t("Đã có tài khoản?")}<button type="button" disabled={busy} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? t("Đăng ký") : t("Đăng nhập ngay")}</button></p>
      </form>}
      <a href="#/kich-hoat" className="login-account-note booking-login-link"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Zm9 0v14"/></svg><div><strong>{t("Bạn đã có mã quest?")}</strong><p>{t("Nhấn để kích hoạt mã Dana Quest của bạn.")}</p></div><span aria-hidden="true">→</span></a>
      <p className="login-account-caption">{t("Bạn có thể bổ sung email và số điện thoại trong Tài khoản sau khi đăng ký.")}</p>
      <nav className="login-legal-links" aria-label={t("Thông tin sử dụng")}><a href="#/dieu-khoan">{t("Điều khoản")}</a><span aria-hidden="true">·</span><a href="#/quyen-rieng-tu">{t("Quyền riêng tư")}</a></nav>
    </section>
  </Container>
}
