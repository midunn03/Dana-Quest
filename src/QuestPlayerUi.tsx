import './ui/PixelUI.css'
import './QuestPlayerUi.css'
import { t } from './i18n/locale'
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
export function PlayerIcon({kind}:{kind:'menu'|'help'|'close'|'flag'|'check'}) {
 const paths={menu:'M3 6h18M3 12h18M3 18h18',help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',close:'m6 6 12 12M18 6 6 18',flag:'M5 22V3h13l-2 5 2 5H5',check:'m4 12 5 5L20 6'}
 return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"><path d={paths[kind]}/></svg>
}
export function QuestArtwork(){return <figure className="q-artwork"><svg viewBox="0 0 600 300" aria-hidden="true"><rect width="600" height="300" fill="var(--px-navy)"/><circle cx="470" cy="70" r="100" fill="var(--px-sky)"/><path d="M55 230h490M90 226V140h100v86m-82-83V91h63v52m-81 20h100m50 63V108h270v118M260 108V75h230v33m-246 26h264m-238 0v92m42-92v92m42-92v92m42-92v92m42-92v92m42-92v92" fill="none" stroke="var(--px-green)" strokeWidth="3"/><text x="50" y="62" fontSize="29" fontWeight="400" fill="var(--px-yellow)" lang="en">DUE</text><text x="50" y="280" fontSize="15" letterSpacing="4" fill="var(--px-white)">{t("DẤU ẤN 50 NĂM")}</text></svg><figcaption>{t("Minh họa hành trình DUE")}</figcaption></figure>}
export function PlayerDialog({title,onClose,children,variant='sheet'}:{title:string;onClose:()=>void;children:ReactNode;variant?:'sheet'|'menu'|'support'|'image'}) {
 const panel=useRef<HTMLElement>(null)
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;panel.current?.querySelector<HTMLButtonElement>('button')?.focus();return()=>{if(previous?.isConnected)previous.focus()}},[])
 function keyboard(event:KeyboardEvent){if(event.key==='Escape'){event.preventDefault();onClose()}if(event.key==='Tab'){const nodes=[...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),summary')??[])].filter(node=>!node.closest('details:not([open])')||node.tagName==='SUMMARY');if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1)?.focus()}else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0]?.focus()}}}
 return <div className={`q-dialog-backdrop due-dialog-${variant}`} onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section ref={panel} className="q-dialog px-modal" role="dialog" aria-modal="true" aria-labelledby="q-dialog-title" onKeyDown={keyboard}><header><h2 id="q-dialog-title">{title}</h2><button type="button" className="q-icon-button px-button px-button--ghost px-button--sm" aria-label={t("Đóng bảng")} onClick={onClose}><PlayerIcon kind="close"/></button></header>{children}</section></div>
}
