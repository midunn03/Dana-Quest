export interface PartnerVoucherItem {
  id: number
  codePrefix: string
  partnerName: string
  destinationId: string
  title: string
  description: string
  coinCost: number
  remaining: number
  expiresAt: string
  isSample: boolean
}

export interface MyVoucherItem {
  id: number
  redemptionCode: string
  partnerName: string
  title: string
  description: string
  coinSpent: number
  redeemedAt: number
  expiresAt: string
  isUsed: boolean
  isSample: boolean
}

export async function fetchAvailablePartnerVouchers(): Promise<PartnerVoucherItem[]> {
  try {
    const res = await fetch('/api/game/vouchers')
    if (!res.ok) return []
    const data = await res.json()
    return data.vouchers ?? []
  } catch {
    return []
  }
}

export async function fetchMyPartnerVouchers(): Promise<MyVoucherItem[]> {
  try {
    const res = await fetch('/api/game/vouchers/my', { credentials: 'include' })
    if (!res.ok) return []
    const data = await res.json()
    return data.vouchers ?? []
  } catch {
    return []
  }
}

export async function redeemPartnerVoucher(voucherId: number): Promise<{
  success: boolean
  redemptionCode?: string
  message?: string
}> {
  try {
    const res = await fetch('/api/game/vouchers/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ voucherId }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, message: data.message || 'Không thể đổi voucher.' }
    }
    window.dispatchEvent(new CustomEvent('dana-voucher-redeemed', { detail: data }))
    return { success: true, redemptionCode: data.redemptionCode, message: data.message }
  } catch {
    return { success: false, message: 'Lỗi mạng khi kết nối máy chủ.' }
  }
}
