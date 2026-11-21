import './AvatarPage.css'
import { t } from './i18n/locale'
import { useState } from 'react'
import { readAvatar, resolveAvatar, saveAvatar } from './lib/avatar'
import { defaultLook, genders, genderLabels, heads, headLabels, hairs, hairLabels, sleeves, sleeveLabels, pantsKinds, pantsLabels, skinTones, hairColors, shirtColors, pantsColors, lookToCode, randomLook, type AvatarLook } from './lib/pixelAvatar'
import PixelAvatar from './PixelAvatar'
import { HeaderQuickToggles } from './PageTools'
import { takeCodeReturn, takePageReturn } from './lib/onboarding'
// [UX-FLOW] Tích hợp cờ vào nhanh
import { isUxFlagEnabled } from './lib/uxFlags'

export default function AvatarPage({ initialAvatarId, onAvatarConfirmed, editing = false }: { initialAvatarId?: string | null; onAvatarConfirmed?: (id: string) => Promise<void>; editing?: boolean }) {
  const selected = resolveAvatar(initialAvatarId) ?? readAvatar()
  const [look, setLook] = useState<AvatarLook>(() => ({ ...(selected?.look ?? defaultLook) }))
  const current = resolveAvatar(lookToCode(look))!
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  function change(patch: Partial<AvatarLook>) { setLook(prev => ({ ...prev, ...patch })) }
  
  async function confirm() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      if (onAvatarConfirmed) await onAvatarConfirmed(current.id)
      else saveAvatar(current.id)
      window.location.hash = editing ? '#/tai-khoan' : takePageReturn() ?? takeCodeReturn() ?? '#/bat-dau/thanh-pho'
    }
    catch { setError(t("Chưa lưu được nhân vật. Hãy kiểm tra kết nối và thử lại. Lựa chọn trước vẫn được giữ.")) }
    finally { setSaving(false) }
  }

  // [UX-FLOW] Nút vào chơi ngay 1 chạm với nhân vật gợi ý
  async function fastStartWithSuggested() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const suggestedLook = current.id ? current.id : lookToCode(randomLook())
      if (onAvatarConfirmed) await onAvatarConfirmed(suggestedLook)
      else saveAvatar(suggestedLook)
      window.location.hash = takePageReturn() ?? takeCodeReturn() ?? '#/map'
    }
    catch { setError(t("Chưa lưu được nhân vật. Hãy kiểm tra kết nối và thử lại.")) }
    finally { setSaving(false) }
  }

  return <main className="onboarding avatar-screen custom-avatar-screen"><section className="avatar-custom-frame" aria-labelledby="avatar-title">
    <header className="avatar-custom-heading"><a href={editing?'#/tai-khoan':'#/dang-nhap'} className="avatar-custom-back dq-back-btn" aria-label={editing?t("Về Tài khoản"):t("Quay lại")}>← {t("Quay lại")}</a><div className="avatar-custom-heading-copy"><h1 id="avatar-title">{t("Tùy chỉnh nhân vật")}</h1><p>{t("Một người bạn đồng hành mang dấu ấn của bạn.")}</p></div><HeaderQuickToggles compact /></header>
    <div className="avatar-custom-grid"><section className="avatar-custom-preview" aria-label={t("Hình ảnh nhân vật")}><div className="avatar-custom-stage"><PixelAvatar avatar={current}/></div><h2>{t("Nhân vật của bạn")}</h2><p>{t("Hình ảnh thay đổi ngay khi bạn chọn.")}</p><button type="button" disabled={saving} onClick={()=>setLook(randomLook())}>{t("Tạo ngẫu nhiên")}</button></section>
    <fieldset className="avatar-custom-controls" disabled={saving}><legend className="sr-only">{t("Các tùy chọn nhân vật")}</legend>
      <Choice label={t("Giới tính")} value={look.gender} options={genders} names={genderLabels} onPick={gender=>change({gender})}/>
      <Choice label={t("Đầu")} value={look.head} options={heads} names={headLabels} onPick={head=>change({head})}/>
      <Choice label={t("Tóc")} value={look.hair} options={hairs} names={hairLabels} onPick={hair=>change({hair})}/>
      <Choice label={t("Áo")} value={look.sleeve} options={sleeves} names={sleeveLabels} onPick={sleeve=>change({sleeve})}/>
      <Choice label={t("Quần")} value={look.pants} options={pantsKinds} names={pantsLabels} onPick={pants=>change({pants})}/>
      <Swatches label={t("Màu da")} value={look.skin} colors={skinTones} onPick={skin=>change({skin})}/>
      <Swatches label={t("Màu tóc")} value={look.hairColor} colors={hairColors} onPick={hairColor=>change({hairColor})}/>
      <Swatches label={t("Màu áo")} value={look.shirt} colors={shirtColors} onPick={shirt=>change({shirt})}/>
      <Swatches label={t("Màu quần")} value={look.pantsColor} colors={pantsColors} onPick={pantsColor=>change({pantsColor})}/>
    </fieldset></div>
    <footer className="avatar-custom-footer">
      {error&&<p role="alert" className="login-error">{t(error)}</p>}
      <button className="journey-primary" disabled={saving} onClick={()=>void confirm()}>{saving?t("Đang lưu…"):editing?t("Lưu nhân vật"):t("Xác nhận nhân vật")}</button>
      {/* [UX-FLOW] 1-tap shortcut for new players */}
      {!editing && isUxFlagEnabled('FAST_START') && (
        <button
          type="button"
          className="journey-text-link avatar-quick-start-btn"
          disabled={saving}
          onClick={() => void fastStartWithSuggested()}
          style={{ marginTop: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {t("Dùng nhân vật gợi ý, chỉnh sau → Vào chơi ngay")}
        </button>
      )}
      <p>{t("Đổi nhân vật không làm mất tiến độ, ảnh hay xu của bạn.")}</p>
    </footer>
  </section></main>
}

function Choice<T extends string>({ label, value, options, names, onPick }: { label: string; value: T; options: readonly T[]; names: Record<T, string>; onPick: (v: T) => void }) {
  return <div className="creator-row"><span className="creator-label">{label}</span><div className="creator-chips" role="group" aria-label={label}>{options.map(o => <button type="button" key={o} aria-pressed={value === o} onClick={() => onPick(o)}>{names[o]}</button>)}</div></div>
}
function Swatches({ label, value, colors, onPick }: { label: string; value: number; colors: readonly { name: string; color: string }[]; onPick: (i: number) => void }) {
  return <div className="creator-row"><span className="creator-label">{label}</span><div className="creator-chips" role="group" aria-label={label}>{colors.map((c, i) => <button type="button" key={c.color} className="creator-swatch" style={{ background: c.color }} aria-label={`${label}: ${c.name}`} aria-pressed={value === i} onClick={() => onPick(i)} />)}</div></div>
}
