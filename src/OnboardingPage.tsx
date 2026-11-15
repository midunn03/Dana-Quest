import { interpolate } from './i18n/locale'
import { localized } from './i18n/locale'
import { t } from './i18n/locale'
import { useState } from 'react'
import { destinations } from './data/destinations'
import { quests } from './data/quests'
import { searchText } from './lib/filters'
import { distanceMeters } from './lib/location'
import { readTravelPlan, saveTravelPlan, type TravelPlan } from './lib/onboarding'
import './OnboardingPage.css'

const plans: { id: TravelPlan; title: string; description: string; symbol: string }[] = localized([
  { id:'visiting',title:"Đang khám phá một nơi mới",description:"Mang về nhiều hơn những bức ảnh.",symbol:'pin' },
  { id:'planning',title:"Đang lên kế hoạch cho chuyến đi",description:"Chuẩn bị hành trình trước khi lên đường.",symbol:'plane' },
  { id:'home',title:"Ở nhà và muốn một cuối tuần thú vị",description:"Tìm câu chuyện mới ngay trong thành phố quen.",symbol:'home' },
])
export function JourneyIcon({ kind }: { kind:string }) {
  const paths: Record<string,string> = { pin:'M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13Zm0-10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',plane:'m3 13 7 1 10-5-1-3-8 3-4-6-2 1 3 7-5 2Zm0 8h18',home:'m2 11 10-9 10 9M5 9v13h5v-8h4v8h5V9',search:'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 6 6',ticket:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Zm9 0v14',check:'m5 12 4 4L20 5' }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]||paths.pin}/></svg>
}
export default function OnboardingPage({ step }: { step:'city'|'plans'|'intro' }) {
  const [query,setQuery]=useState(t("Đà Nẵng"))
  const [plan,setPlan]=useState<TravelPlan|null>(readTravelPlan)
  const [locating,setLocating]=useState(false)
  const [notice,setNotice]=useState('')
  const [error,setError]=useState('')
  const available=searchText(t("Đà Nẵng")).includes(searchText(query))
  function locate() {
    if(!navigator.geolocation) {setNotice(t("Trình duyệt chưa hỗ trợ định vị. Bạn vẫn có thể chọn Đà Nẵng."));return}
    setLocating(true);setNotice('')
    navigator.geolocation.getCurrentPosition(position=>{
      setLocating(false);setQuery(t("Đà Nẵng"))
      const near=distanceMeters([position.coords.latitude,position.coords.longitude],[16.0544,108.2022])<40000
      setNotice(near?t("Bạn đang ở gần Đà Nẵng. Sẵn sàng khám phá!"):t("Bạn đang ở ngoài khu vực Đà Nẵng. Hiện Dana Quest có nội dung tại Đà Nẵng; bạn vẫn có thể xem trước hành trình."))
    },cause=>{setLocating(false);setNotice(cause.code===1?t("Bạn chưa cho phép vị trí. Hãy chọn Đà Nẵng thủ công hoặc cấp quyền trong trình duyệt."):t("Chưa xác định được vị trí. Bạn vẫn có thể chọn Đà Nẵng thủ công."))},{enableHighAccuracy:false,timeout:8000,maximumAge:30000})
  }
  function continuePlans() { try{saveTravelPlan(plan);window.location.hash='#/bat-dau/gioi-thieu'}catch(cause){setError((cause as Error).message)} }
  return <main className={`journey-page journey-onboarding journey-${step}`} aria-labelledby="journey-title"><section className="journey-frame">
    {step!=='intro' && <header className="journey-progress"><a href={step==='city'?'#/':'#/bat-dau/thanh-pho'} aria-label={t("Quay lại")}>‹</a><progress max={3} value={step==='city'?1:2} aria-label={interpolate("Bước ${0} trên 3",[step==='city'?1:2])} /></header>}
    {step==='city' ? <><div className="journey-body"><p className="journey-eyebrow">{t("Tìm hành trình của bạn")}</p><h1 id="journey-title">{t("Bạn muốn khám phá Đà Nẵng, đúng không?")}</h1><p className="journey-description">{t("Cùng tìm những quest đang chờ bạn tại thành phố này.")}</p>
      <label className="journey-city-search"><JourneyIcon kind="search"/><span className="sr-only">{t("Tìm thành phố")}</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} /></label>
      {available?<button className="journey-city-result" onClick={()=>setQuery(t("Đà Nẵng"))}><JourneyIcon kind="pin"/><span><strong>{t("Đà Nẵng")}</strong><small>{destinations.length+quests.length} {" " + t("quest và hành trình khám phá")}</small></span></button>:<p role="status" className="journey-notice">{t("Hiện chỉ có nội dung Đà Nẵng. Thử tìm “Đà Nẵng” hoặc “Da Nang”.")}</p>}
      <button type="button" className="journey-underlink" disabled={locating} onClick={locate}><JourneyIcon kind="pin"/>{locating?t("Đang xác định vị trí…"):t("Dùng vị trí chính xác của tôi")}</button>
      {notice && <p role="status" className="journey-notice">{t(notice)}</p>}<p className="journey-small">{t("Bạn có thể xem trước quest mà không cần cấp quyền vị trí.")}</p></div>
      <footer className="journey-footer"><button className="journey-primary" disabled={!available} onClick={()=>{window.location.hash='#/bat-dau/ke-hoach'}}>{t("Đúng, khám phá Đà Nẵng")}</button><a className="journey-text-link" href="#/kich-hoat">{t("Bạn đã có mã đặt chỗ hoặc lời mời?")}</a></footer></>
    :step==='plans'?<><div className="journey-body"><p className="journey-eyebrow">{t("Kế hoạch của bạn")}</p><h1 id="journey-title">{t("Hiện tại, bạn đang…")}</h1><div className="journey-plan-options" role="radiogroup" aria-label={t("Mục đích trải nghiệm")}>{plans.map(item=><label key={item.id} className={`journey-plan ${plan===item.id?'selected':''}`}><span className="journey-option-icon"><JourneyIcon kind={item.symbol}/></span><span><strong>{item.title}</strong><small>{item.description}</small></span><input type="radio" name="travel-plan" value={item.id} checked={plan===item.id} onChange={()=>setPlan(item.id)}/></label>)}</div>{error&&<p role="alert" className="journey-notice">{t(error)}</p>}<p className="journey-small">{t("Lựa chọn được nhớ trên trình duyệt này. Bạn có thể bỏ qua.")}</p></div><footer className="journey-footer"><button className="journey-primary" disabled={!plan} onClick={continuePlans}>{t("Tiếp tục")}</button><a className="journey-text-link" href="#/kham-pha">{t("Bỏ qua, đưa tôi đến các quest")}</a></footer></>
    :<><div className="journey-body journey-intro-body"><img className="journey-intro-photo" src={`${import.meta.env.BASE_URL}photos/cong-vien-apec.jpg`} alt={t("Lối đi dẫn vào Công viên APEC tại Đà Nẵng")}/><h1 id="journey-title">{t("Câu chuyện ở lại sau mỗi câu đố.")}</h1><p className="journey-description">{t("Một quest là câu chuyện bạn tự bước vào. Những con phố thật, địa điểm thật và thử thách để bạn khám phá ngay tại chỗ.")}</p><p className="journey-highlight">{t("Chọn hành trình, quan sát những điều nhỏ và lưu lại kỷ niệm theo cách của bạn.")}</p><small className="journey-small">{t("Ảnh: Quang Nguyen Vinh (Pexels)")}</small></div><footer className="journey-footer"><button className="journey-primary" onClick={()=>{window.location.hash='#/kham-pha'}}>{t("Xem các quest của tôi")}</button><a className="journey-text-link" href="#/bat-dau/ke-hoach">{t("Quay lại lựa chọn của tôi")}</a></footer></>}
  </section></main>
}
