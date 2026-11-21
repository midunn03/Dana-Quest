import './ui/PixelUI.css'
import './QuestPlayerUi.css'
import { t } from './i18n/locale'
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
export function PlayerIcon({kind}:{kind:'menu'|'help'|'close'|'flag'|'check'}) {
 const paths={menu:'M3 6h18M3 12h18M3 18h18',help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',close:'m6 6 12 12M18 6 6 18',flag:'M5 22V3h13l-2 5 2 5H5',check:'m4 12 5 5L20 6'}
 return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"><path d={paths[kind]}/></svg>
}
export function QuestArtwork(){return <figure className="q-artwork q-due-photo"><img src={`${import.meta.env.BASE_URL}art/home/due-campus-hd.png`} width="1200" height="675" alt={t('Cổng Trường Đại học Kinh tế – Đại học Đà Nẵng','University of Economics, University of Da Nang entrance')} loading="lazy"/></figure>}
export function PlayerDialog({title,onClose,children,variant='sheet'}:{title:string;onClose:()=>void;children:ReactNode;variant?:'sheet'|'menu'|'support'|'image'}) {
 const panel=useRef<HTMLElement>(null)
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;panel.current?.querySelector<HTMLButtonElement>('button')?.focus();return()=>{if(previous?.isConnected)previous.focus()}},[])
 function keyboard(event:KeyboardEvent){if(event.key==='Escape'){event.preventDefault();onClose()}if(event.key==='Tab'){const nodes=[...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),summary')??[])].filter(node=>!node.closest('details:not([open])')||node.tagName==='SUMMARY');if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1)?.focus()}else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0]?.focus()}}}
 return <div className={`q-dialog-backdrop due-dialog-${variant}`} onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section ref={panel} className="q-dialog px-modal" role="dialog" aria-modal="true" aria-labelledby="q-dialog-title" onKeyDown={keyboard}><header><h2 id="q-dialog-title">{title}</h2><button type="button" className="q-icon-button px-button px-button--ghost px-button--sm" aria-label={t("Đóng bảng")} onClick={onClose}><PlayerIcon kind="close"/></button></header>{children}</section></div>
}
