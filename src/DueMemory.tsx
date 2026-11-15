import { t } from './i18n/locale'
import { useEffect, useRef, useState } from 'react'
export default function DueMemory(){
 const [file,setFile]=useState<File|null>(null)
 const [preview,setPreview]=useState('')
 const [error,setError]=useState('')
 const objectUrl=useRef('')
 useEffect(()=>()=>{if(objectUrl.current)URL.revokeObjectURL(objectUrl.current)},[])
 function clear(){if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current='';setFile(null);setPreview('')}
 function select(value?:File){if(!value)return;if(!['image/jpeg','image/png','image/webp'].includes(value.type)||value.size>10*1024*1024){setError(t("Chọn ảnh JPEG, PNG hoặc WebP, tối đa 10 MB."));return}if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=URL.createObjectURL(value);setError('');setFile(value);setPreview(objectUrl.current)}
 return <section className="due-memory"><h3>{t("Lưu một khoảnh khắc")}</h3><p>{t("Ảnh kỷ niệm là tùy chọn. Ảnh này chỉ xem trước và tải về thiết bị; không gửi lên máy chủ và không tính thưởng.")}</p><label className="due-purple">{t("Chụp hoặc chọn ảnh")}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={event=>select(event.target.files?.[0])}/></label>{error&&<p role="alert">{t(error)}</p>}{preview&&file&&<><img src={preview} alt={t("Ảnh kỷ niệm đang xem trước")}/><a className="q-primary" href={preview} download={`dana-quest-ky-niem.${file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'}`}>{t("Tải ảnh về thiết bị")}</a><button className="due-text-button" onClick={clear}>{t("Bỏ ảnh đang xem")}</button></>}<p className="q-muted">{t("Trên điện thoại, trình duyệt có thể mở camera hoặc thư viện. Bạn có thể đóng bảng để tiếp tục chơi mà không chọn ảnh.")}</p></section>
}
