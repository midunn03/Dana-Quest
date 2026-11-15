import { useEffect, useState } from 'react'
import './VoucherWallet.css'
import { useLocale } from './i18n/LocaleProvider'
import { rewards } from './data/rewards'
import RewardArt from './RewardArt'
import { useWallet } from './lib/useWallet'
import { walletMessage } from './lib/wallet'
import {
  fetchAvailablePartnerVouchers,
  fetchMyPartnerVouchers,
  redeemPartnerVoucher,
  type PartnerVoucherItem,
  type MyVoucherItem,
} from './lib/vouchers'

export default function VoucherWallet({ english: providedEnglish }: { english?: boolean }) {
  const { locale } = useLocale(), english = providedEnglish ?? locale === 'en'
  const { wallet, loading, error } = useWallet()
  const [available, setAvailable] = useState<PartnerVoucherItem[]>([])
  const [myVouchers, setMyVouchers] = useState<MyVoucherItem[]>([])
  const [redeemingId, setRedeemingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadData = () => {
    fetchAvailablePartnerVouchers().then(setAvailable)
    fetchMyPartnerVouchers().then(setMyVouchers)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRedeem = async (v: PartnerVoucherItem) => {
    if ((wallet.balance ?? 0) < v.coinCost) {
      setNotice(english ? 'Insufficient coins.' : 'Bạn không đủ xu để đổi voucher này.')
      return
    }
    setRedeemingId(v.id)
    setNotice(null)
    const res = await redeemPartnerVoucher(v.id)
    setRedeemingId(null)
    if (res.success) {
      setNotice(res.message || (english ? 'Voucher redeemed!' : 'Đã đổi voucher thành công!'))
      loadData()
    } else {
      setNotice(res.message || (english ? 'Redemption failed.' : 'Đổi voucher thất bại.'))
    }
  }

  return (
    <section className="reward-history" id="voucher-cua-toi">
      <h2>{english ? 'My vouchers' : 'Voucher của tôi'}</h2>
      <p>
        {loading
          ? (english ? 'Loading…' : 'Đang đọc…')
          : wallet.balance === null
          ? '—'
          : `${wallet.balance} ${english ? 'Dana Coins' : 'Xu Dana'}`}
      </p>

      {error && <p role="alert">{walletMessage(error, english)}</p>}
      {wallet.status === 'reconciliation-required' && <p role="alert">{walletMessage('WALLET_RECONCILIATION', english)}</p>}
      {notice && <p className="voucher-notice" role="status">{notice}</p>}

      {/* 1. Partner Vouchers Redeemed (with one-time code) */}
      {myVouchers.length > 0 && (
        <div className="partner-vouchers-section">
          <h3>{english ? 'Redeemed partner vouchers (One-time code)' : 'Voucher đối tác & ẩm thực đã đổi (Mã dùng một lần)'}</h3>
          {myVouchers.map((item) => (
            <article className="partner-voucher-card" key={item.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{item.partnerName}</strong>
                {item.isSample && (
                  <span className="partner-voucher-sample-badge">
                    {english ? 'Sample data' : 'Dữ liệu mẫu'}
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>{item.title}</p>
              <div>
                <span style={{ fontSize: '12px', display: 'block', marginBottom: '2px', color: '#555' }}>
                  {english ? 'Show this code at partner store:' : 'Đưa mã này tại quán đối tác khi thanh toán:'}
                </span>
                <span className="partner-voucher-code">{item.redemptionCode}</span>
              </div>
              <small style={{ color: '#666', marginTop: '4px' }}>
                {english ? `Expires: ${item.expiresAt}` : `Hạn dùng: ${item.expiresAt}`}
              </small>
            </article>
          ))}
        </div>
      )}

      {/* 2. Available Partner Vouchers for Exchange */}
      {available.length > 0 && (
        <div className="partner-vouchers-exchange">
          <h3>{english ? 'Exchange food & partner vouchers' : 'Đổi voucher ưu đãi đối tác ẩm thực'}</h3>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
            {english
              ? 'Sample partner vouchers for demonstration. All partner names and offers are samples.'
              : 'Dữ liệu mẫu thử nghiệm hệ thống voucher đối tác ẩm thực (ghi rõ Mẫu).'}
          </p>
          <div className="partner-available-list">
            {available.map((v) => (
              <article className="partner-voucher-card" key={v.id} style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{v.partnerName}</strong>
                  {v.isSample && <span className="partner-voucher-sample-badge">{english ? 'Sample' : 'Mẫu'}</span>}
                </div>
                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>{v.title}</p>
                <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#555' }}>{v.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#b45309', fontWeight: 'bold' }}>
                    {v.coinCost} {english ? 'coins' : 'xu'} ({english ? `${v.remaining} left` : `còn ${v.remaining} lượt`})
                  </span>
                  <button
                    className="partner-redeem-btn"
                    disabled={redeemingId === v.id || (wallet.balance ?? 0) < v.coinCost}
                    onClick={() => void handleRedeem(v)}
                    style={{
                      minHeight: '44px',
                      padding: '0 16px',
                      background: '#d97706',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {redeemingId === v.id
                      ? (english ? 'Redeeming…' : 'Đang đổi…')
                      : english ? `Redeem (${v.coinCost} coins)` : `Đổi (${v.coinCost} xu)`}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 3. In-App Digital Keepsakes */}
      <h3>{english ? 'In-app digital keepsakes' : 'Vật phẩm kỷ niệm trong ứng dụng'}</h3>
      {!loading && !wallet.receipts.length && !myVouchers.length && (
        <p>{english ? 'No vouchers collected yet.' : 'Bạn chưa đổi voucher nào.'}</p>
      )}
      {wallet.receipts.map((item) => {
        const reward = rewards.find((r) => r.id === item.rewardId)
        return (
          <article className="reward-card" key={item.id ?? item.rewardId}>
            <div className="reward-picture"><RewardArt id={item.rewardId} /></div>
            <div>
              <h3>{english ? reward?.nameEn : reward?.name}</h3>
              <p>{english ? reward?.benefitEn : reward?.benefit}</p>
              <p>{new Date(item.redeemedAt).toLocaleString(english ? 'en-GB' : 'vi-VN')} · {english ? 'Collected' : 'Đã nhận'}</p>
              <p>{english ? 'Digital keepsake only. No commercial partner, payment value, admission or booking.' : 'Vật phẩm kỷ niệm trong ứng dụng. Chưa có đối tác thương mại; không có giá trị thanh toán, vé vào cổng hoặc đặt chỗ.'}</p>
            </div>
          </article>
        )
      })}

      {/* 4. Coin History */}
      <details style={{ marginTop: '16px' }}>
        <summary>{english ? 'Coin history' : 'Lịch sử Xu Dana'}</summary>
        {wallet.entries.length === 0 ? (
          <p>{english ? 'No verified transactions.' : 'Chưa có giao dịch được xác nhận.'}</p>
        ) : (
          wallet.entries.map((entry) => (
            <div key={entry.source}>
              <strong>{entry.amount > 0 ? '+' : ''}{entry.amount} {english ? 'Dana Coins' : 'Xu Dana'}</strong>
              <p>
                {entry.source.startsWith('redeem:')
                  ? (english ? 'Voucher collected' : 'Đổi voucher')
                  : entry.source.startsWith('streak:')
                  ? (english ? 'Streak milestone reward' : 'Thưởng mốc streak')
                  : entry.source.startsWith('badge:')
                  ? (english ? 'Badge unlocked' : 'Mở khóa huy hiệu')
                  : entry.source.startsWith('golden-hour:')
                  ? (english ? 'Golden hour reward' : 'Thưởng giờ vàng')
                  : entry.source.startsWith('quest:')
                  ? (english ? 'Quest checkpoint completed' : 'Hoàn thành checkpoint quest')
                  : (english ? 'Mission completed' : 'Hoàn thành nhiệm vụ')}{' '}
                · {entry.at ? new Date(entry.at).toLocaleString(english ? 'en-GB' : 'vi-VN') : (english ? 'Historical record; date unavailable' : 'Dữ liệu cũ; chưa có thời điểm')}
              </p>
            </div>
          ))
        )}
      </details>
    </section>
  )
}
