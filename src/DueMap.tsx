import './ui/MapControls.css'
import { t } from './i18n/locale'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LocationSample } from './lib/location'
import { useWalkingRoute } from './lib/useWalkingRoute'
import { formatMeters, nextTurnText, turnText } from './lib/routing'
import { getQuest } from './data/quests'
import { interpolate } from './i18n/locale'

export default function DueMap({sample=null,questId='due-dau-an-50-nam'}:{sample?:LocationSample|null;questId?:string}) {
 const quest=getQuest(questId)!
 const node=useRef<HTMLDivElement>(null)
 const map=useRef<L.Map|null>(null)
 const player=useRef<L.CircleMarker|null>(null)
 const line=useRef<L.Polyline|null>(null)
 const [error,setError]=useState(false)
 const navigation=useWalkingRoute(quest.id,sample,quest.startPosition)
 useEffect(()=>{
  if(!node.current)return
  const view=L.map(node.current,{scrollWheelZoom:false}).setView(quest.startPosition,17);map.current=view
  view.attributionControl.setPrefix(false)
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(view)
  tiles.on('tileerror',()=>setError(true));tiles.on('tileload',()=>setError(false))
  const timer=window.setTimeout(()=>setError(true),12000)
  tiles.once('load',()=>window.clearTimeout(timer))
  L.circleMarker(quest.startPosition,{radius:13,color:'#7955f5',fillColor:'#70deb0',fillOpacity:1,weight:5}).addTo(view).bindTooltip(t("Điểm bắt đầu"))
  const resize=new ResizeObserver(()=>view.invalidateSize());resize.observe(node.current)
  return()=>{resize.disconnect();window.clearTimeout(timer);view.remove();map.current=null;player.current=null;line.current=null}
 },[quest])
 useEffect(()=>{
  const view=map.current;if(!view||!sample)return
  const point:L.LatLngExpression=[sample.latitude,sample.longitude]
  if(!player.current)player.current=L.circleMarker(point,{radius:8,color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1}).addTo(view).bindTooltip(t("Vị trí thiết bị"))
  else player.current.setLatLng(point)
  if(navigation.route){
   const coords=navigation.route.geometry.coordinates.map(([lng,lat])=>[lat,lng] as [number,number])
   if(!line.current)line.current=L.polyline(coords,{color:'#7955f5',weight:5}).addTo(view);else line.current.setLatLngs(coords)
   view.fitBounds(line.current.getBounds(),{padding:[35,35],maxZoom:17,animate:false})
  }
 },[sample,navigation.route])
 const progress=navigation.usable?navigation.progress:null
 const instruction=progress?progress.toTurn<=12?navigation.precise?turnText(progress.next):t("Gần chỗ rẽ · vị trí ước tính"):interpolate("Đi thẳng ${0}",[formatMeters(progress.toTurn)]):''
 return <div className="due-map-wrap"><div ref={node} className="due-map" role="region" aria-label={t("Bản đồ điểm bắt đầu")}/>{error&&<p className="due-map-notice" role="status">{t("Chưa tải được nền bản đồ. Hãy dùng địa chỉ và dấu hiệu nhận diện bên dưới.")}</p>}{navigation.busy&&<p role="status">{t("Đang tìm tuyến đi bộ…")}</p>}{navigation.error&&<p role="status">{navigation.error} {" " + t("Bạn vẫn có thể đối chiếu địa chỉ.")}</p>}{progress&&<p className="due-route-caption" aria-live="polite">{instruction} · {t("Còn") + " "}{formatMeters(progress.remaining)}{progress.toTurn>12&&<> · {interpolate("Sau đó ${0}",[nextTurnText(progress.next)])}</>}</p>}</div>
}
