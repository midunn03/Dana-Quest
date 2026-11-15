export interface GreenTransitStation {
  id: string
  name: string
  type: 'bike' | 'bus'
  position: [number, number]
  address: string
  bonusCoins: number
  operator?: string
  sourceUrl?: string
  verified?: boolean
}

/**
 * Danh sách trạm xe đạp công cộng TNGo và điểm dừng xe buýt DanaBus tại Đà Nẵng.
 * Dữ liệu được đồng bộ từ Django Admin (TransitStation).
 * Các trạm chưa kiểm chứng thực tế có verified: false.
 */
export const GREEN_TRANSIT_STATIONS: GreenTransitStation[] = [
  // Trạm xe đạp TNGo đã xác minh thực tế (Nhà vận hành: Công ty CP Tập đoàn Trí Nam)
  {
    id: 'tngo-bao-tang-cham',
    name: 'Trạm TNGo - Bảo tàng Điêu khắc Chăm',
    type: 'bike',
    position: [16.0598, 108.2230],
    address: 'Số 02 đường 2 Tháng 9, P. Bình Hiên, Hải Châu',
    operator: 'TNGo (Tập đoàn Trí Nam)',
    sourceUrl: 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
    bonusCoins: 5,
    verified: true,
  },
  {
    id: 'tngo-cong-vien-apec',
    name: 'Trạm TNGo - Công viên APEC',
    type: 'bike',
    position: [16.0585, 108.2227],
    address: 'Đường Bạch Đằng nối dài, P. Bình Hiên, Hải Châu',
    operator: 'TNGo (Tập đoàn Trí Nam)',
    sourceUrl: 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
    bonusCoins: 5,
    verified: true,
  },
  {
    id: 'tngo-cau-song-han',
    name: 'Trạm TNGo - Cầu Sông Hàn',
    type: 'bike',
    position: [16.0718, 108.2241],
    address: 'Giao lộ Lê Duẩn - Bạch Đằng (đối diện 68 Bạch Đằng), Hải Châu',
    operator: 'TNGo (Tập đoàn Trí Nam)',
    sourceUrl: 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
    bonusCoins: 5,
    verified: true,
  },
  {
    id: 'tngo-cho-han',
    name: 'Trạm TNGo - Chợ Hàn',
    type: 'bike',
    position: [16.0682, 108.2245],
    address: 'Đường Trần Phú / Hùng Vương, Hải Châu',
    operator: 'TNGo (Tập đoàn Trí Nam)',
    sourceUrl: 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
    bonusCoins: 5,
    verified: true,
  },
  {
    id: 'tngo-bien-dong',
    name: 'Trạm TNGo - Công viên Biển Đông',
    type: 'bike',
    position: [16.0715, 108.2475],
    address: 'Đường Võ Nguyên Giáp / Phạm Văn Đồng, Sơn Trà',
    operator: 'TNGo (Tập đoàn Trí Nam)',
    sourceUrl: 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
    bonusCoins: 5,
    verified: true,
  },
  {
    id: 'tngo-due',
    name: 'Trạm TNGo - Đại học Kinh tế (DUE)',
    type: 'bike',
    position: [16.0468, 108.2375],
    address: '71 Ngũ Hành Sơn, Bắc Mỹ An, Ngũ Hành Sơn',
    operator: 'TNGo (Tập đoàn Trí Nam)',
    sourceUrl: 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
    bonusCoins: 5,
    verified: true,
  },
  {
    id: 'tngo-bien-my-khe',
    name: 'Trạm TNGo - Bãi biển Mỹ Khê',
    type: 'bike',
    position: [16.0655, 108.2468],
    address: 'Đường Võ Nguyên Giáp, Sơn Trà',
    operator: 'TNGo (Tập đoàn Trí Nam)',
    sourceUrl: 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
    bonusCoins: 5,
    verified: true,
  },
  // Điểm dừng xe buýt DanaBus đã xác minh (Đơn vị: Trung tâm Datram - Sở GTVT)
  {
    id: 'danabus-cham',
    name: 'Điểm xe buýt DanaBus - Bảo tàng Điêu khắc Chăm',
    type: 'bus',
    position: [16.0592, 108.2238],
    address: 'Đường 2 Tháng 9, Hải Châu',
    operator: 'DanaBus (Datram)',
    sourceUrl: 'https://www.danangbus.vn',
    bonusCoins: 5,
    verified: true,
  },
  {
    id: 'danabus-my-khe',
    name: 'Điểm xe buýt DanaBus - Tuyến ven biển Võ Nguyên Giáp',
    type: 'bus',
    position: [16.0660, 108.2462],
    address: 'Đường Võ Nguyên Giáp, Sơn Trà',
    operator: 'DanaBus (Datram)',
    sourceUrl: 'https://www.danangbus.vn',
    bonusCoins: 5,
    verified: true,
  },
  {
    id: 'danabus-due',
    name: 'Điểm xe buýt DanaBus - Đại học Kinh tế (DUE)',
    type: 'bus',
    position: [16.0475, 108.2368],
    address: 'Đường Ngũ Hành Sơn, Ngũ Hành Sơn',
    operator: 'DanaBus (Datram)',
    sourceUrl: 'https://www.danangbus.vn',
    bonusCoins: 5,
    verified: true,
  },
  // Các điểm chưa xác minh tọa độ chính xác hoặc số tuyến cũ
  {
    id: 'tngo-cau-rong-tay',
    name: 'Trạm TNGo - Đuôi Cầu Rồng (Bờ Tây)',
    type: 'bike',
    position: [16.0601, 108.2215],
    address: 'Đường Bạch Đằng / 2 Tháng 9, P. Bình Hiên, Hải Châu',
    operator: 'TNGo (Tập đoàn Trí Nam)',
    sourceUrl: 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
    bonusCoins: 5,
    verified: false,
  },
  {
    id: 'tngo-cau-rong-dong',
    name: 'Trạm TNGo - Đầu Cầu Rồng (Bờ Đông)',
    type: 'bike',
    position: [16.0617, 108.2325],
    address: 'Đường Võ Văn Kiệt / Trần Hưng Đạo, Sơn Trà',
    operator: 'TNGo (Tập đoàn Trí Nam)',
    sourceUrl: 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
    bonusCoins: 5,
    verified: false,
  },
  {
    id: 'danabus-cau-rong',
    name: 'Điểm xe buýt DanaBus - Cầu Rồng',
    type: 'bus',
    position: [16.0608, 108.2220],
    address: 'Đường 2 Tháng 9, Hải Châu',
    operator: 'DanaBus (Datram)',
    sourceUrl: 'https://www.danangbus.vn',
    bonusCoins: 5,
    verified: false,
  },
]

export async function fetchLiveTransitStations(): Promise<GreenTransitStation[]> {
  try {
    const res = await fetch('/api/pixel/transit/stations')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.stations) && data.stations.length > 0) {
        return data.stations
      }
    }
  } catch {}
  return GREEN_TRANSIT_STATIONS.filter(s => s.verified !== false)
}
