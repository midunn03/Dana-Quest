import './CameraPage.css'
import { t } from './i18n/locale'
import { getDestination } from './data/destinations'
import { getMissions } from './data/missions'
import { useProgress } from './lib/useProgress'
import PhotoMission from './PhotoMission'
import ConfirmDialog from './ConfirmDialog'
import { useState } from 'react'
export default function CameraPage({ id, missionId }: { id:string; missionId:string }) {
  const {state,loading,busy,error,corrupt,dispatch,resetProgress}=useProgress()
  const [resetOpen,setResetOpen]=useState(false)
  const place=getDestination(id)
  const mission=place && getMissions(place).find(item=>item.id===missionId && item.kind==='photo')
  const progress=state.destinations[id]
  return <main className="camera-page"><header><a href={`#/nhiem-vu/${id}`} aria-label={t("Đóng máy ảnh")}>{t("×")}</a><span>{t("Chụp ảnh nhiệm vụ")}</span><span aria-hidden="true">•••</span></header>
    {loading?<p>{t("Đang đọc nhiệm vụ…")}</p>:!mission || !progress?.selected.includes(missionId)?<div className="camera-empty"><h1>{t("Chọn nhiệm vụ chụp ảnh trước")}</h1><a href={`#/nhiem-vu/${id}`}>{t("Về nhiệm vụ")}</a></div>:<><h1>{mission.title}</h1><PhotoMission destinationId={id} missionId={missionId} completed={progress.completed.includes(missionId)} busy={busy} immersive onComplete={()=>void dispatch({type:'complete',destinationId:id,missionId}).then(ok=>{if(ok)window.location.hash=`#/hoan-thanh/${id}/${missionId}`})}/></>}
    {error&&<p role="alert">{t(error)}</p>}
    {corrupt&&<div role="alert"><p>{t("Dữ liệu tiến độ đã lưu bị hỏng. Bạn có thể đặt lại tiến độ để chơi tiếp — một bản sao dữ liệu hỏng được giữ lại, ảnh đã lưu không bị xóa.")}</p><button type="button" disabled={busy} onClick={()=>setResetOpen(true)}>{t("Đặt lại tiến độ")}</button></div>}
    <ConfirmDialog open={resetOpen} title={t("Đặt lại tiến độ?")} message={t("Toàn bộ tiến độ nhiệm vụ, xu và voucher đã đổi sẽ bị xóa và bắt đầu lại từ đầu. Ảnh trong album được giữ lại. Bạn có chắc chắn?")} confirmLabel={t("Đặt lại")} busyLabel={t("Đang đặt lại…")} busy={busy} tone="danger" onCancel={()=>setResetOpen(false)} onConfirm={()=>void resetProgress().then(ok=>{if(ok)setResetOpen(false)})} />
  </main>
}
