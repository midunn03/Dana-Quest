import { t } from './i18n/locale'
import {useState,type ReactNode} from 'react'
import {copyAccountText} from './lib/accountFeatures'
export function DetailIcon({kind}:{kind:'heart'|'invite'|'back'|'map'|'share'|'star'|'flag'|'person'}){
 const path={heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',invite:'M16 21v-2a6 6 0 0 0-12 0v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-5v8m-4-4h8',back:'m15 4-8 8 8 8',map:'m2 5 7-3 6 3 7-3v17l-7 3-6-3-7 3V5Zm7-3v17m6-14v17',share:'M12 16V2m-5 5 5-5 5 5M5 11H3v11h18V11h-2',star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',flag:'M5 22V3h14l-2 5 2 5H5',person:'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 22v-2a8 8 0 0 1 16 0v2'}
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path[kind]}/></svg>
}
export function DetailSection({title,children,id}:{title:string;children:ReactNode;id?:string}){return <section id={id} className="qd-section"><div className="qd-trail" aria-hidden="true"><i/><svg viewBox="0 0 500 20" preserveAspectRatio="none"><path d="M0 10Q60 20 120 10T240 10T360 10T500 10"/></svg></div><h2>{title}</h2>{children}</section>}
export function ShareQuest({label=t("Chia sẻ"),className='',url=location.href}:{label?:string;className?:string;url?:string}){
 const [notice,setNotice]=useState('')
 return <><button className={className} aria-label={label} onClick={()=>void copyAccountText(url).then(ok=>setNotice(ok?t("Đã sao chép liên kết."):url))}><DetailIcon kind="share"/>{className.includes('text')&&label}</button>{notice&&<p className="qd-share-result" role="status">{t(notice)}</p>}</>
}
