import './WorkspaceNavigation.css'
import { localized } from './i18n/locale'
import { t } from './i18n/locale'
import {useEffect,useRef} from 'react'

const sections = localized([
  ["Tài khoản", '#/tai-khoan'],
  ["Chỉnh sửa hồ sơ", '#/tai-khoan/edit'],
  ["Nhân vật", '#/nhan-vat'],
  ["Nhật ký khám phá", '#/tai-khoan/journal'],
  ["Thư viện kỷ niệm", '#/album'],
  ["Ví xu", '#/tai-khoan/wallet'],
  ["Cửa hàng đổi xu", '#/cua-hang'],
  ["Thông báo", '#/tai-khoan/notifications'],
  ["Cài đặt", '#/tai-khoan/cai-dat'],
  ["Trợ giúp", '#/tai-khoan/help'],
])

/** One route list for the desktop account rail and mobile shortcuts. */
export default function WorkspaceNavigation({route}:{route:string}) {
  const menu=useRef<HTMLElement>(null)
  useEffect(()=>{menu.current?.querySelector('a[aria-current]')?.scrollIntoView?.({block:'nearest',inline:'center'})},[route])
  return <nav ref={menu} className="workspace-navigation" aria-label={t("Không gian tài khoản")}>
    <div className="workspace-heading"><strong>{t("Không gian của bạn")}</strong><p>{t("Hành trình, kỷ niệm và tài khoản ở cùng một nơi.")}</p></div>
    <div className="workspace-links">{sections.map(([label,href])=><a key={href} href={href} aria-current={route===href?'page':undefined}>{label}<span aria-hidden="true">›</span></a>)}</div>
  </nav>
}
