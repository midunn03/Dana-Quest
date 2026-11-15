import './ui/MapControls.css'
import { t } from './i18n/locale'
import {useEffect,useRef,useState} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type {Quest} from './data/quests'
export default function QuestPreviewMap({quest}:{quest:Quest}){
 const node=useRef<HTMLDivElement>(null),[error,setError]=useState(false)
 useEffect(()=>{
  if(!node.current)return
  const view=L.map(node.current,{scrollWheelZoom:false}).setView(quest.startPosition,17)
  view.attributionControl.setPrefix(false)
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(view)
  tiles.on('tileerror',()=>setError(true))
  const timer=setTimeout(()=>setError(true),10000);tiles.once('load',()=>clearTimeout(timer))
  L.circleMarker(quest.startPosition,{radius:10,color:'#df2776',fillColor:'#df2776',fillOpacity:1}).addTo(view).bindTooltip(t("Điểm bắt đầu"))
  for(const cp of quest.checkpoints)if(cp.position)L.circleMarker(cp.position,{radius:7,color:'#5b9a4b'}).addTo(view).bindTooltip(cp.title)
  const resize=new ResizeObserver(()=>view.invalidateSize());resize.observe(node.current)
  return()=>{clearTimeout(timer);resize.disconnect();view.remove()}
 },[quest])
 return <div className="qd-map-content"><div ref={node} className="qd-preview-map" role="region" aria-label={t("Bản đồ điểm bắt đầu quest")}/>{error&&<p role="status">{t("Chưa tải được nền bản đồ. Bạn vẫn có thể dùng địa chỉ và danh sách bên dưới.")}</p>}<p>{t("Chỉ hiển thị các tọa độ đã có. Chưa có đủ dữ liệu để vẽ tuyến đi bộ hoặc tính quãng đường toàn quest.")}</p><ol>{quest.checkpoints.map(cp=><li key={cp.id}><strong>{cp.title}</strong><p>{cp.placeLabel}</p></li>)}</ol><a className="qd-primary" href={`#/quest/${quest.id}/dan-duong`}>{t("Chỉ đường đi bộ từng chặng →")}</a></div>
}
