import { hasPixelLandmarkSample, pixelLandmarkSample } from './lib/pixelLandmarkSamples'
import { pixelMapIcon } from './lib/pixelMapIcon'
import './ui/MapControls.css'
import {useEffect,useMemo,useRef,useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createBaseTileLayer } from './lib/mapTiles'
import './Explore.css'
import './MapResults.css'
import {createRoot} from 'react-dom/client'
import PixelAvatar from './PixelAvatar'
import {useOptionalAuth} from './AuthContext'
import {readAvatar,avatars,resolveAvatar} from './lib/avatar'
import {usePlayerLocation} from './lib/usePlayerLocation'
import { getDestination,categoryLabels,type DestinationCategory } from './data/destinations'
import { HeaderQuickToggles } from './PageTools'
import QuestCover from './QuestCover'
import {parseEvents,type EventItem} from './lib/events'
import {runEventFeedNotifications} from './lib/eventNotifier'
import {GREEN_TRANSIT_STATIONS, fetchLiveTransitStations, type GreenTransitStation} from './data/greenTransit'
import {mapEntries,type MapEntry} from './lib/mapEntries'
import {EventContext} from './lib/eventContext'
import {useContext} from 'react'
import {useLocale} from './i18n/LocaleProvider'
// [UX-FLOW] Tích hợp StartHub, CoachMarks, cờ MAP_ONE_KM và tính năng bán kính 1km
import StartHub from './StartHub'
import CoachMarks from './CoachMarks'
import { isUxFlagEnabled } from './lib/uxFlags'
import { getQuest } from './data/quests'
import { useQuestProgress } from './lib/useQuestProgress'
import { getQuestPricing, usePremiumAccess } from './lib/premium'
import { distanceMeters } from './lib/location'
import { formatMeters } from './lib/routing'
import { interpolate } from './i18n/locale'

export default function Explore(){
 const {t,locale}=useLocale(),container=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null)
 const [mode,setMode]=useState<'quests'|'events'>('quests'),[query,setQuery]=useState(''),[selectedCandidate,setSelected]=useState<MapEntry|null>(null),[attempt,setAttempt]=useState(0),[tileError,setTileError]=useState(false),[loading,setLoading]=useState(true),[ready,setReady]=useState(0),[message,setMessage]=useState(''),[locating,setLocating]=useState(false),[now,setNow]=useState(Date.now)
 const [avatar,setAvatar]=useState(()=>readAvatar()??avatars[0])
 const [showTransit,setShowTransit]=useState(false)
 const [zoom,setZoom]=useState(isUxFlagEnabled('MAP_ONE_KM') ? 15 : 12)
 const [mapBounds,setMapBounds]=useState<L.LatLngBounds|null>(null)
 const [transitStations,setTransitStations]=useState<GreenTransitStation[]>(()=>GREEN_TRANSIT_STATIONS.filter(s=>s.verified!==false))
 const {sample,error,updatePosition,retry}=usePlayerLocation()
 const {state:questProgress}=useQuestProgress()
 const eventContext=useContext(EventContext)
 const [feed,setFeed]=useState<EventItem[]>([])
 const auth=useOptionalAuth()
 const {hasAccess:hasQuestAccess}=usePremiumAccess(auth?.user?.id)
 const noticeOwner=auth?.status==='authenticated'&&auth.user?.id?auth.user.id:'guest'
 const eventNoticesEnabled=auth?.status==='authenticated'
  ?!!eventContext&&!eventContext.loading&&!eventContext.error&&eventContext.enabled
  :auth?.status==='checking'||auth?.status==='error'?false:eventContext?.enabled??true
 const playerAvatar=auth?.status==='authenticated'?(resolveAvatar(auth.user?.avatarId)??avatars[0]):avatar
 const fitted=useRef('')
 const [category,setCategory]=useState<DestinationCategory|'all'>('all')
 const [inView,setInView]=useState(false)
 const allEntries=useMemo(()=>mapEntries(mode,query,now,eventContext?.catalog,feed).filter(entry=>category==='all'||getDestination(entry.placeId??'')?.category===category),[mode,query,now,feed,eventContext?.catalog,locale,category])
 const entries=useMemo(()=>inView&&mapBounds?allEntries.filter(entry=>mapBounds.contains(entry.position)):allEntries,[allEntries,inView,mapBounds])
 const selected=entries.find(entry=>entry.id===selectedCandidate?.id)??null
 useEffect(()=>{if(selected?.id)Array.from(document.querySelectorAll<HTMLButtonElement>('.atlas-list>button')).find(button=>button.dataset.entryId===selected.id)?.scrollIntoView?.({block:'nearest'})},[selected?.id])

 useEffect(()=>{let alive=true;const controller=new AbortController();const load=()=>fetch('/api/events/feed',{signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{if(alive&&data)setFeed(parseEvents(data))}).catch(()=>{});void load();const timer=setInterval(load,60000);return()=>{alive=false;controller.abort();clearInterval(timer)}},[])
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer)},[])
 useEffect(()=>{let alive=true;fetchLiveTransitStations().then(stations=>{if(alive&&stations?.length)setTransitStations(stations)}).catch(()=>{});return()=>{alive=false}},[])
 useEffect(()=>{
  runEventFeedNotifications(feed,sample,now,noticeOwner,eventNoticesEnabled,eventContext?.catalog??[])
 },[feed,sample,now,noticeOwner,eventNoticesEnabled,eventContext?.catalog])
 useEffect(()=>{const update=()=>setAvatar(readAvatar()??avatars[0]);window.addEventListener('dana-avatar-changed',update);return()=>window.removeEventListener('dana-avatar-changed',update)},[])

 useEffect(()=>{
  if(!container.current)return
  let instance:L.Map|undefined,observer:ResizeObserver|undefined
  const timeout=setTimeout(()=>{setLoading(false);setTileError(true)},12000)
  try{
   // [UX-FLOW] MAP_ONE_KM: Tâm bản đồ quanh GPS hoặc Cầu Rồng ở mức zoom 15 (~1 km)
   const initialCenter: [number, number] = isUxFlagEnabled('MAP_ONE_KM')
     ? (sample ? [sample.latitude, sample.longitude] : [16.0601, 108.2236])
     : [16.0544, 108.2022]
   const initialZoom = isUxFlagEnabled('MAP_ONE_KM') ? 15 : 12

   instance=L.map(container.current,{zoomControl:false,scrollWheelZoom:true,minZoom:8}).setView(initialCenter, initialZoom)
   map.current=instance

   instance.on('zoomend',()=>{
     if(instance) {
       setZoom(instance.getZoom())
       try { setMapBounds(instance.getBounds()) } catch {}
     }
   })
   instance.on('moveend',()=>{
     if(instance) {
       try { setMapBounds(instance.getBounds()) } catch {}
     }
   })

   L.control.zoom({position:'bottomright',zoomInTitle:t('Phóng to','Zoom in'),zoomOutTitle:t('Thu nhỏ','Zoom out')}).addTo(instance)
   createBaseTileLayer().on('tileerror',()=>{setTileError(true);setLoading(false)}).on('tileload',()=>{clearTimeout(timeout);setTileError(false);setLoading(false)}).addTo(instance)
   const resize=()=>instance?.invalidateSize({pan:false});observer=new ResizeObserver(resize);observer.observe(container.current)
   queueMicrotask(()=>{
     setReady(n=>n+1)
     if(instance) {
       try { setMapBounds(instance.getBounds()) } catch {}
     }
   })
  }catch{setTileError(true);setLoading(false)}
  return()=>{clearTimeout(timeout);observer?.disconnect();instance?.remove();map.current=null}
 },[attempt,t])

 useEffect(()=>{
  const instance=map.current;if(!instance||ready===0)return
  const group=L.layerGroup().addTo(instance)
  allEntries.forEach(entry=>{
   const sampleIcon=hasPixelLandmarkSample(entry.placeId)
   const spriteScale=Math.min(.9,Math.max(.16,.7*Math.pow(2,zoom-14)))
   const icon=document.createElement('span');icon.className=`atlas-pin-symbol ${entry.kind}`;icon.innerHTML=sampleIcon?pixelLandmarkSample(entry.placeId):pixelMapIcon(entry.placeId);icon.classList.add('atlas-landmark-icon');if(sampleIcon){icon.classList.add('atlas-landmark-sample');icon.style.setProperty('--landmark-scale',String(spriteScale))}
   const marker=L.marker(entry.position,{title:entry.title,alt:entry.title,icon:L.divIcon({className:`atlas-pin ${entry.kind}${selected?.id===entry.id?' is-selected':''}`,html:icon,iconSize:sampleIcon?[156*spriteScale,96*spriteScale]:[48,54],iconAnchor:sampleIcon?[78*spriteScale,70*spriteScale]:[24,52]})}).addTo(group)
   marker.bindTooltip(entry.title).on('click',()=>setSelected(entry))
  })
  const cameraKey=JSON.stringify([ready,mode,query,category,allEntries.map(e=>[e.id,e.position])])
  if(allEntries.length&&fitted.current!==cameraKey){
    // [UX-FLOW] MAP_ONE_KM: Không fitBounds toàn bộ thành phố khi khởi tạo. Chỉ fit 1km hoặc khi tìm kiếm.
    if(isUxFlagEnabled('MAP_ONE_KM')){
      if(query||category!=='all'){
        instance.fitBounds(L.latLngBounds(allEntries.map(e=>e.position)),{padding:[45,45],maxZoom:15,animate:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches})
      } else {
        const center: [number, number] = sample ? [sample.latitude, sample.longitude] : [16.0601, 108.2236]
        const radiusMeters = 1000
        const latDelta = radiusMeters / 111320
        const lonDelta = radiusMeters / (111320 * Math.cos(center[0] * Math.PI / 180))
        const oneKmBounds = L.latLngBounds(
          [center[0] - latDelta, center[1] - lonDelta],
          [center[0] + latDelta, center[1] + lonDelta]
        )
        instance.fitBounds(oneKmBounds, { padding: [20, 20], maxZoom: 15, animate: false })
      }
    } else {
      instance.fitBounds(L.latLngBounds(allEntries.map(e=>e.position)),{padding:[45,45],maxZoom:15,animate:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches})
    }
    fitted.current=cameraKey
    try { setMapBounds(instance.getBounds()) } catch {}
  }
  return()=>{group.remove()}
 },[allEntries,ready,mode,query,category,selected?.id,sample,zoom])

 useEffect(()=>{
  const instance=map.current;if(!instance||ready===0||!showTransit||zoom<14)return
  const group=L.layerGroup().addTo(instance)
  transitStations.forEach(station=>{
   const pin=document.createElement('div');pin.className=`transit-map-pin ${station.type}`;pin.innerHTML=`<span>${station.type==='bike'?'🚲':'🚌'}</span>`
   const marker=L.marker(station.position,{title:station.name,icon:L.divIcon({className:'transit-div-icon',html:pin,iconSize:[48,48],iconAnchor:[24,24]})}).addTo(group)
   marker.bindTooltip(`${station.name} (+${station.bonusCoins} xu)`)
  })
  return()=>{group.remove()}
 },[showTransit,zoom,transitStations,ready])

 useEffect(()=>{
  const instance=map.current;if(!instance||!sample)return
  const element=document.createElement('div'),root=createRoot(element);root.render(<PixelAvatar avatar={playerAvatar}/>)
  const marker=L.marker([sample.latitude,sample.longitude],{title:t('Vị trí của bạn','Your location'),zIndexOffset:2000,icon:L.divIcon({className:'player-location-marker',html:element,iconSize:[48,60],iconAnchor:[24,60]})}).addTo(instance)
  const circle=L.circle([sample.latitude,sample.longitude],{radius:sample.accuracy,color:'#7560aa',weight:1,fillOpacity:.12}).addTo(instance)
  
  // [UX-FLOW] Vòng tròn bán kính đi bộ 1 km mờ nhẹ quanh người chơi
  const oneKmCircle = isUxFlagEnabled('MAP_ONE_KM')
    ? L.circle([sample.latitude, sample.longitude], {
        radius: 1000,
        color: '#216447',
        weight: 2,
        dashArray: '6, 8',
        fillColor: '#216447',
        fillOpacity: 0.05,
      }).addTo(instance)
    : null

  return()=>{
    marker.remove()
    circle.remove()
    oneKmCircle?.remove()
    queueMicrotask(()=>root.unmount())
  }
 },[sample,playerAvatar,ready,t])

 function locate(){
  if(!navigator.geolocation){setMessage(t('Thiết bị chưa hỗ trợ định vị.','This device does not support location.'));return}
  setLocating(true)
  navigator.geolocation.getCurrentPosition(p=>{
    setLocating(false)
    if(!updatePosition(p)){setMessage(t('Vị trí đã cũ. Hãy thử lại.','Location is stale. Please retry.'));return}
    map.current?.flyTo([p.coords.latitude,p.coords.longitude],16,{duration:.7,animate:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches})
    setMessage(t('Đã tìm thấy vị trí thiết bị.','Device location found.'))
    retry()
  },e=>{
    setLocating(false)
    setMessage(e.code===1?t('Hãy cho phép truy cập vị trí trong trình duyệt rồi thử lại.','Allow browser location access and retry.'):t('Chưa lấy được vị trí. Hãy bật GPS rồi thử lại.','Location unavailable. Enable GPS and retry.'))
  },{enableHighAccuracy:true,maximumAge:5000,timeout:10000})
 }

 function choose(entry:MapEntry){
   setSelected(entry)
   map.current?.flyTo(entry.position,16,{duration:.5,animate:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches})
 }

 // [UX-FLOW] Tính toán điểm quest gần nhất đang nằm ngoài tầm nhìn (< 2.5 km)
 const closestOffscreen = useMemo(() => {
   if (!isUxFlagEnabled('MAP_ONE_KM') || zoom < 14 || !mapBounds) return null
   const centerLat = sample ? sample.latitude : mapBounds.getCenter().lat
   const centerLng = sample ? sample.longitude : mapBounds.getCenter().lng

   let best: { entry: MapEntry; distance: number } | null = null

   for (const entry of entries) {
     if (!mapBounds.contains(entry.position)) {
       const dist = distanceMeters([centerLat, centerLng], entry.position)
       if (dist <= 2500) {
         if (!best || dist < best.distance) {
           best = { entry, distance: dist }
         }
       }
     }
   }
   return best
 }, [entries, zoom, mapBounds, sample])

  // [UX-FLOW] Ngân sách chiều cao giao diện mobile: Bottom sheet 3 mức (peek ~72px, half ~45vh, full ~85vh)
  const [sheetSnap, setSheetSnap] = useState<'peek' | 'half' | 'full'>('peek')
  const [isSheetDragging, setIsSheetDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartSnap = useRef<'peek' | 'half' | 'full'>('peek')

  const onGrabberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY
    dragStartSnap.current = sheetSnap
    setIsSheetDragging(true)
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}
  }

  const onGrabberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSheetDragging) return
    setIsSheetDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
    const deltaY = e.clientY - dragStartY.current
    if (deltaY < -40) {
      if (dragStartSnap.current === 'peek') setSheetSnap('half')
      else if (dragStartSnap.current === 'half') setSheetSnap('full')
    } else if (deltaY > 40) {
      if (dragStartSnap.current === 'full') setSheetSnap('half')
      else if (dragStartSnap.current === 'half') setSheetSnap('peek')
    } else {
      setSheetSnap(curr => (curr === 'peek' ? 'half' : 'peek'))
    }
  }

  const selectedDistance = useMemo(() => {
    if (!selected || !sample) return null
    return distanceMeters([sample.latitude, sample.longitude], selected.position)
  }, [selected, sample])

  const selectedPlace = selected ? getDestination(selected.placeId ?? '') : undefined
  const selectedQuest = selected?.kind === 'quest' && selected.placeId ? getQuest(selected.placeId) : undefined


 return <main className="explore-page atlas-page atlas-results-layout">
  <aside
    className={`atlas-sidebar ${isUxFlagEnabled('MOBILE_MAP_FIRST') ? `atlas-sidebar--snap-${sheetSnap}` : ''}`}
    data-snap={sheetSnap}
    aria-label={t('Danh sách trên bản đồ','Map places')}
  >
   {/* [UX-FLOW] Thanh kéo Bottom Sheet 3 mức trên điện thoại */}
   {isUxFlagEnabled('MOBILE_MAP_FIRST') && (
     <div
       className="atlas-sheet-grabber"
       onPointerDown={onGrabberPointerDown}
       onPointerUp={onGrabberPointerUp}
       onPointerCancel={()=>setIsSheetDragging(false)}
       onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSheetSnap(value=>value==='peek'?'half':value==='half'?'full':'peek')}}}
       aria-expanded={sheetSnap!=='peek'}
       role="button"
       tabIndex={0}
       aria-label={t('Kéo mở danh sách địa điểm', 'Drag places list')}
       title={t('Chạm hoặc kéo để mở danh sách', 'Tap or drag to expand list')}
     >
       <span className="atlas-sheet-handle" aria-hidden="true" />
       <div className="atlas-sheet-peek-row">
         <span className="atlas-sheet-peek-title">
           <strong>{entries.length}</strong> {t('điểm quanh bạn', 'places near you')}
         </span>
         {sample && (
           <span className="atlas-sheet-peek-acc" title={t('Độ chính xác GPS', 'GPS accuracy')}>
             ±{Math.ceil(sample.accuracy)}m
           </span>
         )}
         <span className="atlas-sheet-chevron" aria-hidden="true">
           {sheetSnap === 'peek' ? '▲' : '▼'}
         </span>
       </div>
     </div>
   )}
   <div className="atlas-sidebar-top">
    <div className="atlas-sidebar-header-row">
     <a className="atlas-back dq-back-btn" href="#/kham-pha" aria-label={t('Khám phá','Discover')}>← {t('Quay lại','Back')}</a>
     <h1>{t('Kết quả','Results')}</h1><HeaderQuickToggles compact />
     </div>
    <label className="atlas-search"><span className="sr-only">{t('Tìm kiếm trên bản đồ','Search map')}</span><span aria-hidden="true">⌕</span><input type="search" value={query} onFocus={()=>{if(sheetSnap==='peek')setSheetSnap('half')}} onChange={e=>{setQuery(e.target.value);setSelected(null);if(sheetSnap==='peek')setSheetSnap('half')}} placeholder={t('Tìm địa điểm, quest…','Search places, quests…')}/></label>

   </div>
   <div className="atlas-list-heading"><strong>{entries.length} {t('điểm trên bản đồ','map places')}</strong><span>{mode==='quests'?'✦':'◆'} {mode==='quests'?t('Quest','Quest'):t('Sự kiện','Events')}</span></div>
   <div className="atlas-list">{entries.map(entry=>{const place=getDestination(entry.placeId??'');const quest=entry.kind==='quest'&&entry.placeId?getQuest(entry.placeId):undefined;const run=quest?questProgress.quests[quest.id]:undefined;const pricing=quest?getQuestPricing(quest.id):null;const unlocked=quest?hasQuestAccess(quest.id):true;const showQuestSubtitle=Boolean(place?.name&&place.name!==entry.title);return <button key={entry.id} data-entry-id={entry.id} className={selected?.id===entry.id?'selected':''} aria-pressed={selected?.id===entry.id} onClick={()=>{choose(entry);setSheetSnap('peek')}}>
    <span className="atlas-result-photo"><QuestCover id={entry.placeId??''}/></span>
    <span className="atlas-result-copy">
     <span className="atlas-result-badges">
      <small className="atlas-result-category">{place?categoryLabels[place.category]:entry.kind==='quest'?t('Quest','Quest'):t('Sự kiện','Event')}</small>
      {pricing&&<small className={`atlas-result-price ${pricing.isPaid?(unlocked?'is-unlocked':'is-paid'):'is-free'}`}>{pricing.isPaid?(unlocked?t('✓ Đã mở khóa','✓ Unlocked'):`★ ${pricing.currencyLabel}`):t('Miễn phí','Free')}</small>}
      {run&&<small className={`atlas-result-status ${run.completedAt?'is-done':'is-active'}`}>{run.completedAt?t('Đã hoàn thành','Completed'):t('Đang chơi','In progress')}</small>}
     </span>
     <strong>{place?.name??entry.title}</strong>
     {showQuestSubtitle&&<small className="atlas-result-quest">{entry.title}</small>}
     <small className="atlas-result-address">{entry.subtitle}</small>
     <span className="atlas-result-footer">
      {quest?<small className="atlas-result-meta">⏱ {quest.estimatedMinutes} {t('phút','min')} · {quest.checkpoints.length} {t('thử thách','steps')}</small>:entry.start?<small className="atlas-result-meta">{new Date(entry.start).toLocaleString(locale==='en'?'en-US':'vi-VN',{dateStyle:'medium',timeStyle:'short'})}</small>:<span/>}
      <span className="atlas-result-action">{t('Xem trên bản đồ','Show on map')} ↗</span>
     </span>
    </span>
   </button>})}{!entries.length&&<div className="atlas-empty"><strong>{t('Chưa có kết quả phù hợp','No matching results')}</strong><p>{t('Thử từ khóa khác hoặc mở rộng vùng bản đồ.','Try another search or expand the map area.')}</p><button onClick={()=>{setQuery('');setCategory('all');setInView(false)}}>{t('Xóa bộ lọc','Clear filters')}</button></div>}</div>

  </aside>
  <section className="atlas-map-area" aria-label={t('Bản đồ Đà Nẵng','Da Nang map')}>
   <div ref={container} className="map atlas-map"/>
   <div className="atlas-top-controls">
    <div className="atlas-mode-filters" role="group" aria-label={t('Nội dung bản đồ','Map content')}>
     <button aria-pressed={mode==='quests'} onClick={()=>{setMode('quests');setSelected(null)}}>✦ {t('Địa điểm quest','Quest places')}</button>
     <button aria-pressed={mode==='events'} onClick={()=>{setMode('events');setSelected(null)}}>◆ {t('Sự kiện','Events')}</button>
    </div>
    <div className="atlas-category-filters" role="group" aria-label={t('Loại địa điểm','Place categories')}>
     <button aria-pressed={category==='all'} onClick={()=>{setCategory('all');setSelected(null)}}>{t('Tất cả','All')}</button>
     {(['museum','landmark','park','beach','pagoda','nature','heritage'] as const).map(key=><button key={key} aria-pressed={category===key} onClick={()=>{setCategory(key);setSelected(null);setSheetSnap('half')}}>{categoryLabels[key]}</button>)}
    </div>
    <button className="atlas-transit-chip" aria-pressed={showTransit} onClick={()=>setShowTransit(value=>!value)}>🚲 {t('Trạm xe xanh','Eco transit')}</button>
   </div>
   <label className="atlas-viewport-filter"><input type="checkbox" checked={inView} onChange={event=>setInView(event.target.checked)}/>{t('Tìm trong vùng bản đồ','Search this map area')}</label>
   <button className="atlas-map-locate" onClick={locate} disabled={locating} aria-label={t('Vị trí của tôi','My location')} title={t('Vị trí của tôi','My location')}>{locating?'…':'◎'}</button>
   {(message||error)&&<p className="atlas-location-feedback" role="status">{message||error}</p>}

   {/* [UX-FLOW] Nút xem toàn cảnh thành phố khi bật MAP_ONE_KM */}
   {isUxFlagEnabled('MAP_ONE_KM') && (
     <button
       type="button"
       className="atlas-city-fit-btn"
       onClick={() => {
         if (allEntries.length && map.current) {
           map.current.fitBounds(L.latLngBounds(allEntries.map(e => e.position)), {
             padding: [45, 45],
             maxZoom: 15,
             animate: !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
           })
         }
       }}
       title={t('Xem toàn cảnh thành phố', 'View entire city')}
     >
       🌐 {t('Toàn thành phố', 'Entire city')}
     </button>
   )}
   {/* [UX-FLOW] StartHub overlay trên bản đồ khi chưa chọn điểm cụ thể */}
   {isUxFlagEnabled('START_HUB') && !selected && !query && category==='all' && mode==='quests' && (
     <StartHub
       variant="overlay"
       onSelectQuest={id => {
         const found = entries.find(e => e.id === `quest:${id}`)
         if (found) choose(found)
       }}
     />
   )}
   {/* [UX-FLOW] Chỉ báo điểm gần nhất ngoài tầm nhìn (< 2.5 km) */}
   {closestOffscreen && !selected && (
     <button
       type="button"
       className="atlas-offscreen-chip"
       onClick={() => choose(closestOffscreen.entry)}
       aria-label={interpolate(t('Điểm gần nhất ngoài màn hình: ${0} (${1})'), [
         closestOffscreen.entry.title,
         formatMeters(closestOffscreen.distance),
       ])}
     >
       <span aria-hidden="true">{closestOffscreen.entry.kind === 'quest' ? '✦' : '◆'}</span>
       <strong>{closestOffscreen.entry.title}</strong>
       <small>({formatMeters(closestOffscreen.distance)}) →</small>
     </button>
   )}
   {/* [UX-FLOW] Bong bóng hướng dẫn tương tác lần đầu */}
   {isUxFlagEnabled('COACH_MARKS') && <CoachMarks />}
   {loading&&<p className="atlas-map-status" role="status">{t('Đang tải bản đồ…','Loading map…')}</p>}
   {tileError&&<div className="atlas-map-status" role="alert">{t('Nền bản đồ chưa tải đầy đủ. Danh sách vẫn dùng được.','Map tiles are unavailable. The list remains available.')} <button onClick={()=>{setTileError(false);setLoading(true);setAttempt(n=>n+1)}}>{t('Thử lại','Retry')}</button></div>}
    {selected && (
      <article className="atlas-selection">
        <button className="atlas-selection-close" aria-label={t('Đóng','Close')} onClick={()=>setSelected(null)}>×</button>
        <div className="atlas-selection-head">
          {selected.placeId && <span className="atlas-selection-thumb"><QuestCover id={selected.placeId}/></span>}
          <div className="atlas-selection-info">
            <div className="atlas-selection-meta">
          <small>{selected.kind==='quest'?t('Hành trình khám phá','Exploration quest'):t('Sự kiện sắp tới','Upcoming event')}</small>
          {selectedQuest&&(()=>{const sp=getQuestPricing(selectedQuest.id);const su=hasQuestAccess(selectedQuest.id);return <small className={`atlas-result-price ${sp.isPaid?(su?'is-unlocked':'is-paid'):'is-free'}`}>{sp.isPaid?(su?t('✓ Đã mở khóa','✓ Unlocked'):`★ ${sp.currencyLabel}`):t('Miễn phí','Free')}</small>})()}
          {selectedDistance !== null && (
            <span className="atlas-selection-dist">📍 {formatMeters(selectedDistance)}</span>
          )}
        </div>
            <h2>{selectedPlace?.name ?? selected.title}</h2>
            {selectedPlace?.name && selectedPlace.name !== selected.title && <small className="atlas-selection-quest">{selected.title}</small>}
            {selectedQuest && <span className="atlas-selection-steps">⏱ {selectedQuest.estimatedMinutes} {t('phút','min')} · {selectedQuest.checkpoints.length} {t('thử thách','steps')}</span>}
          </div>
        </div>
        <p className="atlas-selection-address">{selected.subtitle}</p>
        <div className="atlas-selection-actions">
        <a href={selected.href} className="atlas-selection-link">{t('Xem chi tiết','View details')} →</a>
          {(selectedPlace||selectedQuest)&&selected.placeId&&<a className="atlas-directions-link" href={`#/chi-duong/${selected.placeId}?tu=map`}>↗ {t('Chỉ đường','Directions')}</a>}
        </div>
      </article>
    )}
  </section>
 </main>
}
