import {localeTag} from '../i18n/locale'
import {createContext,useContext} from 'react'
import type {CityEvent} from '../data/events'
import type {EventDecision,Occurrence} from '../../shared/event-policy.mjs'
export type EventState={events:{decisions:Record<string,EventDecision>;lastShown:number};enabled:boolean;serverNow:number;catalog?:CityEvent[];notice?:'invite'|'reminder'|null}
export type ActiveEventNotice={event:CityEvent;occurrence:Occurrence;kind:'invite'|'reminder'}
export type EventContextType={catalog?:CityEvent[];decisions:Record<string,EventDecision>;now:number;enabled:boolean;loading:boolean;error:string;act:(event:CityEvent,occurrence:Occurrence,action:'attend'|'later'|'remove')=>Promise<void>;refresh:()=>void}
export const EventContext=createContext<EventContextType|null>(null)
export function useEvents(){const value=useContext(EventContext);if(!value)throw Error('EventProvider missing');return value}
export const formatEventTime=(time:number)=>new Date(time).toLocaleString(localeTag(),{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'})
export const inQuest=(route:string)=>/^#\/(quest\/[^/]+\/(choi|chi-duong)|nhiem-vu\/|chi-duong\/|may-anh\/)/.test(route)
