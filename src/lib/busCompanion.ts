import { getSyncAccountId } from './accountSync'
import { authApiBase } from './auth'
import { t } from '../i18n/locale'

export interface BusGiftcodeInfo {
  code: string
  routeCode: string
  label: string
  coins: number
}

const BUS_ROUTE_GIFTCODE_SPECS = [
  { routeCode: '02', label: 'Tuyến 02 · BX Trung tâm ↔ Cửa Đại', coins: 15 },
  { routeCode: '03', label: 'Tuyến 03 · Sân bay ↔ Bà Nà Hills', coins: 20 },
  { routeCode: '05', label: 'Tuyến 05 · Hòa Hiệp Nam ↔ CV Biển Đông', coins: 15 },
  { routeCode: '06', label: 'Tuyến 06 · Sân bay ↔ Cầu Rồng ↔ Mỹ Khê', coins: 15 },
  { routeCode: '07', label: 'Tuyến 07 · Xuân Diệu ↔ Hòa Phước', coins: 15 },
  { routeCode: '08', label: 'Tuyến 08 · Vũng Thùng ↔ ĐH Kinh tế DUE', coins: 15 },
  { routeCode: '11', label: 'Tuyến 11 · Xuân Diệu ↔ Lotte ↔ BV Phụ sản Nhi', coins: 15 },
  { routeCode: '12', label: 'Tuyến 12 · Xuân Diệu ↔ Sân bay ↔ Phạm Hùng', coins: 15 },
] as const

export const BUS_GIFTCODE_SUFFIXES = ['', 'A', 'B', 'C', 'D', 'E'] as const

export const BUS_GIFTCODES: readonly BusGiftcodeInfo[] = BUS_ROUTE_GIFTCODE_SPECS.flatMap(spec =>
  BUS_GIFTCODE_SUFFIXES.map(suffix => ({
    code: `DANABUS${spec.routeCode}${suffix}`,
    routeCode: spec.routeCode,
    label: spec.label,
    coins: spec.coins,
  })),
)

export function getBusGiftcodesForRoute(routeCode: string): BusGiftcodeInfo[] {
  return BUS_GIFTCODES.filter(item => item.routeCode === routeCode)
}

export const BUS_MINIGAME_REWARD_COINS = 10

const REDEEMED_STORAGE_PREFIX = 'dana_bus_giftcodes_v1'
const storageKey = () => {
  const owner = getSyncAccountId()
  return owner ? `${REDEEMED_STORAGE_PREFIX}:${owner}` : `${REDEEMED_STORAGE_PREFIX}:guest`
}

export function extractBusGiftcode(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const parsed = new URL(trimmed)
      const q = parsed.searchParams.get('buscode') || parsed.searchParams.get('code') || parsed.searchParams.get('giftcode')
      if (q) return q.replace(/[^a-z0-9]/gi, '').toUpperCase()
    }
  } catch {}
  return trimmed.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

export function getRedeemedBusGiftcodes(): string[] {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function rememberRedeemedCode(code: string) {
  const list = getRedeemedBusGiftcodes()
  if (!list.includes(code)) {
    list.push(code)
    try {
      localStorage.setItem(storageKey(), JSON.stringify(list))
    } catch {}
  }
}

export interface BusRewardResult {
  success: boolean
  code?: string
  bonusCoins?: number
  balance?: number
  message: string
  requiresAuth?: boolean
}

export async function redeemBusGiftcode(rawInput: string): Promise<BusRewardResult> {
  const normalized = extractBusGiftcode(rawInput)
  if (!normalized) {
    return { success: false, code: 'EMPTY', message: t('Vui lòng nhập hoặc quét mã giftcode dán trên xe buýt.') }
  }

  const known = BUS_GIFTCODES.find(item => item.code === normalized)
  if (!known) {
    return { success: false, code: 'INVALID_GIFTCODE', message: t('Mã giftcode không hợp lệ. Kiểm tra lại mã dán trên xe buýt DanaBus.') }
  }

  const owner = getSyncAccountId()
  if (!owner) {
    return {
      success: false,
      code: 'AUTH_REQUIRED',
      requiresAuth: true,
      message: t('Vui lòng đăng nhập để nhập giftcode và cộng Xu Dana vào ví tài khoản của bạn.'),
    }
  }

  try {
    const res = await fetch(`${authApiBase()}/transit/giftcode`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Dana-User': owner,
      },
      body: JSON.stringify({ code: normalized }),
    })

    if (res.status === 401) {
      return {
        success: false,
        code: 'AUTH_REQUIRED',
        requiresAuth: true,
        message: t('Vui lòng đăng nhập để nhập giftcode và nhận Xu Dana vào ví.'),
      }
    }

    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (payload.code === 'GIFTCODE_ALREADY_REDEEMED') {
        rememberRedeemedCode(normalized)
      }
      return {
        success: false,
        code: payload.code || 'REDEEM_FAILED',
        message: payload.message || payload.error || t('Không thể áp dụng giftcode lúc này.'),
      }
    }

    rememberRedeemedCode(normalized)
    window.dispatchEvent(new Event('dana-wallet-updated'))
    const msg = payload.message || `🎉 Nhập mã ${normalized} thành công (+${known.coins} Xu Dana)!`
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
    return {
      success: true,
      code: normalized,
      bonusCoins: payload.bonusCoins ?? known.coins,
      balance: payload.balance,
      message: msg,
    }
  } catch (err) {
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : t('Lỗi kết nối khi xác thực giftcode.'),
    }
  }
}

export async function claimBusMinigameReward(
  routeCode: string,
  score: number,
  total: number,
): Promise<BusRewardResult> {
  if (score < 3) {
    return {
      success: false,
      code: 'SCORE_TOO_LOW',
      message: t('Cần trả lời đúng ít nhất 3/5 câu để nhận thưởng minigame trên xe!'),
    }
  }

  const owner = getSyncAccountId()
  if (!owner) {
    return {
      success: false,
      code: 'AUTH_REQUIRED',
      requiresAuth: true,
      message: t('Đăng nhập để cộng +10 Xu Dana thưởng minigame vào ví tài khoản của bạn!'),
    }
  }

  try {
    const res = await fetch(`${authApiBase()}/transit/minigame`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Dana-User': owner,
      },
      body: JSON.stringify({ routeCode, score, total }),
    })

    if (res.status === 401) {
      return {
        success: false,
        code: 'AUTH_REQUIRED',
        requiresAuth: true,
        message: t('Vui lòng đăng nhập để cộng Xu Dana vào ví tài khoản.'),
      }
    }

    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        success: false,
        code: payload.code || 'MINIGAME_FAILED',
        message: payload.message || payload.error || t('Chưa thể nhận thưởng minigame lúc này.'),
      }
    }

    window.dispatchEvent(new Event('dana-wallet-updated'))
    const msg = payload.message || `🎉 Hoàn thành minigame (+${BUS_MINIGAME_REWARD_COINS} Xu Dana)!`
    window.dispatchEvent(new CustomEvent('dana-toast', { detail: msg }))
    return {
      success: true,
      bonusCoins: payload.bonusCoins ?? BUS_MINIGAME_REWARD_COINS,
      balance: payload.balance,
      message: msg,
    }
  } catch (err) {
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : t('Lỗi kết nối khi nhận thưởng minigame.'),
    }
  }
}

export interface BusQuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  fact: string
}

export const BUS_QUIZ_BANK: readonly BusQuizQuestion[] = [
  {
    id: 'q-cau-rong',
    question: 'Cầu Rồng Đà Nẵng thường phun lửa và phun nước vào tối những ngày nào?',
    options: ['Thứ 2 & Thứ 4', 'Thứ 6, Thứ 7 & Chủ nhật', 'Chỉ ngày lễ Tết', 'Mỗi buổi sáng'],
    correctIndex: 1,
    fact: 'Cầu Rồng phun lửa & nước lúc 21h00 tối Thứ 6, Thứ 7, Chủ nhật hằng tuần.',
  },
  {
    id: 'q-cau-quay',
    question: 'Cây cầu nào ở Đà Nẵng nổi tiếng có nhịp giữa quay được cho tàu thuyền đi qua?',
    options: ['Cầu Rồng', 'Cầu Trần Thị Lý', 'Cầu Sông Hàn', 'Cầu Thuận Phước'],
    correctIndex: 2,
    fact: 'Cầu Sông Hàn là cây cầu quay đầu tiên do kỹ sư Việt Nam thiết kế và thi công.',
  },
  {
    id: 'q-ve-buyt',
    question: 'Giá vé lượt phổ thông các tuyến xe buýt trợ giá DanaBus (05, 07, 08, 11, 12) là bao nhiêu?',
    options: ['5.000đ', '8.000đ', '15.000đ', '25.000đ'],
    correctIndex: 1,
    fact: 'Vé lượt tuyến trợ giá DanaBus chỉ 8.000đ/lượt — siêu tiết kiệm và xanh!',
  },
  {
    id: 'q-cham',
    question: 'Bảo tàng Điêu khắc Chăm nằm ngay giao lộ đường 2 Tháng 9 và đường nào?',
    options: ['Trưng Nữ Vương', 'Nguyễn Văn Linh (đuôi Cầu Rồng)', 'Phạm Văn Đồng', 'Lê Duẩn'],
    correctIndex: 1,
    fact: 'Bảo tàng Chăm nằm ngay số 02 đường 2/9, sát đuôi Cầu Rồng và Công viên APEC.',
  },
  {
    id: 'q-son-tra',
    question: 'Bán đảo Sơn Trà được mệnh danh là gì của thành phố Đà Nẵng?',
    options: ['Lá phổi xanh của Đà Nẵng', 'Thung lũng hoa', 'Đảo ngọc miền Bắc', 'Thành phố không ngủ'],
    correctIndex: 0,
    fact: 'Bán đảo Sơn Trà là lá phổi xanh bảo tồn loài Voọc chà vá chân nâu quý hiếm.',
  },
  {
    id: 'q-nhs',
    question: 'Quần thể Danh thắng Ngũ Hành Sơn gồm 5 ngọn núi đặt tên theo thuyết nào?',
    options: ['Tứ linh', 'Ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ)', 'Ngũ phúc', 'Bát quái'],
    correctIndex: 1,
    fact: '5 ngọn núi là Kim Sơn, Mộc Sơn, Thủy Sơn, Hỏa Sơn và Thổ Sơn.',
  },
  {
    id: 'q-xe-dien',
    question: 'Đi xe buýt điện DanaBus thay cho xe máy cá nhân giúp giảm yếu tố nào rõ rệt nhất?',
    options: ['Khí thải CO₂ & tiếng ồn đô thị', 'Gió biển', 'Độ dài con đường', 'Số lượng đèn đỏ'],
    correctIndex: 0,
    fact: 'Các tuyến 02, 03, 05, 07, 08, 11 đều vận hành bằng xe buýt điện không khói thải!',
  },
  {
    id: 'q-my-khe',
    question: 'Bãi biển Mỹ Khê nằm dọc theo tuyến đường ven biển nổi tiếng nào?',
    options: ['Bạch Đằng', 'Võ Nguyên Giáp', 'Điện Biên Phủ', 'Nguyễn Tất Thành'],
    correctIndex: 1,
    fact: 'Tuyến xe buýt số 06 chạy dọc đường Võ Nguyên Giáp ngay sát Bãi biển Mỹ Khê.',
  },
  {
    id: 'q-due',
    question: 'Trường Đại học Kinh tế – Đại học Đà Nẵng (DUE) tọa lạc tại địa chỉ nào?',
    options: ['71 Ngũ Hành Sơn', '42 Bạch Đằng', '02 Đường 2/9', '151 Trần Phú'],
    correctIndex: 0,
    fact: 'Tuyến buýt điện số 08 đi ngay qua cổng 71 Ngũ Hành Sơn của ĐH Kinh tế (DUE).',
  },
  {
    id: 'q-apec',
    question: 'Công trình kiến trúc mái vòm cánh diều bay cao bên bờ Tây sông Hàn là địa điểm nào?',
    options: ['Công viên Biển Đông', 'Công viên APEC', 'Chợ Hàn', 'Hải Vân Quan'],
    correctIndex: 1,
    fact: 'Công viên APEC nổi bật với mái vòm "Cánh diều bay cao" ngay sát bờ sông Hàn.',
  },
]

export function pickBusQuizRound(seed: string, count = 5): BusQuizQuestion[] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  const pool = [...BUS_QUIZ_BANK]
  const chosen: BusQuizQuestion[] = []
  while (chosen.length < Math.min(count, pool.length)) {
    const idx = hash % pool.length
    chosen.push(pool.splice(idx, 1)[0])
    hash = (hash * 1103515245 + 12345) >>> 0
  }
  return chosen
}
