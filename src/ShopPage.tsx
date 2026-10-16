import { COINS_PER_MISSION, rewards, type RewardCategory } from './data/rewards'
import { coinBalance, earnedCoins } from './lib/progress'
import { useProgress } from './lib/useProgress'
import RewardArt from './RewardArt'
import ConfirmDialog from './ConfirmDialog'
import { useState } from 'react'
import './Quest.css'

const categoryLabels: Record<RewardCategory, string> = {
  postcard: 'Kỷ niệm', drink: 'Đồ uống', food: 'Ẩm thực', transport: 'Di chuyển',
  admission: 'Tham quan', activity: 'Giải trí', souvenir: 'Quà lưu niệm',
}

export default function ShopPage() {
  const { state, loading, busy, error, corrupt, dispatch, resetProgress } = useProgress()
  const [pendingRewardId, setPendingRewardId] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const balance = coinBalance(state)
  const pendingReward = rewards.find(reward => reward.id === pendingRewardId)
  async function confirmRedeem() {
    if (!pendingReward || busy) return
    if (await dispatch({ type: 'redeem', rewardId: pendingReward.id })) setPendingRewardId(null)
  }
  return <main className="shop-screen screen-page"><header className="screen-heading"><a href="#/kham-pha" aria-label="Về bản đồ">‹</a><h1>Đổi phần thưởng</h1></header>
    <div className="wallet-strip"><strong role="status">🟡 {loading?'Đang đọc…':`${balance} xu demo`}</strong><a href="#lich-su-doi" onClick={event=>{event.preventDefault();document.getElementById('lich-su-doi')?.scrollIntoView({behavior:'smooth'})}}>Lịch sử</a></div>
    <p className="shop-note">Voucher mẫu · không có giá trị thanh toán thực.</p>
    {error&&<p role="alert" className="error">{error}</p>}
    {corrupt&&<div role="alert" className="error"><p>Dữ liệu tiến độ đã lưu bị hỏng nên không thể tiếp tục. Bạn có thể đặt lại tiến độ để chơi tiếp — một bản sao dữ liệu hỏng được giữ lại để khôi phục thủ công, ảnh đã lưu không bị xóa.</p><button type="button" disabled={busy} onClick={()=>setResetOpen(true)}>Đặt lại tiến độ</button></div>}
    <div className="reward-list">{rewards.map(reward=>{
      const redeemed=state.redemptions.find(item=>item.rewardId===reward.id)
      return <article className="reward-card" key={reward.id}><div className="reward-picture"><RewardArt id={reward.id}/></div><div className="reward-info"><span className="reward-category">{categoryLabels[reward.category]} · DEMO</span><h2>{reward.name}</h2><p>{reward.benefit}</p><strong>● {reward.cost} xu demo</strong><dl className="reward-terms"><div><dt>Thời hạn</dt><dd>{reward.validity ?? 'Không áp dụng · voucher demo'}</dd></div><div><dt>Điều kiện</dt><dd>{reward.conditions.join(' ')}</dd></div></dl></div>{redeemed?<span className="redeemed-label">Đã đổi · demo</span>:<button aria-label={`Đổi với ${reward.cost} xu demo`} disabled={loading||busy||balance<reward.cost} onClick={()=>setPendingRewardId(reward.id)}>Đổi</button>}{!redeemed&&balance<reward.cost&&<small className="reward-missing">Cần thêm {reward.cost-balance} xu</small>}</article>
    })}</div>
    <details className="more-info"><summary>Green Coins hoạt động thế nào?</summary><p>Mỗi nhiệm vụ hoàn thành nhận {COINS_PER_MISSION} xu demo đúng một lần. Mỗi voucher chỉ đổi một lần. Không mua bán, giao hàng hoặc nhận quà thực.</p><p>Đã nhận: {earnedCoins(state)} · Đã dùng: {earnedCoins(state)-balance}</p></details>
    <section id="lich-su-doi" className="reward-history"><h2>Lịch sử đổi quà</h2>{state.redemptions.length===0?<p>Chưa đổi voucher nào.</p>:state.redemptions.map(item=>{const reward=rewards.find(entry=>entry.id===item.rewardId);return <div key={item.rewardId}><strong>{reward?.name ?? 'Voucher demo'}</strong><p>{new Date(item.redeemedAt).toLocaleString('vi-VN')} · Voucher demo đã đổi; không có mã sử dụng thực.</p></div>})}</section>
    <ConfirmDialog open={!!pendingReward} title="Xác nhận đổi phần thưởng?" message={pendingReward ? `Bạn sẽ dùng ${pendingReward.cost} xu demo để đổi “${pendingReward.name}”. Giao dịch này không thể hoàn tác.` : ''} confirmLabel="Xác nhận đổi" busyLabel="Đang đổi…" busy={busy} onCancel={()=>setPendingRewardId(null)} onConfirm={()=>void confirmRedeem()} />
    <ConfirmDialog open={resetOpen} title="Đặt lại tiến độ?" message="Toàn bộ tiến độ nhiệm vụ, xu và voucher đã đổi sẽ bị xóa và bắt đầu lại từ đầu. Ảnh trong album được giữ lại. Bạn có chắc chắn?" confirmLabel="Đặt lại" busyLabel="Đang đặt lại…" busy={busy} tone="danger" onCancel={()=>setResetOpen(false)} onConfirm={()=>void resetProgress().then(ok=>{if(ok)setResetOpen(false)})} />
  </main>
}
