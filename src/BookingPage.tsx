import './BookingPage.css'
import { t } from './i18n/locale'
import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'
import { LoginBackdrop } from './WelcomePage'
import { JourneyIcon } from './OnboardingPage'
import { rememberCodeReturn } from './lib/onboarding'
import { redeemQuestCode, type ActivatedQuest } from './lib/activation'
import { getDestination } from './data/destinations'
import { getQuest } from './data/quests'

export default function BookingPage({ entry=false }: { entry?:boolean }) {
  const auth=useAuth()
  const [code,setCode]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [result,setResult]=useState<ActivatedQuest|null>(null)
  async function submit(event:FormEvent) {event.preventDefault();if(busy)return;setBusy(true);setError('');try{setResult(await redeemQuestCode(code.trim()))}catch(cause){setError((cause as Error).message)}finally{setBusy(false)}}
  const login=()=>rememberCodeReturn()
  const resultTitle=(result ? getQuest(result.questId)?.title||getDestination(result.questId)?.name||'' : '').replace(/\s+[—–-]\s+(.+)$/, ' ($1)')
  return <main className="login-experience booking-experience"><LoginBackdrop decorative/><div className="login-scrim" aria-hidden="true"/><section className="login-sheet booking-sheet" aria-labelledby="booking-title">
    <div className="login-sheet-top"><span className="login-sheet-handle" aria-hidden="true"/><a className="login-sheet-close" href="#/" aria-label={t("Đóng kích hoạt")}>{t("×")}</a></div>
    <p className="journey-eyebrow">{t("Mã hành trình Dana Quest")}</p><h1 id="booking-title">{entry?t("Kích hoạt quest của bạn"): t("Bạn đã kích hoạt quest chưa?")}</h1><p className="login-sheet-description">{entry?t("Nhập mã do Dana Quest cấp. Mỗi mã được gắn với một tài khoản."):t("Nếu bạn đã nhận mã từ Dana Quest, hãy chọn cách tiếp tục bên dưới.")}</p>
    {!entry?<><a className="booking-option" href="#/dang-nhap" onClick={()=>rememberCodeReturn('quests')}><span className="booking-symbol green"><JourneyIcon kind="check"/></span><span><strong>{t("Tôi đã kích hoạt rồi")}</strong><small>{t("Đăng nhập bằng đúng tài khoản đã nhận quest.")}</small></span><span aria-hidden="true">→</span></a><a className="booking-option yellow" href="#/nhap-ma"><span className="booking-symbol"><JourneyIcon kind="ticket"/></span><span><strong>{t("Tôi có mã Dana Quest")}</strong><small>{t("Nhập mã để gắn quest vào tài khoản.")}</small></span><span aria-hidden="true">→</span></a></>
    :auth.status!=='authenticated'?<div className="booking-login-prompt"><p>{t("Hãy đăng nhập hoặc tạo tài khoản trước để mã được lưu đúng người nhận.")}</p><a className="journey-primary" href="#/dang-nhap" onClick={login}>{t("Đăng nhập để nhập mã")}</a></div>
    :result?<div className="booking-success" role="status"><JourneyIcon kind="check"/><h2>{t("Đã kích hoạt quest")}</h2><p>{resultTitle}</p><a href="#/bat-dau/thanh-pho" className="journey-primary">{t("Tiếp tục khám phá")}</a><a className="journey-text-link" href="#/quest-cua-toi">{t("Xem quest đã kích hoạt")}</a></div>
    :<form className="booking-code-form" onSubmit={event=>void submit(event)}><label htmlFor="quest-code">{t("Mã Dana Quest")}</label><input id="quest-code" value={code} onChange={event=>setCode(event.target.value)} required maxLength={40} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder={t("Nhập mã bạn đã nhận")} disabled={busy}/>{error&&<p className="login-error" role="alert">{t(error)}</p>}<button className="journey-primary" disabled={busy||!code.trim()}>{busy?t("Đang kiểm tra mã…"):t("Kích hoạt quest")}</button></form>}
    <a href="#/bat-dau/thanh-pho" className="journey-underlink booking-browse">{t("Không có mã? Khám phá các quest")}</a><aside className="journey-notice">{t("Chỉ nhận mã do Dana Quest phát hành. Mã từ nền tảng đặt vé bên ngoài chưa được kết nối.")}</aside>
  </section></main>
}
