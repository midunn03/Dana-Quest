import { localized } from '../i18n/locale'
import catalog from '../../shared/city-events.json'
import { occurrenceFor } from '../../shared/event-policy.mjs'
export interface CityEvent {
 id:string;title:string;summary:string;location:string;scheduleLabel:string;startAt?:string;endAt?:string;destinationId?:string;reminderMinutes?:number;recurring?:'dragon-weekend';sourceUrl:string;status:'confirmed'|'expected'|'cancelled';category:string;area:string;price:string;image:string;tips:string;allDay?:boolean
}
export const cityEvents=localized(catalog as CityEvent[])
export const getCityEvent=(id:string)=>cityEvents.find(event=>event.id===id)
export function nextEventOccurrence(event:CityEvent,from=new Date()) { const occurrence=occurrenceFor(event,from.getTime());return occurrence&&occurrence.start>from.getTime()?new Date(occurrence.start):null }
