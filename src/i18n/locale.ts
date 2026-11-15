import englishMessages from './messages.en.json'
export type Locale = 'vi' | 'en'
export type Language = Locale | 'system'
const listeners = new Set<()=>void>()
let current:Locale='vi'
export const languageStorageKey=(owner?:string)=>`dana-language:${owner?`account:${owner}`:'guest'}`
export const resolveLocale=(language:Language,system=typeof navigator==='undefined'?'vi':navigator.language):Locale=>language==='system'?(system.toLowerCase().startsWith('vi')?'vi':'en'):language
export const getLocale=()=>current
export function setLocale(locale:Locale,notify=true){current=locale;if(typeof document!=='undefined')document.documentElement.lang=locale;if(notify)listeners.forEach(listener=>listener())}
export const subscribeLocale=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}}
const messages=englishMessages as Record<string,string>
const reverseMessages=new Map(Object.entries(messages).map(([vi,en])=>[en,vi]))
export function t(vi:string,en?:string):string {const key=vi.trim().replace(/\s+/g,' ');return current==='en'?(en??messages[key]??vi):(reverseMessages.get(vi)??vi)}
export function interpolate(key:string,values:unknown[]):string{return t(key).replace(/\$\{(\d+)\}/g,(_match,index)=>String(values[Number(index)]??''))}
export const localeTag=()=>getLocale()==='en'?'en-GB':'vi-VN'

export function formatDate(value:string|number|Date,options:Intl.DateTimeFormatOptions={dateStyle:'medium'}){return new Intl.DateTimeFormat(current==='en'?'en-GB':'vi-VN',options).format(new Date(value))}
export function formatNumber(value:number,options?:Intl.NumberFormatOptions){return new Intl.NumberFormat(current==='en'?'en-GB':'vi-VN',options).format(value)}
export function readLanguage(owner?:string):Language {try{const value=localStorage.getItem(languageStorageKey(owner));return value==='vi'||value==='en'||value==='system'?value:'vi'}catch{return 'vi'}}
export function rememberLanguage(language:Language,owner?:string){try{localStorage.setItem(languageStorageKey(owner),language)}catch{/* Locale still applies when storage is unavailable. */}}

/** Read-only localization of authored static data. Never use this on user-entered data. */
const contentCache=new WeakMap<object,object>()
const unlocalizedKeys=new Set(['id','acceptedAnswers','correctOptionId','correctOptionIds','correctOrder','sourceUrls','sourceUrl','coordinateSourceUrl','photoSourceUrl','position','startPosition','checkpointOrder'])
export function localized<T>(value:T):T {
 if(typeof value==='string')return (current==='en'?(messages[value.trim().replace(/\s+/g,' ')]??value):value) as T
 if(!value||typeof value!=='object')return value
 const cached=contentCache.get(value);if(cached)return cached as T
 const proxy=new Proxy(value,{get(target,key,receiver){const child=Reflect.get(target,key,receiver);return typeof key==='string'&&unlocalizedKeys.has(key)?child:localized(child)}})
 contentCache.set(value,proxy);return proxy
}
