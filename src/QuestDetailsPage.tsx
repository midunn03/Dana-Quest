import { localeTag } from './i18n/locale'
import { interpolate } from './i18n/locale'
import { t } from './i18n/locale'
import {lazy,Suspense,useState,useMemo} from 'react'
import {requestLogin} from './lib/authPrompt'
import {displayText} from './lib/questDisplay'
import {getNearbyGreenTransit} from './lib/ecoTransit'
import GoldenHourBanner from './GoldenHourBanner'
import {getQuest} from './data/quests'
import {presentQuest,publishedExperienceCount} from './lib/questPresentation'
import {getDestination} from './data/destinations'
import {useProgress} from './lib/useProgress'
import {isDestinationComplete,requiredCount} from './lib/rules'
import {usePlaceData} from './lib/placeContent'
import QuestCover from './QuestCover'
import AdminGallery from './AdminGallery'
import {useQuestProgress} from './lib/useQuestProgress'
import {useAuth} from './AuthContext'
import {QuestArtwork,PlayerDialog} from './QuestPlayerUi'
import {creatorId,useQuestCommunity} from './lib/useQuestCommunity'
import {DetailIcon,DetailSection,ShareQuest} from './QuestDetailUi'
import './QuestDetail.css'
// [UX-FLOW] Tích hợp cờ tính năng, GPS và modal an toàn 1 chạm
import { isUxFlagEnabled } from './lib/uxFlags'
import { usePlayerLocation } from './lib/usePlayerLocation'
import { distanceMeters } from './lib/location'
import { getQuestPricing, openPremiumModal, usePremiumAccess } from './lib/premium'

const RouteMap=lazy(()=>import('./QuestPreviewMap'))
export default function QuestDetailsPage({id}:{id:string}){
 const custom=usePlaceData().content[id],place=getDestination(id),legacy=!!place&&!getQuest(id),quest=presentQuest(id,custom),legacyData=useProgress(),auth=useAuth(),{state,dispatch,loading,busy,error,ready}=useQuestProgress(),community=useQuestCommunity(id)
 const startLat = place?.position?.[0] ?? quest?.checkpoints[0]?.position?.[0]
 const startLng = place?.position?.[1] ?? quest?.checkpoints[0]?.position?.[1]
 const startPosition: [number, number] | undefined = useMemo(
   () => (startLat !== undefined && startLng !== undefined ? [startLat, startLng] : undefined),
   [startLat, startLng]
 )
 const { sample } = usePlayerLocation()
 const isNearStart = sample && startPosition ? distanceMeters([sample.latitude, sample.longitude], startPosition) < 50 : false
 const nearestTransit = useMemo(() => {
   if (!startPosition) return null
   const list = getNearbyGreenTransit(startPosition, 1500)
   return list[0] ?? null
 }, [startPosition])
 const [acknowledged,setAcknowledged]=useState(false),[expanded,setExpanded]=useState(false),[map,setMap]=useState(false),[invite,setInvite]=useState(false),[rating,setRating]=useState(5),[comment,setComment]=useState(''),[reviewNotice,setReviewNotice]=useState('')
 const [safetyModalOpen, setSafetyModalOpen] = useState(false)
 const { hasAccess: hasQuestAccess } = usePremiumAccess(auth.user?.id)

 if(!quest)return <main className="quest-page"><h1>{t("Không tìm thấy quest")}</h1><a href="#/kham-pha">{t("Về Khám phá")}</a></main>
 const pricing = getQuestPricing(id)
 const questUnlocked = hasQuestAccess(id)
 const lockedPaid = pricing.isPaid && !questUnlocked
 const progress=state.quests[id],placeProgress=legacyData.state.destinations[id],completed=legacy?!!placeProgress&&isDestinationComplete(placeProgress):!!progress?.completedAt,title=quest.title.replace(/\s+[—–-]\s+(.+)$/,' ($1)'),startLabel=quest.checkpoints[0].placeLabel,endLabel=quest.checkpoints.at(-1)!.placeLabel
 
 async function executeStart(){
   if(lockedPaid){openPremiumModal({questId:id,reason:'unlock'});return}
   if(auth.status!=='authenticated'){requestLogin();return}
   if(legacy){window.location.hash=`#/chi-duong/${id}`;return}
   if(!auth.user?.avatarId){window.location.hash='#/chon-nhan-vat';return}
   if(await dispatch({type:'start',questId:id})){
     // [UX-FLOW] Nếu người chơi đã ở trong bán kính bắt đầu (< 50m) và bật ARRIVED_DIRECT_PLAY: vào thẳng màn chơi!
     if(isNearStart && isUxFlagEnabled('ARRIVED_DIRECT_PLAY')){
       await dispatch({type:'confirm-arrival', questId: id})
       window.location.hash = `#/quest/${id}/choi`
       return
     }
     window.location.hash=`#/quest/${id}/${progress?'choi':'chi-duong'}`
   }
 }

 function onStartClicked(){
   if(lockedPaid){openPremiumModal({questId:id,reason:'unlock'});return}
   if(auth.status!=='authenticated'){requestLogin();return}
   // [UX-FLOW] Hộp thoại an toàn 1 chạm thay vì bắt kéo xuống tick hộp ở cuối trang
   if(isUxFlagEnabled('SAFETY_MODAL_FAST_START') && !progress && !acknowledged && !legacy){
     setSafetyModalOpen(true)
     return
   }
   void executeStart()
 }

 // [UX-FLOW] Xác định trạng thái disabled của nút bắt đầu
 const isStartDisabled = loading || busy || !ready || (!progress && !acknowledged && !isUxFlagEnabled('SAFETY_MODAL_FAST_START'))

 const startButtonCopy = loading
   ? t("Đang tải tiến độ…")
   : busy
   ? t("Đang lưu…")
   : !auth.user?.avatarId
   ? t("Tùy chỉnh nhân vật để bắt đầu")
   : progress
   ? interpolate("Tiếp tục quest (${0}/${1})",[progress.completedCheckpointIds.length,quest.checkpoints.length])
   : isNearStart && isUxFlagEnabled('ARRIVED_DIRECT_PLAY')
   ? t("Bắt đầu chơi ngay (Đang ở điểm hẹn)")
   : t("Đến điểm bắt đầu")

 const startButton=<>{auth.status!=='authenticated'?<a className="qd-primary q-briefing-start" href="#/dang-nhap" onClick={event=>{event.preventDefault();requestLogin()}}>{t("Đăng nhập để chơi quest")}</a>:legacy?<a className="qd-primary q-briefing-start" href={`#/chi-duong/${id}`}>{t("Bắt đầu khám phá →")}</a>:<button className="qd-primary q-briefing-start" disabled={isStartDisabled} onClick={onStartClicked}>{startButtonCopy}</button>}</>

 return <main className="qd-page" aria-labelledby="briefing-title"><div className="qd-frame"><div className="qd-scroll-header"><a href="#/kham-pha" className="dq-back-btn" aria-label={t("Về Khám phá")}>← {t("Quay lại")}</a><strong>{title}</strong><ShareQuest className="qd-round" label={t("Chia sẻ quest")}/></div>
 <div className="qd-hero">{place?<QuestCover id={id} credit sourceLink/>:<QuestArtwork/>}<div className="qd-hero-tools"><button className="qd-round" aria-label={t("Mời bạn khám phá quest")} onClick={()=>setInvite(true)}><DetailIcon kind="invite"/></button><button className={`qd-round ${community.favorite?'is-favorite':''}`} aria-label={community.favorite?t("Bỏ yêu thích quest"):t("Lưu quest yêu thích")} aria-pressed={community.favorite} disabled={community.busy} onClick={()=>void community.act({action:'favorite',questId:id,enabled:!community.favorite})}><DetailIcon kind="heart"/></button></div><span className="qd-beta">{t("Bản mẫu (đang thử nghiệm)")}</span></div>
 <div className="qd-layout"><article className="qd-content"><h1 id="briefing-title">{title}</h1><GoldenHourBanner destinationId={id}/><div className="qd-meta"><span>◷ {legacy?t("Thời gian tự sắp xếp"):interpolate("${0} phút",[quest.estimatedMinutes])}</span><span>{legacy?(placeProgress?.started?interpolate("${0} nhiệm vụ đã chọn",[placeProgress.selected.length]):t("Chọn 5 đến 10 nhiệm vụ")):interpolate("${0} thử thách",[quest.checkpoints.length])}</span><span>{t("Quãng đường chưa đo")}</span><button onClick={()=>setMap(true)}><DetailIcon kind="map"/> {" " + t("Bản đồ ›")}</button></div>
 <DetailSection title={t("Tổng quan")}><h3>{t("Một chuyến đi ngắn, một câu chuyện đáng nhớ.")}</h3><p>{displayText(quest.summary)}</p>{expanded&&<div id="quest-overview">{custom?.detail&&<p>{displayText(custom.detail)}</p>}<p>{legacy?(custom?custom.detail:place?.detail):quest.checkpoints[0].story}</p><p>{legacy?t("Chọn 5 đến 10 nhiệm vụ và hoàn thành ít nhất 80% để đạt mục tiêu. Các nhiệm vụ chụp ảnh và tự xác nhận giữ nguyên như trước."):t("Quan sát những dấu hiệu tại địa điểm, giải câu đố và lần lượt mở các chương. Tiến độ lưu theo tài khoản; có thể dừng và quay lại tiếp tục.")}</p><p>{displayText(quest.safetyNote)}</p></div>}<button className="qd-text" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?t("Thu gọn"):t("Đọc thêm")} <span aria-hidden="true">⌄</span></button></DetailSection>
 <section className="qd-testing"><h2>{pricing.isPaid?t("Khám phá hành trình đặc biệt này","Experience this special journey"):t("Mời bạn chơi thử quest này")}</h2><p>{pricing.isPaid?t(`Hành trình thuộc ${pricing.tierName} hàng tháng (${pricing.currencyLabel}). Chơi trọn cốt truyện và cho chúng tôi biết cảm nhận của bạn sau khi hoàn thành.`,`Included in ${pricing.tierName} monthly (${pricing.currencyLabel}). Play the full story and share your feedback after completion.`):t("Miễn phí trong giai đoạn thử nghiệm. Chơi trọn hành trình rồi cho chúng tôi biết điều gì đã tốt và điều gì cần cải thiện.")}</p><button className="qd-start-place" onClick={()=>setMap(true)}><DetailIcon kind="map"/><span>{t("Bắt đầu tại") + " "}<strong>{startLabel}</strong></span><span aria-hidden="true">›</span></button><div className="qd-solo"><DetailIcon kind="person"/><div><strong>{t("Khám phá theo nhịp của bạn")}</strong><p>{t("Phiên chơi cá nhân. Có thể chia sẻ liên kết cho bạn bè; chưa hỗ trợ phòng chơi nhóm hoặc thi đấu.")}</p></div></div><div className="qd-testers"><span>{t("Người chơi thử")}</span><strong>{t("1 người")}</strong><small>{t("Theo luật solo hiện tại")}</small></div><button className="qd-primary" onClick={()=>{document.getElementById('quest-preparation')?.scrollIntoView?.({behavior:'smooth',block:'center'});document.getElementById('quest-ack')?.focus()}}>{t("Chuẩn bị chơi thử")}</button><h3>{t("Chúng tôi mong bạn")}</h3><ul><li>{t("Trải nghiệm từ đầu đến cuối.")}</li><li>{t("Góp ý rõ những phần dễ hiểu hoặc còn khó sử dụng.")}</li><li>{t("Đánh giá trung thực sau khi hoàn thành.")}</li><li>{t("Chia sẻ liên kết nếu bạn bè cũng muốn khám phá.")}</li></ul></section>
 <div className="qd-box qd-why"><h3>{t("Vì sao quest đang thử nghiệm?")}</h3><p>{t("Chúng tôi đang hoàn thiện chỉ dẫn, câu chữ và nhịp trải nghiệm. Góp ý của bạn giúp điều chỉnh bản mẫu trước khi phát hành chính thức.")}</p><a className="qd-text" href="#/tai-khoan/report">{t("Gửi góp ý hoặc báo lỗi")}</a></div>
 <DetailSection title={t("Ảnh từ người chơi")}><p>{t("Từ những người đã đi qua hành trình.")}</p><div className="qd-photo-empty"><DetailIcon kind="person"/><h3>{t("Chưa có ảnh được công khai")}</h3><p>{t("Ảnh trong Album vẫn là của riêng bạn. Chưa có cơ chế duyệt ảnh công khai cho quest này.")}</p><a className="qd-text" href="#/album" onClick={event=>{if(auth.status!=='authenticated'){event.preventDefault();requestLogin()}}}>{t("Mở Album của tôi")}</a></div></DetailSection>
 <DetailSection title={t("Bạn sẽ trải nghiệm")}><ol className="qd-timeline">{quest.checkpoints.map((cp,index)=><li key={cp.id}><span>{index+1}</span><div><h3>{cp.title}</h3><p>{cp.story}</p><small>{cp.placeLabel.replace(/\s+[—–-]\s+(.+)$/,' ($1)')}</small></div></li>)}<li className="qd-finish"><span><DetailIcon kind="flag"/></span><div><h3>{t("Khép lại hành trình của bạn")}</h3><p>{legacy?t("Hoàn thành ít nhất 80% số nhiệm vụ đã chọn. Giữ nguyên luật xu và đổi thưởng của hành trình địa điểm."):t("Hoàn thành các câu trả lời đúng để nhận XP và xu một lần cho từng thử thách.")}</p></div></li></ol></DetailSection>
 <DetailSection title={t("Đánh giá")} id="quest-reviews">{community.loading?<p role="status">{t("Đang tải đánh giá…")}</p>:community.data.reviews.length?<><div className="qd-rating"><DetailIcon kind="star"/><strong>{community.data.rating?.toFixed(1)}/5</strong><span>{community.data.reviewCount} {" " + t("đánh giá")}</span></div><div className="qd-reviews">{community.data.reviews.map(review=><article className="qd-box" key={review.id}><header><strong>{review.displayName}</strong><span>{review.rating}/5 ★</span></header><p>{review.comment}</p><small>{new Date(review.updatedAt).toLocaleDateString(localeTag())}</small></article>)}</div></>:<div className="qd-box qd-empty-review"><span>{t("Mới")}</span><div><h3>{t("Chưa có đánh giá")}</h3><p>{t("Hãy là một trong những người đầu tiên trải nghiệm và kể lại hành trình của bạn.")}</p></div></div>}
 {completed?<form className="qd-review-form" onSubmit={event=>{event.preventDefault();void community.act({action:'review',questId:id,rating,comment}).then(ok=>{if(ok)setReviewNotice(t("Đã lưu đánh giá công khai của bạn."))})}}><h3>{community.review?t("Cập nhật đánh giá của bạn"):t("Chia sẻ trải nghiệm của bạn")}</h3><label htmlFor="review-rating">{t("Điểm đánh giá")}</label><select id="review-rating" value={rating} onChange={event=>setRating(Number(event.target.value))}>{[5,4,3,2,1].map(value=><option key={value} value={value}>{value} sao</option>)}</select><label htmlFor="review-comment">{t("Nội dung đánh giá")}</label><textarea id="review-comment" value={comment} onChange={event=>setComment(event.target.value)} minLength={5} maxLength={1500} required placeholder={community.review?.comment||t("Điều gì khiến bạn nhớ nhất?")}/><p>{t("Tên hiển thị và nội dung đánh giá sẽ được công khai. Không ghi thông tin cá nhân nhạy cảm.")}</p><button className="qd-primary" disabled={community.busy}>{t("Lưu đánh giá")}</button>{reviewNotice&&<p role="status">{reviewNotice}</p>}</form>:<p className="qd-hint">{t("Hoàn thành quest để gửi đánh giá. Góp ý trong quá trình chơi vẫn có thể gửi qua mục Báo lỗi.")}</p>}</DetailSection>
 <DetailSection title={t("Thông tin hành trình")}><div className="qd-box qd-logistics"><div className="qd-location-row"><i/><div><small>{t("Bắt đầu tại")}</small><strong>{startLabel}</strong><p>{quest.id==='due-dau-an-50-nam'?t("71 Ngũ Hành Sơn, Đà Nẵng"):quest.area}</p></div></div><div className="qd-location-row"><DetailIcon kind="flag"/><div><small>{t("Kết thúc tại")}</small><strong>{legacy?quest.area:endLabel}</strong><p>{t("Đối chiếu chỉ dẫn ở điểm cuối. Chưa công bố tọa độ riêng.")}</p></div></div>{nearestTransit&&<div className="qd-location-row qd-transit-row"><span className="qd-transit-icon" aria-hidden="true">{nearestTransit.station.type==='bike'?'🚲':'🚌'}</span><div><small>{t("Trạm di chuyển xanh gần đây")}</small><strong>{nearestTransit.station.name}</strong><p>{interpolate("Cách ~${0}m đi bộ (${1})",[Math.round(nearestTransit.distance),nearestTransit.station.address||nearestTransit.station.operator||''])}</p></div></div>}<div className="qd-logistics-bottom"><div><small>{t("Thời gian chơi")}</small><strong>{custom?.hours||t("Khi địa điểm cho phép tiếp cận")}</strong>{custom?.hoursNote&&<p>{custom.hoursNote}</p>}</div><div><small>{t("Ngôn ngữ")}</small><strong>{t("Tiếng Việt / English","Vietnamese / English")}</strong></div></div></div><ul className="qd-tips"><li>{t("Sạc đầy điện thoại hoặc mang theo pin dự phòng.")}</li><li>{t("Mang đủ nước, mũ và đồ che nắng khi ra ngoài.")}</li><li>{t("Chọn thời tiết phù hợp và tuân thủ giờ tiếp cận của địa điểm.")}</li></ul></DetailSection>
 <DetailSection title={t("Gặp nhà sáng tạo")}><a className="qd-box qd-creator-link" href={`#/nha-sang-tao/${creatorId}?tu=${id}`}><span className="qd-creator-avatar"><DetailIcon kind="person"/></span><div><h3 lang="en">Dana Quest</h3><p>{t("Hồ sơ nhóm phát triển (tạm thời)")}</p><small>{publishedExperienceCount()} {" " + t("hành trình đã tạo") + " "}{community.data.creatorRating!=null?`(${community.data.creatorRating.toFixed(1)}/5)`:t("(chưa có đánh giá)")}</small></div><span aria-hidden="true">›</span></a></DetailSection>
 {custom&&custom.photos.length>1&&<AdminGallery name={place?.name||title} photos={custom.photos.slice(1)}/>}<section id="quest-preparation" className="qd-box qd-preparation"><h2>{t("Trước khi lên đường")}</h2><p>{legacy?t("Bạn chọn số nhiệm vụ phù hợp. Hoàn thành ít nhất 80% mục tiêu; chức năng cũ không thay đổi."):t("Không đếm ngược thời gian, không bỏ qua thử thách. Giải đúng để mở câu chuyện tiếp theo.")}</p><p>{displayText(quest.safetyNote)} {" " + t("Không nhìn màn hình khi băng qua đường.")}</p>{!legacy&&!progress&&<label className="qd-ack"><input id="quest-ack" type="checkbox" checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/>{t("Tôi đã đọc hướng dẫn và lưu ý an toàn.")}</label>}<p>{legacy?t("Xu và đổi thưởng áp dụng theo luật nhiệm vụ địa điểm hiện có."):t("XP và Xu Dana được ghi nhận một lần cho mỗi thử thách giải đúng.","XP and Dana Coins are recorded once for each correctly solved challenge.")}</p>{legacy&&<a className="qd-text" href={`#/nhiem-vu/${id}`}>{t("Nhiệm vụ và tiến độ") + " "}{placeProgress?.started?interpolate("(mục tiêu ${0})",[requiredCount(placeProgress.selected.length)]):''}</a>}</section>{(error||community.error)&&<p role="alert" className="qd-error">{t(error||community.error)}</p>}
 </article>{lockedPaid?<aside className="qd-play-panel is-premium"><div className="qd-premium-summary"><span className="qd-premium-pill">✦ {pricing.tierId==='pro'?t("Gói Pro · Giảm 45%","Pro Plan · 45% Off"):t("Gói Plus · Giảm 40%","Plus Plan · 40% Off")}</span><div className="qd-premium-price-row"><s>{pricing.originalCurrencyLabel}</s><strong>{pricing.currencyLabel}</strong></div><p>{pricing.tierId==='pro'?t(`Nâng cấp Gói Pro hàng tháng để mở khóa "${title}", cùng Cầu Rồng và toàn bộ 3 quest trả phí.`,`Activate Dana Quest Pro monthly to unlock "${title}" and all 3 paid quests.`):t("Mở khóa trọn vẹn Đánh thức Long Mạch cùng Gói Plus hàng tháng, lưu tiến độ và nhận thẻ hành trình PNG.","Unlock Awakening the Dragon Vein with Plus monthly, saved progress, and PNG card.")}</p><ul className="qd-premium-benefits"><li>✓ {pricing.tierId==='pro'?t("Mở khóa cả 3 quest trả phí: Cầu Rồng, Cầu Vàng & Ngũ Hành Sơn","Unlocks all 3 paid quests: Dragon Bridge, Golden Bridge & Marble Mountains"):t("Mở khóa trọn bộ quest Đánh thức Long Mạch (Cầu Rồng)","Full Cầu Rồng quest & challenges")}</li><li>✓ {t("Gia hạn hàng tháng, hỗ trợ mã khuyến mãi · Hủy bất cứ lúc nào","Monthly billing, promo code supported · Cancel anytime")}</li></ul><small className="qd-premium-note">{t("Không bao gồm vé vào cổng điểm tham quan (nếu có).","Excludes venue tickets if applicable.")}</small></div><button type="button" className="qd-primary q-briefing-start is-premium-buy" onClick={()=>openPremiumModal({questId:id,reason:'unlock'})}>{t(`Đăng ký ${pricing.tierName} · ${pricing.currencyLabel} →`,`Subscribe ${pricing.tierName} · ${pricing.currencyLabel} →`)}</button><a className="qd-directions-pill" href={`#/chi-duong/${id}?tu=map`}>↗ {t(`Chỉ đường đến ${place?.name||title}`,`Directions to ${place?.name||title}`)}</a><a className="qd-text qd-desktop-link" href="#/nhap-ma">{t("Có mã kích hoạt? Nhập mã","Have a code? Enter code")}</a></aside>:<aside className="qd-play-panel"><div>{pricing.isPaid&&questUnlocked&&<span className="qd-unlocked-pill">✓ {t("Đã mở khóa · Gói trải nghiệm","Unlocked · Experience Pack")}</span>}<strong>{pricing.isPaid?t("Đã sẵn sàng trải nghiệm"):t("Chơi miễn phí")}</strong><p>{pricing.isPaid?t("Bạn đã mở khóa quyền chơi hành trình này."):legacy?t("Vé vào địa điểm (nếu có) trả riêng"):t("Giúp hoàn thiện bản mẫu")}</p></div>{startButton}<a className="qd-text qd-desktop-link" href="#quest-preparation" onClick={event=>{event.preventDefault();document.getElementById('quest-preparation')?.scrollIntoView?.({behavior:'smooth'})}}>{t("Đọc lưu ý trước khi chơi")}</a></aside>}</div>
 </div>
 {/* [UX-FLOW] Hộp thoại an toàn 1 chạm khi SAFETY_MODAL_FAST_START bật */}
 {safetyModalOpen && (
   <PlayerDialog title={t("Lưu ý an toàn khi chơi")} onClose={() => setSafetyModalOpen(false)}>
     <div className="qd-safety-modal-body">
       <p>{displayText(quest.safetyNote)}</p>
       <ul style={{ margin: '12px 0', paddingLeft: '20px', lineHeight: '1.5' }}>
         <li>{t("Không nhìn màn hình khi băng qua đường hoặc di chuyển.")}</li>
         <li>{t("Bảo quản kỹ tư trang, điện thoại cá nhân.")}</li>
         <li>{t("Chỉ hoạt động tại các khu vực công cộng được phép.")}</li>
       </ul>
       <button
         className="qd-primary"
         style={{ width: '100%', marginTop: '16px' }}
         onClick={() => {
           setAcknowledged(true)
           setSafetyModalOpen(false)
           void executeStart()
         }}
       >
         {t("Tôi đã hiểu, đi thôi! ↗")}
       </button>
     </div>
   </PlayerDialog>
 )}
 {map&&<PlayerDialog title={t("Bản đồ hành trình")} onClose={()=>setMap(false)}><Suspense fallback={<p>{t("Đang mở bản đồ…")}</p>}><RouteMap quest={quest}/></Suspense></PlayerDialog>}{invite&&<PlayerDialog title={t("Mời bạn khám phá")} onClose={()=>setInvite(false)}><p>{t("Chia sẻ liên kết quest để bạn bè tự bắt đầu hành trình. Mỗi người chơi một phiên riêng; chưa có chơi nhóm hoặc thi đấu.")}</p><ShareQuest className="qd-text" label={t("Sao chép liên kết quest")}/></PlayerDialog>}</main>
}
