import { useEffect, useRef, useState } from 'react'
import { t } from './i18n/locale'
import type { AuthUser } from './lib/auth'
import BookingPage from './BookingPage'
import InformationPage from './InformationPage'
import HelpPage from './HelpPage'
import AccountPage from './AccountPage'
import './SitePopup.css'

const popupRoutes = new Set(['#/kich-hoat','#/nhap-ma','#/dieu-khoan','#/quyen-rieng-tu','#/huong-dan','#/tai-khoan/support','#/tai-khoan/privacy','#/tai-khoan/help','#/tai-khoan/faq','#/tai-khoan/terms','#/tai-khoan/policy'])
export default function SitePopup({user,onLogout}:{user:AuthUser|null;onLogout:()=>Promise<void>}) {
 const [path,setPath]=useState<string|null>(null)
 const panel=useRef<HTMLDialogElement>(null)
 useEffect(()=>{
  const capture=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return
   const anchor=(event.target as Element)?.closest<HTMLAnchorElement>('a[href]')
   if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download')||!anchor.closest('.app-shell,.site-popup,.auth-modal-layer,.auth-full-page'))return
   const url=new URL(anchor.href,location.href)
   if(url.origin!==location.origin||url.pathname!==location.pathname)return
   if(popupRoutes.has(url.hash)){event.preventDefault();setPath(url.hash)}
   else if(anchor.closest('.site-popup')&&url.hash==='#/'){event.preventDefault();setPath(null)}
  }
  const leave=()=>setPath(null)
  document.addEventListener('click',capture,true);window.addEventListener('hashchange',leave)
  return()=>{document.removeEventListener('click',capture,true);window.removeEventListener('hashchange',leave)}
 },[])
 useEffect(()=>{const dialog=panel.current;if(!dialog)return;if(path&&!dialog.open)dialog.showModal();else if(!path&&dialog.open)dialog.close()},[path])
 const information=path==='#/dieu-khoan'||path==='#/tai-khoan/terms'||path==='#/quyen-rieng-tu'||path==='#/tai-khoan/policy'
 const title=path==='#/kich-hoat'||path==='#/nhap-ma'?t('Mã quest','Quest code'):information?(path==='#/quyen-rieng-tu'||path==='#/tai-khoan/policy'?t('Quyền riêng tư','Privacy'):t('Điều khoản sử dụng','Terms of use')):path==='#/tai-khoan/privacy'?t('Quyền riêng tư','Privacy'):t('Trợ giúp Dana Quest','Dana Quest help')
 return <dialog ref={panel} className="site-popup" aria-labelledby="site-popup-title" onCancel={()=>setPath(null)} onClose={()=>setPath(null)} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)setPath(null)}}}>
  <header className="site-popup-heading"><div><span lang="en">DANA QUEST</span><h2 id="site-popup-title">{title}</h2></div><button type="button" autoFocus onClick={()=>setPath(null)} aria-label={t('Đóng cửa sổ','Close dialog')}>×</button></header>
  <div className="site-popup-body" key={path}>{path&&(path==='#/kich-hoat'||path==='#/nhap-ma'?<BookingPage entry={path==='#/nhap-ma'}/>:information?<InformationPage privacy={path==='#/quyen-rieng-tu'||path==='#/tai-khoan/policy'}/>:path==='#/huong-dan'?<HelpPage/>:<AccountPage user={user} onLogout={onLogout} view={path.split('/')[2]}/>)}</div>
 </dialog>
}
