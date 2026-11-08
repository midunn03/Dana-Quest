import {destinations} from '../data/destinations'
import {quests} from '../data/quests'
import {cityEvents,type CityEvent} from '../data/events'
import {occurrenceFor} from '../../shared/event-policy.mjs'
import type {EventItem} from './events'
import {searchText} from './filters'
export type MapEntry={id:string;title:string;subtitle:string;position:[number,number];href:string;kind:'quest'|'event';start?:number}
export function mapEntries(mode:'quests'|'events',query:string,now:number,events:CityEvent[]=cityEvents,feed:EventItem[]=[]):MapEntry[]{
 const entries:MapEntry[]=mode==='quests'?quests.map(q=>({id:`quest:${q.id}`,title:q.title,subtitle:q.area,position:q.startPosition,href:`#/quest/${q.id}`,kind:'quest'})):events.flatMap(e=>{
  const occurrence=occurrenceFor(e,now),place=destinations.find(p=>p.id===e.destinationId)
  if(e.status!=='confirmed'||!occurrence||occurrence.end<=now||!place)return []
  return [{id:`event:${e.id}`,title:e.title,subtitle:e.location,position:place.position,href:`#/su-kien/${e.id}`,kind:'event' as const,start:occurrence.start}]
 }).sort((a,b)=>(a.start??0)-(b.start??0))
 if(mode==='events')entries.push(...feed.flatMap(event=>{
  const place=destinations.find(p=>p.id===event.placeId),start=Date.parse(event.start),end=Date.parse(event.end)
  if(!place||!Number.isFinite(start)||!Number.isFinite(end)||end<=now)return []
  return [{id:`django:${event.id}:${event.start}`,title:event.title,subtitle:event.placeName,position:place.position,href:`#/dia-diem/${place.id}`,kind:'event' as const,start}]
 }))
 entries.sort((a,b)=>(a.start??0)-(b.start??0))
 const search=searchText(query)
 return entries.filter(e=>!search||searchText(`${e.title} ${e.subtitle} ${e.id}`).includes(search))
}
