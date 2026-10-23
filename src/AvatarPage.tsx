import { useState } from 'react'
import { avatars, readAvatar, resolveAvatar, saveAvatar } from './lib/avatar'
import { defaultLook, genders, genderLabels, heads, headLabels, hairs, hairLabels, sleeves, sleeveLabels, pantsKinds, pantsLabels, skinTones, hairColors, shirtColors, pantsColors, lookToCode, randomLook, type AvatarLook } from './lib/pixelAvatar'
import PixelAvatar from './PixelAvatar'
import './Onboarding.css'
export default function AvatarPage({ initialAvatarId, onAvatarConfirmed, editing = false }: { initialAvatarId?: string | null; onAvatarConfirmed?: (id: string) => Promise<void>; editing?: boolean }) {
  const [selected, setSelected] = useState(() => resolveAvatar(initialAvatarId) ?? readAvatar() ?? avatars[0])
  const [look, setLook] = useState<AvatarLook | null>(() => selected.look ?? null)
  const current = look ? resolveAvatar(lookToCode(look)) ?? selected : selected
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  function change(patch: Partial<AvatarLook>) { setLook(prev => ({ ...(prev ?? defaultLook), ...patch })) }
  function step(direction: number) { setLook(null); setSelected(avatars[(avatars.findIndex(item => item.id === selected.id) + direction + avatars.length) % avatars.length]) }
  async function confirm() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      if (onAvatarConfirmed) await onAvatarConfirmed(current.id)
      else saveAvatar(current.id)
      window.location.hash = editing ? '#/tai-khoan' : '#/kham-pha'
    }
    catch { setError('Chưa lưu được nhân vật. Hãy kiểm tra kết nối và thử lại. Lựa chọn trước vẫn được giữ.') }
    finally { setSaving(false) }
  }
  return <main className="onboarding avatar-screen"><section className="avatar-card" aria-labelledby="avatar-title">
    <a href={editing ? '#/tai-khoan' : '#/kham-pha'} className="avatar-back">{editing ? '← Tài khoản' : '← Khám phá'}</a><span className="game-kicker">SẴN SÀNG LÊN ĐƯỜNG</span>
    <h1 id="avatar-title">Chọn nhân vật</h1><p>Đồng hành cùng bạn khám phá<br />Đà Nẵng theo cách riêng.</p>
    <div className="avatar-stage"><button aria-label="Nhân vật trước" onClick={() => step(-1)}>‹</button><div className="avatar-spotlight"><span className="pixel-spark spark-one" aria-hidden="true">✦</span><PixelAvatar avatar={current} /><span className="pixel-spark spark-two" aria-hidden="true">✦</span></div><button aria-label="Nhân vật tiếp theo" onClick={() => step(1)}>›</button></div>
    <div className="avatar-caption" aria-live="polite"><h2>{current.name}</h2><p>{current.note}</p></div>
    <div className="avatar-options" role="group" aria-label="Các nhân vật">{avatars.map(avatar => <button key={avatar.id} aria-label={avatar.name} aria-pressed={!look && selected.id === avatar.id} onClick={() => { setLook(null); setSelected(avatar) }}><PixelAvatar avatar={avatar} />{!look && selected.id === avatar.id && <span className="avatar-check" aria-hidden="true">✓</span>}</button>)}</div>
    {look ? <div className="avatar-creator" role="group" aria-label="Tạo nhân vật">
      <Choice label="Giới tính" value={look.gender} options={genders} names={genderLabels} onPick={gender => change({ gender })} />
      <Choice label="Đầu" value={look.head} options={heads} names={headLabels} onPick={head => change({ head })} />
      <Choice label="Tóc" value={look.hair} options={hairs} names={hairLabels} onPick={hair => change({ hair })} />
      <Choice label="Áo" value={look.sleeve} options={sleeves} names={sleeveLabels} onPick={sleeve => change({ sleeve })} />
      <Choice label="Quần" value={look.pants} options={pantsKinds} names={pantsLabels} onPick={pants => change({ pants })} />
      <Swatches label="Màu da" value={look.skin} colors={skinTones} onPick={skin => change({ skin })} />
      <Swatches label="Màu tóc" value={look.hairColor} colors={hairColors} onPick={hairColor => change({ hairColor })} />
      <Swatches label="Màu áo" value={look.shirt} colors={shirtColors} onPick={shirt => change({ shirt })} />
      <Swatches label="Màu quần" value={look.pantsColor} colors={pantsColors} onPick={pantsColor => change({ pantsColor })} />
      <div className="creator-actions"><button type="button" onClick={() => setLook(randomLook())}>🎲 Ngẫu nhiên</button><button type="button" onClick={() => setLook(null)}>Dùng nhân vật có sẵn</button></div>
    </div> : <button type="button" className="creator-open" onClick={() => setLook({ ...defaultLook })}>✎ Tự tạo nhân vật</button>}
    {error && <p role="alert" className="error">{error}</p>}
    <button className="game-button" disabled={saving} onClick={() => void confirm()}>{saving ? 'Đang lưu…' : editing ? 'Lưu nhân vật' : 'Xác nhận nhân vật'} <span aria-hidden="true">→</span></button><p className="avatar-hint">Đổi nhân vật không làm mất tiến độ, ảnh hay xu của bạn.</p>
  </section></main>
}

function Choice<T extends string>({ label, value, options, names, onPick }: { label: string; value: T; options: readonly T[]; names: Record<T, string>; onPick: (v: T) => void }) {
  return <div className="creator-row"><span className="creator-label">{label}</span><div className="creator-chips" role="group" aria-label={label}>{options.map(o => <button type="button" key={o} aria-pressed={value === o} onClick={() => onPick(o)}>{names[o]}</button>)}</div></div>
}
function Swatches({ label, value, colors, onPick }: { label: string; value: number; colors: readonly { name: string; color: string }[]; onPick: (i: number) => void }) {
  return <div className="creator-row"><span className="creator-label">{label}</span><div className="creator-chips" role="group" aria-label={label}>{colors.map((c, i) => <button type="button" key={c.color} className="creator-swatch" style={{ background: c.color }} aria-label={`${label}: ${c.name}`} aria-pressed={value === i} onClick={() => onPick(i)} />)}</div></div>
}
