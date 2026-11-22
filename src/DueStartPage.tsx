import { t } from './i18n/locale'
import {useQuestNavigationGuard} from './lib/useQuestNavigationGuard'
import QuestCover from './QuestCover'
import { HeaderQuickToggles } from './PageTools'
import { useEffect, useState } from 'react'
import { getQuest } from './data/quests'
import { useQuestProgress } from './lib/useQuestProgress'
import { usePlayerLocation } from './lib/usePlayerLocation'
import { distanceMeters, hasArrived, type LocationSample } from './lib/location'
import { formatMeters } from './lib/routing'
import { PlayerDialog, PlayerIcon } from './QuestPlayerUi'
import { displayText } from './lib/questDisplay'
import DueMap from './DueMap'
import DueSupport from './DueSupport'
import './DueStartPage.css'
// [UX-FLOW] Tích hợp cờ tính năng vào thẳng màn chơi khi đã đến nơi
import { isUxFlagEnabled } from './lib/uxFlags'
import { useOptionalAuth } from './AuthContext'
import { getQuestPricing, isPaidQuest, openPremiumModal, usePremiumAccess } from './lib/premium'

function navigateToHash(hash:string){window.location.hash=hash}
function DeviceLocation({onChange}:{onChange:(value:{sample:LocationSample|null;error:string})=>void}){
 const {sample,error,retry}=usePlayerLocation()
 useEffect(()=>onChange({sample,error}),[sample,error,onChange])
 return error?<button className="due-text-button" onClick={retry}>{t("Thử lấy lại vị trí")}</button>:null
}
export default function DueStartPage({id='due-dau-an-50-nam'}:{id?:string}){
 const quest=getQuest(id)
 const auth=useOptionalAuth()
 const {hasAccess:hasQuestAccess}=usePremiumAccess(auth?.user?.id)
 const {state,dispatch,busy,error,loading,ready}=useQuestProgress()
 const [tab,setTab]=useState<'landmark'|'map'>('landmark')
 const [dialog,setDialog]=useState<'arrival'|'lost'|'help'|null>(null)
 const [locating,setLocating]=useState(false)
 const [location,setLocation]=useState<{sample:LocationSample|null;error:string}>({sample:null,error:''})
 const [copyNotice,setCopyNotice]=useState('')
 const run=quest?state.quests[quest.id]:undefined
 const navigation=useQuestNavigationGuard(!!run&&!run.paused&&!run.completedAt,()=>dispatch({type:'pause',questId:id}),busy,`#/quest/${id}/choi`)
 const confirmed=!!run?.arrivalConfirmedAt
 const distance=location.sample&&quest?distanceMeters([location.sample.latitude,location.sample.longitude],quest.startPosition):null
 const near=Boolean(location.sample&&quest&&hasArrived(location.sample,quest.startPosition))
 
 async function confirm(){
   if(!quest)return
   if(await dispatch({type:'confirm-arrival',questId:quest.id})){
     setDialog(null)
   }
 }

 // [UX-FLOW] Vào thẳng màn chơi 1 chạm khi bấm "Tôi đã đến nơi"
 async function directPlay(){
   if(!quest)return
   if(await dispatch({type:'confirm-arrival',questId:quest.id})){
     navigateToHash(`#/quest/${quest.id}/choi`)
   }
 }

 async function copy(){if(!quest)return;try{await navigator.clipboard.writeText(quest.area);setCopyNotice(t("Đã sao chép địa chỉ."))}catch{setCopyNotice(t("Bạn có thể chọn và sao chép địa chỉ hiển thị bên trên."))}}
 if(!quest)return <main className="quest-page"><h1>{t("Không tìm thấy quest","Quest not found")}</h1><a href="#/kham-pha">{t("Về Khám phá","Back to Explore")}</a></main>
 if(isPaidQuest(id)&&!hasQuestAccess(id)){const lockedPricing=getQuestPricing(id);
   return <main className="due-start dq-locked-page" aria-labelledby="due-locked-title"><section className="dq-locked-screen"><span className="dq-locked-badge">✦ {lockedPricing.tierId==='pro'?t("YÊU CẦU GÓI PRO · GIẢM 45%","PRO PLAN REQUIRED · 45% OFF"):t("YÊU CẦU GÓI PLUS · GIẢM 40%","PLUS PLAN REQUIRED · 40% OFF")}</span><h1 id="due-locked-title">{displayText(quest.title)}</h1><p>{lockedPricing.tierId==='pro'?t(`Hành trình ${displayText(quest.title)} yêu cầu kích hoạt Gói Pro hàng tháng để vào điểm bắt đầu và giải câu đố. Bạn vẫn có thể xem chỉ đường miễn phí bất cứ lúc nào!`,`${displayText(quest.title)} requires Dana Quest Pro monthly to play. Turn-by-turn walking directions remain free!`):t("Hành trình Đánh thức Long Mạch yêu cầu kích hoạt Gói Plus hoặc Pro hàng tháng để vào điểm bắt đầu và giải câu đố. Bạn vẫn có thể dùng chỉ đường tới Cầu Rồng miễn phí bất cứ lúc nào!","Awakening the Dragon Vein requires activating Plus or Pro monthly to play. Turn-by-turn directions to Dragon Bridge remain free!")}</p><div className="dq-locked-price"><s>{lockedPricing.originalCurrencyLabel}</s><strong>{lockedPricing.currencyLabel}</strong></div><div className="dq-locked-actions"><button type="button" className="dq-locked-buy-btn" onClick={()=>openPremiumModal({questId:id,reason:'unlock'})}>{t(`Đăng ký ${lockedPricing.tierName} · ${lockedPricing.currencyLabel} →`,`Subscribe ${lockedPricing.tierName} · ${lockedPricing.currencyLabel} →`)}</button><a className="dq-locked-dir-link" href={`#/chi-duong/${id}?tu=map`}>↗ {t(`Chỉ đường đến ${displayText(quest.title)}`,`Directions to ${displayText(quest.title)}`)}</a><a className="dq-locked-back" href={`#/quest/${id}`}>← {t("Quay lại giới thiệu quest","Back to quest details")}</a></div></section></main>
 }
 return <main className="due-start" aria-labelledby="due-start-title">
  <div className="due-start-surface" inert={!!dialog||!!navigation.destination} aria-hidden={!!dialog||!!navigation.destination}>
  <header className="due-start-top"><a className="due-back-btn dq-back-btn" href={`#/quest/${quest.id}`} aria-label={t("Quay lại giới thiệu quest")}>← {t("Quay lại")}</a><div className="due-start-top-actions"><HeaderQuickToggles compact /><button aria-label={t("Trợ giúp điểm bắt đầu")} onClick={()=>setDialog('help')}><PlayerIcon kind="help"/></button></div></header>
  <div className="due-start-scroll"><div className="due-start-heading"><p className="due-quest-name">⚑ {displayText(quest.title)}</p><h1 id="due-start-title">{t("Tìm điểm bắt đầu")}</h1></div>
  <div className="due-start-grid"><section className="due-start-main"><div className={`due-distance ${confirmed?'confirmed':''}`} aria-live="polite"><span aria-hidden="true">{confirmed?'✓':'⌖'}</span><div><strong>{distance===null?t("Điểm hẹn quest"):formatMeters(distance)}</strong><p>{confirmed?t("Bạn đã tự xác nhận đến điểm bắt đầu"):near?t("Bạn đang ở gần (hãy đối chiếu biển tên)"):distance!==null?t("Khoảng cách đường thẳng từ thiết bị"):t("Đối chiếu địa chỉ hoặc bật vị trí để tìm đường")}</p></div></div>
   <div className="due-view-tabs" role="tablist" aria-label={t("Xem điểm bắt đầu")}><button id="due-landmark-tab" role="tab" aria-selected={tab==='landmark'} aria-controls="due-location-panel" onClick={()=>setTab('landmark')}>{t("Nhận diện")}</button><button id="due-map-tab" role="tab" aria-selected={tab==='map'} aria-controls="due-location-panel" onClick={()=>setTab('map')}>{t("Bản đồ")}</button></div>
   <section id="due-location-panel" role="tabpanel" aria-labelledby={tab==='map'?'due-map-tab':'due-landmark-tab'} className="due-landmark-card">{tab==='map'?<DueMap questId={id} sample={location.sample}/>:<button className="due-artwork-button" aria-label={t("Xem lớn dấu hiệu nhận diện")} onClick={()=>setDialog('arrival')}><QuestCover id={id} credit/><span className="due-expand-label">{t("⛶ Xem lớn")}</span></button>}<div className="due-address"><span aria-hidden="true">⌖</span><div><strong>{displayText(quest.area)}</strong>{id==='due-dau-an-50-nam'&&<p>{t("71 Ngũ Hành Sơn, Đà Nẵng")}</p>}</div><button aria-label={t("Sao chép địa chỉ")} onClick={()=>void copy()}>▣</button></div></section>
   {copyNotice&&<p role="status">{copyNotice}</p>}
  </section><section className="due-start-side"><details className="due-before" open><summary>{t("Trước khi lên đường")}</summary><ul><li>{t("Pin đủ cho hành trình (nên từ 50%).")}</li><li>{t("Bật kết nối mạng để lưu tiến độ.")}</li><li>{t("Quan sát biển tên địa điểm ở khu vực công cộng.")}</li><li>{t("Không đứng giữa lối ra vào, không nhìn màn hình khi qua đường.")}</li></ul></details><div className="due-location-controls"><button className="due-secondary" onClick={()=>setLocating(true)} disabled={locating}>{locating?t("Đang dùng vị trí thiết bị"):t("Bật vị trí để tìm đường")}</button><p>{t("Vị trí chỉ hỗ trợ chỉ đường. Bạn cần tự đối chiếu điểm bắt đầu trước khi xác nhận.")}</p><a className="q-menu-item" href={`#/quest/${id}/dan-duong`}>{t("Mở chỉ đường từng chặng →")}</a>{locating&&<DeviceLocation onChange={setLocation}/>}<p role="status">{location.error}</p></div><p className="due-asset-note">{t("Đối chiếu ảnh nhận diện với biển tên thực tế tại điểm bắt đầu.")}</p></section></div>
  </div>
  <footer className="due-start-actions">
   {error&&<p role="alert" className="q-error">{t(error)}</p>}
   {!run&&!loading ? (
     <a className="q-primary" href={`#/quest/${quest.id}`}>{t("Đọc giới thiệu để bắt đầu")}</a>
   ) : confirmed ? (
     <a className="q-primary" href={`#/quest/${quest.id}/choi`}>{t("Bắt đầu quest")}</a>
   ) : (
     <>
       {/* [UX-FLOW] 1-tap: Tôi đã đến nơi -> vào thẳng màn chơi không qua hộp thoại */}
       {isUxFlagEnabled('ARRIVED_DIRECT_PLAY') && (
         <button className="q-primary due-direct-play-btn" disabled={busy||loading||!ready} onClick={() => void directPlay()}>
           {t("Tôi đã đến nơi (Vào chơi ngay) ↗")}
         </button>
       )}
       <button className={isUxFlagEnabled('ARRIVED_DIRECT_PLAY') ? "due-secondary" : "q-primary"} disabled={busy||loading||!ready} onClick={()=>setDialog('arrival')}>
         {loading?t("Đang tải tiến độ…"):t("Xác nhận đã đến")}
       </button>
     </>
   )}
   <button className="due-secondary" onClick={()=>setDialog('lost')}>{t("Không tìm thấy điểm bắt đầu?")}</button>
  </footer>
  </div>
  {navigation.destination&&<PlayerDialog title={t("Lưu và rời hành trình?")} onClose={navigation.cancel}><p>{t("Bạn có thể quay lại điểm bắt đầu từ Quest của bạn. Chỉ chuyển trang sau khi tiến độ đã được lưu.")}</p>{error&&<p role="alert">{t(error)}</p>}<button className="q-primary" disabled={busy||navigation.saving} onClick={()=>void navigation.confirm()}>{navigation.saving?t("Đang lưu…"):t("Lưu và chuyển trang")}</button><button className="due-text-button" disabled={navigation.saving} onClick={navigation.cancel}>{t("Ở lại")}</button></PlayerDialog>}
  {dialog&&!navigation.destination&&<PlayerDialog title={dialog==='arrival'?t("Bạn đã nhìn thấy điểm bắt đầu?"):dialog==='lost'?(id==='due-dau-an-50-nam'?t("Cần tìm đúng cổng trường?"):t("Không tìm thấy điểm bắt đầu?")):t("Trợ giúp điểm bắt đầu")} onClose={()=>{if(!busy)setDialog(null)}}>
   {dialog==='arrival'?<><QuestCover id={id} credit/><p className="due-arrival-address">{displayText(quest.area)}{id==='due-dau-an-50-nam'&&<><br/>{t("71 Ngũ Hành Sơn, Đà Nẵng")}</>}</p><p>{t("Đối chiếu biển tên địa điểm và địa chỉ bên trên. Đây là tự xác nhận bằng quan sát của bạn, không phải xác minh GPS hoặc ảnh.")}</p><p>{t("Chỉ xác nhận khi bạn đang ở đúng điểm, tại khu vực công cộng an toàn.")}</p>{error&&<p role="alert">{t(error)}</p>}<button className="due-purple" disabled={!run||!ready||busy} onClick={()=>void confirm()}>{busy?t("Đang lưu…"):t("Tôi đã đến đúng điểm này")}</button><button className="due-text-button" disabled={busy} onClick={()=>setDialog('lost')}>{t("Tôi vẫn chưa tìm thấy")}</button></>:dialog==='lost'?<><p>{t("Đối chiếu tên “")}{displayText(quest.area)}{t("” và địa chỉ hiển thị ở điểm bắt đầu. Không đi vào khu vực hạn chế.")}</p><button className="q-menu-item" onClick={()=>setDialog('arrival')}>{t("Xem dấu hiệu nhận diện")}</button><button className="q-menu-item" onClick={()=>{setTab('map');setDialog(null)}}>{t("Xem trên bản đồ")}</button><button className="q-menu-item" onClick={()=>setDialog('help')}>{t("Xem hướng dẫn và báo sự cố")}</button></>:<DueSupport questId={quest.id} checkpointId={quest.checkpointOrder[0]}/>}
  </PlayerDialog>}
 </main>
}
