import { t } from './i18n/locale'
import {useQuestNavigationGuard} from './lib/useQuestNavigationGuard'
import QuestCover from './QuestCover'
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

function DeviceLocation({onChange}:{onChange:(value:{sample:LocationSample|null;error:string})=>void}){
 const {sample,error,retry}=usePlayerLocation()
 useEffect(()=>onChange({sample,error}),[sample,error,onChange])
 return error?<button className="due-text-button" onClick={retry}>{t("Thử lấy lại vị trí")}</button>:null
}
export default function DueStartPage({id='due-dau-an-50-nam'}:{id?:string}){
 const quest=getQuest(id)!
 const {state,dispatch,busy,error,loading,ready}=useQuestProgress()
 const [tab,setTab]=useState<'landmark'|'map'>('landmark')
 const [dialog,setDialog]=useState<'arrival'|'lost'|'help'|null>(null)
 const [locating,setLocating]=useState(false)
 const [location,setLocation]=useState<{sample:LocationSample|null;error:string}>({sample:null,error:''})
 const [copyNotice,setCopyNotice]=useState('')
 const run=state.quests[quest.id]
 const navigation=useQuestNavigationGuard(!!run&&!run.paused&&!run.completedAt,()=>dispatch({type:'pause',questId:id}),busy,`#/quest/${id}/choi`)
 const confirmed=!!run?.arrivalConfirmedAt
 const distance=location.sample?distanceMeters([location.sample.latitude,location.sample.longitude],quest.startPosition):null
 const near=location.sample&&hasArrived(location.sample,quest.startPosition)
 async function confirm(){if(await dispatch({type:'confirm-arrival',questId:quest.id}))setDialog(null)}
 async function copy(){try{await navigator.clipboard.writeText(quest.area);setCopyNotice(t("Đã sao chép địa chỉ."))}catch{setCopyNotice(t("Bạn có thể chọn và sao chép địa chỉ hiển thị bên trên."))}}
 return <main className="due-start" aria-labelledby="due-start-title">
  <div className="due-start-surface" inert={!!dialog||!!navigation.destination} aria-hidden={!!dialog||!!navigation.destination}>
  <header className="due-start-top"><a href={`#/quest/${quest.id}`} aria-label={t("Quay lại giới thiệu quest")}>‹</a><button aria-label={t("Trợ giúp điểm bắt đầu")} onClick={()=>setDialog('help')}><PlayerIcon kind="help"/></button></header>
  <div className="due-start-scroll"><div className="due-start-heading"><p className="due-quest-name">⚑ {displayText(quest.title)}</p><h1 id="due-start-title">{t("Tìm điểm bắt đầu")}</h1></div>
  <div className="due-start-grid"><section className="due-start-main"><div className={`due-distance ${confirmed?'confirmed':''}`} aria-live="polite"><span aria-hidden="true">{confirmed?'✓':'⌖'}</span><div><strong>{distance===null?t("Điểm hẹn quest"):formatMeters(distance)}</strong><p>{confirmed?t("Bạn đã tự xác nhận đến điểm bắt đầu"):near?t("Bạn đang ở gần (hãy đối chiếu biển tên)"):distance!==null?t("Khoảng cách đường thẳng từ thiết bị"):t("Đối chiếu địa chỉ hoặc bật vị trí để tìm đường")}</p></div></div>
   <div className="due-view-tabs" role="tablist" aria-label={t("Xem điểm bắt đầu")}><button id="due-landmark-tab" role="tab" aria-selected={tab==='landmark'} aria-controls="due-location-panel" onClick={()=>setTab('landmark')}>{t("Nhận diện")}</button><button id="due-map-tab" role="tab" aria-selected={tab==='map'} aria-controls="due-location-panel" onClick={()=>setTab('map')}>{t("Bản đồ")}</button></div>
   <section id="due-location-panel" role="tabpanel" aria-labelledby={tab==='map'?'due-map-tab':'due-landmark-tab'} className="due-landmark-card">{tab==='map'?<DueMap questId={id} sample={location.sample}/>:<button className="due-artwork-button" aria-label={t("Xem lớn dấu hiệu nhận diện")} onClick={()=>setDialog('arrival')}><QuestCover id={id} credit/><span className="due-expand-label">{t("⛶ Xem lớn")}</span></button>}<div className="due-address"><span aria-hidden="true">⌖</span><div><strong>{displayText(quest.area)}</strong><p>{id==='due-dau-an-50-nam'?t("71 Ngũ Hành Sơn, Đà Nẵng"):displayText(quest.area)}</p></div><button aria-label={t("Sao chép địa chỉ")} onClick={()=>void copy()}>▣</button></div></section>
   {copyNotice&&<p role="status">{copyNotice}</p>}
  </section><section className="due-start-side"><details className="due-before" open><summary>{t("Trước khi lên đường")}</summary><ul><li>{t("Pin đủ cho hành trình (nên từ 50%).")}</li><li>{t("Bật kết nối mạng để lưu tiến độ.")}</li><li>{t("Quan sát biển tên địa điểm ở khu vực công cộng.")}</li><li>{t("Không đứng giữa lối ra vào, không nhìn màn hình khi qua đường.")}</li></ul></details><div className="due-location-controls"><button className="due-secondary" onClick={()=>setLocating(true)} disabled={locating}>{locating?t("Đang dùng vị trí thiết bị"):t("Bật vị trí để tìm đường")}</button><p>{t("Vị trí chỉ hỗ trợ chỉ đường. Bạn cần tự đối chiếu điểm bắt đầu trước khi xác nhận.")}</p><a className="q-menu-item" href={`#/quest/${id}/dan-duong`}>{t("Mở chỉ đường từng chặng →")}</a>{locating&&<DeviceLocation onChange={setLocation}/>}<p role="status">{location.error}</p></div><p className="due-asset-note">{t("Hình trên là minh họa. Ảnh cổng DUE thực tế chưa được bổ sung.")}</p></section></div>
  </div>
  <footer className="due-start-actions">{error&&<p role="alert" className="q-error">{t(error)}</p>}{!run&&!loading?<a className="q-primary" href={`#/quest/${quest.id}`}>{t("Đọc giới thiệu để bắt đầu")}</a>:confirmed?<a className="q-primary" href={`#/quest/${quest.id}/choi`}>{t("Bắt đầu quest")}</a>:<button className="q-primary" disabled={busy||loading||!ready} onClick={()=>setDialog('arrival')}>{loading?t("Đang tải tiến độ…"):t("Xác nhận đã đến")}</button>}<button className="due-secondary" onClick={()=>setDialog('lost')}>{t("Không tìm thấy điểm bắt đầu?")}</button></footer>
  </div>
  {navigation.destination&&<PlayerDialog title={t("Lưu và rời hành trình?")} onClose={navigation.cancel}><p>{t("Bạn có thể quay lại điểm bắt đầu từ Quest của bạn. Chỉ chuyển trang sau khi tiến độ đã được lưu.")}</p>{error&&<p role="alert">{t(error)}</p>}<button className="q-primary" disabled={busy||navigation.saving} onClick={()=>void navigation.confirm()}>{navigation.saving?t("Đang lưu…"):t("Lưu và chuyển trang")}</button><button className="due-text-button" disabled={navigation.saving} onClick={navigation.cancel}>{t("Ở lại")}</button></PlayerDialog>}
  {dialog&&!navigation.destination&&<PlayerDialog title={dialog==='arrival'?t("Bạn đã nhìn thấy điểm bắt đầu?"):dialog==='lost'?t("Cần tìm đúng cổng trường?"):t("Trợ giúp điểm bắt đầu")} onClose={()=>{if(!busy)setDialog(null)}}>
   {dialog==='arrival'?<><QuestCover id={id} credit/><p className="due-arrival-address">{displayText(quest.area)}<br/>{id==='due-dau-an-50-nam'?t("71 Ngũ Hành Sơn, Đà Nẵng"):displayText(quest.area)}</p><p>{t("Đối chiếu biển tên địa điểm và địa chỉ bên trên. Đây là tự xác nhận bằng quan sát của bạn, không phải xác minh GPS hoặc ảnh.")}</p><p>{t("Chỉ xác nhận khi bạn đang ở đúng điểm, tại khu vực công cộng an toàn.")}</p>{error&&<p role="alert">{t(error)}</p>}<button className="due-purple" disabled={!run||!ready||busy} onClick={()=>void confirm()}>{busy?t("Đang lưu…"):t("Tôi đã đến đúng điểm này")}</button><button className="due-text-button" disabled={busy} onClick={()=>setDialog('lost')}>{t("Tôi vẫn chưa tìm thấy")}</button></>:dialog==='lost'?<><p>{t("Đối chiếu tên “")}{displayText(quest.area)}{t("” và địa chỉ hiển thị ở điểm bắt đầu. Không đi vào khu vực hạn chế.")}</p><button className="q-menu-item" onClick={()=>setDialog('arrival')}>{t("Xem dấu hiệu nhận diện")}</button><button className="q-menu-item" onClick={()=>{setTab('map');setDialog(null)}}>{t("Xem trên bản đồ")}</button><button className="q-menu-item" onClick={()=>setDialog('help')}>{t("Xem hướng dẫn và báo sự cố")}</button></>:<DueSupport questId={quest.id} checkpointId={quest.checkpointOrder[0]}/>}
  </PlayerDialog>}
 </main>
}
