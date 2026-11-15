export interface GreenTransitStation {
  id: string
  name: string
  type: 'bike' | 'bus'
  position: [number, number]
  address: string
  bonusCoins: number
}

/** Danh sách trạm xe đạp công cộng TNGo và điểm dừng xe buýt DanaBus thực tế tại Đà Nẵng */
export const GREEN_TRANSIT_STATIONS: GreenTransitStation[] = [
  // Trạm xe đạp TNGo quận Hải Châu & Sơn Trà
  {
    id: 'tngo-cau-rong-tay',
    name: 'Trạm TNGo - Đuôi Cầu Rồng',
    type: 'bike',
    position: [16.0601, 108.2215],
    address: 'Đường Bạch Đằng / 2 Tháng 9, P. Bình Hiên, Hải Châu',
    bonusCoins: 5,
  },
  {
    id: 'tngo-cau-rong-dong',
    name: 'Trạm TNGo - Đầu Cầu Rồng',
    type: 'bike',
    position: [16.0617, 108.2325],
    address: 'Đường Võ Văn Kiệt / Trần Hưng Đạo, Sơn Trà',
    bonusCoins: 5,
  },
  {
    id: 'tngo-bao-tang-cham',
    name: 'Trạm TNGo - Bảo tàng Chăm',
    type: 'bike',
    position: [16.0598, 108.2230],
    address: 'Số 02 đường 2 Tháng 9, Hải Châu',
    bonusCoins: 5,
  },
  {
    id: 'tngo-cong-vien-apec',
    name: 'Trạm TNGo - Công viên APEC',
    type: 'bike',
    position: [16.0585, 108.2227],
    address: 'Đường Bạch Đằng nối dài, Hải Châu',
    bonusCoins: 5,
  },
  {
    id: 'tngo-cau-song-han',
    name: 'Trạm TNGo - Cầu Sông Hàn',
    type: 'bike',
    position: [16.0718, 108.2241],
    address: 'Giao lộ Lê Duẩn - Bạch Đằng, Hải Châu',
    bonusCoins: 5,
  },
  {
    id: 'tngo-cho-han',
    name: 'Trạm TNGo - Chợ Hàn',
    type: 'bike',
    position: [16.0682, 108.2245],
    address: 'Đường Trần Phú / Hùng Vương, Hải Châu',
    bonusCoins: 5,
  },
  {
    id: 'tngo-bien-my-khe',
    name: 'Trạm TNGo - Bãi biển Mỹ Khê',
    type: 'bike',
    position: [16.0655, 108.2468],
    address: 'Đường Võ Nguyên Giáp, Sơn Trà',
    bonusCoins: 5,
  },
  {
    id: 'tngo-bien-dong',
    name: 'Trạm TNGo - Công viên Biển Đông',
    type: 'bike',
    position: [16.0715, 108.2475],
    address: 'Đường Võ Nguyên Giáp / Phạm Văn Đồng, Sơn Trà',
    bonusCoins: 5,
  },
  {
    id: 'tngo-due',
    name: 'Trạm TNGo - ĐH Kinh tế (DUE)',
    type: 'bike',
    position: [16.0468, 108.2375],
    address: '71 Ngũ Hành Sơn, Bắc Mỹ An, Ngũ Hành Sơn',
    bonusCoins: 5,
  },
  // Điểm dừng xe buýt trợ giá DanaBus
  {
    id: 'danabus-cau-rong',
    name: 'Điểm xe buýt DanaBus - Cầu Rồng (Tuyến R4A, R16)',
    type: 'bus',
    position: [16.0608, 108.2220],
    address: 'Đường 2 Tháng 9, Hải Châu',
    bonusCoins: 5,
  },
  {
    id: 'danabus-cham',
    name: 'Điểm xe buýt DanaBus - Bảo tàng Điêu khắc Chăm',
    type: 'bus',
    position: [16.0592, 108.2238],
    address: 'Đường 2 Tháng 9, Hải Châu',
    bonusCoins: 5,
  },
  {
    id: 'danabus-my-khe',
    name: 'Điểm xe buýt DanaBus - Tuyến ven biển Võ Nguyên Giáp',
    type: 'bus',
    position: [16.0660, 108.2462],
    address: 'Đường Võ Nguyên Giáp, Sơn Trà',
    bonusCoins: 5,
  },
  {
    id: 'danabus-due',
    name: 'Điểm xe buýt DanaBus - Đại học Kinh tế DUE',
    type: 'bus',
    position: [16.0475, 108.2368],
    address: 'Đường Ngũ Hành Sơn, Ngũ Hành Sơn',
    bonusCoins: 5,
  },
]
