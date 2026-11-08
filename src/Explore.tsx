import './ui/MapControls.css'
import {useEffect,useMemo,useRef,useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Explore.css'
import {createRoot} from 'react-dom/client'
import PixelAvatar from './PixelAvatar'
import {useOptionalAuth} from './AuthContext'
import {readAvatar,avatars,resolveAvatar} from './lib/avatar'
import {usePlayerLocation} from './lib/usePlayerLocation'
import {pixelTileLayer} from './lib/pixelTiles'
import {parseEvents,type EventItem} from './lib/events'
import {runEventFeedNotifications} from './lib/eventNotifier'
import {mapEntries,type MapEntry} from './lib/mapEntries'
import {EventContext} from './lib/eventContext'
import {useContext} from 'react'
import {useLocale} from './i18n/LocaleProvider'

export default function Explore(){
 const {t,locale}=useLocale(),container=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null)
 const [mode,setMode]=useState<'quests'|'events'>('quests'),[query,setQuery]=useState(''),[selectedCandidate,setSelected]=useState<MapEntry|null>(null),[attempt,setAttempt]=useState(0),[tileError,setTileError]=useState(false),[loading,setLoading]=useState(true),[ready,setReady]=useState(0),[message,setMessage]=useState(''),[locating,setLocating]=useState(false),[now,setNow]=useState(Date.now)
 const [avatar,setAvatar]=useState(()=>readAvatar()??avatars[0])
 const {sample,error,updatePosition,retry}=usePlayerLocation()
 const eventContext=useContext(EventContext)
 const [feed,setFeed]=useState<EventItem[]>([])
 const auth=useOptionalAuth()
 const noticeOwner=auth?.status==='authenticated'&&auth.user?.id?auth.user.id:'guest'
 const eventNoticesEnabled=auth?.status==='authenticated'
  ?!!eventContext&&!eventContext.loading&&!eventContext.error&&eventContext.enabled
  :auth?.status==='checking'||auth?.status==='error'?false:eventContext?.enabled??true
 const playerAvatar=auth?.status==='authenticated'?(resolveAvatar(auth.user?.avatarId)??avatars[0]):avatar
 const fitted=useRef('')
 const entries=useMemo(()=>mapEntries(mode,query,now,eventContext?.catalog,feed),[mode,query,now,feed,eventContext?.catalog,locale])
 const selected=entries.find(entry=>entry.id===selectedCandidate?.id)??null
 useEffect(()=>{let alive=true;const controller=new AbortController();const load=()=>fetch('/api/events/feed',{signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{if(alive&&data)setFeed(parseEvents(data))}).catch(()=>{});void load();const timer=setInterval(load,60000);return()=>{alive=false;controller.abort();clearInterval(timer)}},[])
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer)},[])
 useEffect(()=>{
  runEventFeedNotifications(feed,sample,now,noticeOwner,eventNoticesEnabled,eventContext?.catalog??[])
 },[feed,sample,now,noticeOwner,eventNoticesEnabled,eventContext?.catalog])
 useEffect(()=>{const update=()=>setAvatar(readAvatar()??avatars[0]);window.addEventListener('dana-avatar-changed',update);return()=>window.removeEventListener('dana-avatar-changed',update)},[])
 useEffect(()=>{
  if(!container.current)return
  let instance:L.Map|undefined,observer:ResizeObserver|undefined
  const timeout=setTimeout(()=>{setLoading(false);setTileError(true)},12000)
  try{
   instance=L.map(container.current,{zoomControl:false,scrollWheelZoom:false,minZoom:8}).setView([16.0544,108.2022],12);map.current=instance
   L.control.zoom({position:'topright',zoomInTitle:t('Phóng to','Zoom in'),zoomOutTitle:t('Thu nhỏ','Zoom out')}).addTo(instance)
   pixelTileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).on('tileerror',()=>{setTileError(true);setLoading(false)}).on('tileload',()=>{clearTimeout(timeout);setLoading(false)}).addTo(instance)
   const resize=()=>instance?.invalidateSize({pan:false});observer=new ResizeObserver(resize);observer.observe(container.current)
   queueMicrotask(()=>setReady(n=>n+1))
  }catch{setTileError(true);setLoading(false)}
  return()=>{clearTimeout(timeout);observer?.disconnect();instance?.remove();map.current=null}
 },[attempt,t])
 useEffect(()=>{
  const instance=map.current;if(!instance||ready===0)return
  const group=L.layerGroup().addTo(instance)
  entries.forEach(entry=>{
   const icon=document.createElement('span');icon.className=`atlas-pin-symbol ${entry.kind}`;icon.textContent=entry.kind==='quest'?'✦':'◆'
   const marker=L.marker(entry.position,{title:entry.title,alt:entry.title,icon:L.divIcon({className:`atlas-pin ${entry.kind}${selected?.id===entry.id?' is-selected':''}`,html:icon,iconSize:[34,42],iconAnchor:[17,38]})}).addTo(group)
   marker.bindTooltip(entry.title).on('click',()=>setSelected(entry))
  })
  const cameraKey=JSON.stringify([ready,mode,query,entries.map(e=>[e.id,e.position])])
  if(entries.length&&fitted.current!==cameraKey)instance.fitBounds(L.latLngBounds(entries.map(e=>e.position)),{padding:[45,45],maxZoom:15,animate:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches})
  fitted.current=cameraKey
  return()=>{group.remove()}
 },[entries,ready,mode,query,selected?.id])
 useEffect(()=>{
  const instance=map.current;if(!instance||!sample)return
  const element=document.createElement('div'),root=createRoot(element);root.render(<PixelAvatar avatar={playerAvatar}/>)
  const marker=L.marker([sample.latitude,sample.longitude],{title:t('Vị trí của bạn','Your location'),zIndexOffset:2000,icon:L.divIcon({className:'player-location-marker',html:element,iconSize:[48,60],iconAnchor:[24,60]})}).addTo(instance)
  const circle=L.circle([sample.latitude,sample.longitude],{radius:sample.accuracy,color:'#7560aa',weight:1,fillOpacity:.12}).addTo(instance)
  return()=>{marker.remove();circle.remove();queueMicrotask(()=>root.unmount())}
 },[sample,playerAvatar,ready,t])
 function locate(){
  if(!navigator.geolocation){setMessage(t('Thiết bị chưa hỗ trợ định vị.','This device does not support location.'));return}
  setLocating(true)
  navigator.geolocation.getCurrentPosition(p=>{setLocating(false);if(!updatePosition(p)){setMessage(t('Vị trí đã cũ. Hãy thử lại.','Location is stale. Please retry.'));return}map.current?.flyTo([p.coords.latitude,p.coords.longitude],16,{duration:.7,animate:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches});setMessage(t('Đã tìm thấy vị trí thiết bị.','Device location found.'));retry()},e=>{setLocating(false);setMessage(e.code===1?t('Hãy cho phép truy cập vị trí trong trình duyệt rồi thử lại.','Allow browser location access and retry.'):t('Chưa lấy được vị trí. Hãy bật GPS rồi thử lại.','Location unavailable. Enable GPS and retry.'))},{enableHighAccuracy:true,maximumAge:5000,timeout:10000})
 }
 function choose(entry:MapEntry){setSelected(entry);map.current?.flyTo(entry.position,16,{duration:.5,animate:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches})}
 return <main className="explore-page atlas-page">
  <aside className="atlas-sidebar" aria-label={t('Danh sách trên bản đồ','Map places')}>
   <header><a href="#/kham-pha">← {t('Khám phá','Discover')}</a><h1>{t('Bản đồ hành trình','Adventure map')}</h1><p>{t('Chọn điểm hẹn, tìm câu chuyện tiếp theo.','Find a meeting point and your next story.')}</p></header>
   <label className="atlas-search"><span className="sr-only">{t('Tìm kiếm trên bản đồ','Search map')}</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('Tìm quest, địa điểm, sự kiện…','Search quests, places, events…')}/></label>
   <div className="atlas-filters" aria-label={t('Bộ lọc bản đồ','Map filters')}><button aria-pressed={mode==='quests'} onClick={()=>{setMode('quests');setSelected(null)}}>✦ {t('Địa điểm quest','Quest places')}</button><button aria-pressed={mode==='events'} onClick={()=>{setMode('events');setSelected(null)}}>◆ {t('Sự kiện sắp tới','Upcoming events')}</button></div>
   <div className="atlas-location"><button onClick={locate} disabled={locating}>◎ {locating?t('Đang định vị…','Locating…'):t('Vị trí của tôi','My location')}</button><small role="status">{message||error||(sample?t(`Sai số vị trí ±${Math.ceil(sample.accuracy)} m`,`Location accuracy ±${Math.ceil(sample.accuracy)} m`):t('Cho phép định vị để đưa nhân vật lên bản đồ.','Allow location to place your avatar on the map.'))}</small></div>
   <div className="atlas-list-heading"><strong>{entries.length} {t('điểm trên bản đồ','map places')}</strong><span>{mode==='quests'?'✦':'◆'} {mode==='quests'?t('Quest','Quest'):t('Sự kiện','Events')}</span></div>
   <div className="atlas-list">{entries.map(entry=><button key={entry.id} className={selected?.id===entry.id?'selected':''} onClick={()=>choose(entry)}><span className={`atlas-list-icon ${entry.kind}`}>{entry.kind==='quest'?'✦':'◆'}</span><span><strong>{entry.title}</strong><small>{entry.subtitle}</small>{entry.start&&<small>{new Date(entry.start).toLocaleString(locale==='en'?'en-US':'vi-VN',{dateStyle:'medium',timeStyle:'short'})}</small>}</span><span aria-hidden="true">↗</span></button>)}{!entries.length&&<p className="atlas-empty">{t('Chưa có điểm phù hợp. Hãy đổi bộ lọc hoặc từ khóa.','No matching places. Change the filter or search.')}</p>}</div>
  </aside>
  <section className="atlas-map-area" aria-label={t('Bản đồ Đà Nẵng','Da Nang map')}><div ref={container} className="map atlas-map"/>{loading&&<p className="atlas-map-status" role="status">{t('Đang tải bản đồ…','Loading map…')}</p>}{tileError&&<div className="atlas-map-status" role="alert">{t('Nền bản đồ chưa tải đầy đủ. Danh sách vẫn dùng được.','Map tiles are unavailable. The list remains available.')} <button onClick={()=>{setTileError(false);setLoading(true);setAttempt(n=>n+1)}}>{t('Thử lại','Retry')}</button></div>}{selected&&<article className="atlas-selection"><button className="atlas-selection-close" aria-label={t('Đóng','Close')} onClick={()=>setSelected(null)}>×</button><small>{selected.kind==='quest'?t('Hành trình khám phá','Exploration quest'):t('Sự kiện sắp tới','Upcoming event')}</small><h2>{selected.title}</h2><p>{selected.subtitle}</p><a href={selected.href}>{t('Xem chi tiết','View details')} →</a></article>}</section>
 </main>
}
