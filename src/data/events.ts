export interface CityEvent {
  id: string
  title: string
  summary: string
  location: string
  scheduleLabel: string
  startAt?: string
  endAt?: string
  destinationId?: string
  reminderMinutes?: number
  recurring?: 'dragon-weekend'
  sourceUrl: string
  status: 'confirmed' | 'expected'
}

export const cityEvents: CityEvent[] = [
  {
    id: 'cau-rong-phun-lua',
    title: 'Cầu Rồng phun lửa, phun nước',
    summary: 'Màn trình diễn cuối tuần tại Cầu Rồng. Hãy đến sớm, đứng ở khu vực quan sát an toàn và làm theo hướng dẫn điều tiết giao thông.',
    location: 'Cầu Rồng, Đà Nẵng',
    scheduleLabel: '21:00 tối thứ Sáu, thứ Bảy, Chủ nhật và ngày lễ',
    destinationId: 'cau-rong',
    reminderMinutes: 60,
    recurring: 'dragon-weekend',
    sourceUrl: 'https://danangfantasticity.com/vi/kham-pha/da-nang-dip-le-2-9-co-gi-goi-y-su-kien-va-trai-nghiem-dang-chu-y',
    status: 'confirmed',
  },
  {
    id: 'di-san-van-hoa-viet-nam-2026',
    title: 'Hoạt động Ngày Di sản văn hóa Việt Nam',
    summary: 'Chuỗi hoạt động kỷ niệm Ngày Di sản văn hóa Việt Nam tại khu phố cổ Hội An.',
    location: 'Khu phố cổ Hội An',
    scheduleLabel: '23/11 – 07/12/2026 · thời gian dự kiến',
    startAt: '2026-11-23T00:00:00+07:00',
    endAt: '2026-12-07T23:59:59+07:00',
    sourceUrl: 'https://danangfantasticity.com/vi/kham-pha/le-hoi-su-kien-da-nang-6-thang-cuoi-nam-2026',
    status: 'expected',
  },
  {
    id: 'christmas-market-2026',
    title: 'Da Nang Christmas Market 2026',
    summary: 'Không gian Giáng sinh với mua sắm, ẩm thực, biểu diễn nghệ thuật và trang trí ánh sáng.',
    location: 'Ariyana Convention Centre Đà Nẵng, 107 Võ Nguyên Giáp',
    scheduleLabel: '04 – 06/12/2026',
    startAt: '2026-12-04T00:00:00+07:00',
    endAt: '2026-12-06T23:59:59+07:00',
    sourceUrl: 'https://danangfantasticity.com/vi/kham-pha/le-hoi-su-kien-da-nang-6-thang-cuoi-nam-2026',
    status: 'confirmed',
  },
]

export const getCityEvent = (id: string) => cityEvents.find(event => event.id === id)

export function nextEventOccurrence(event: CityEvent, from = new Date()) {
  if (event.recurring === 'dragon-weekend') {
    for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
      const candidate = new Date(from)
      candidate.setDate(from.getDate() + dayOffset)
      candidate.setHours(21, 0, 0, 0)
      if ([0, 5, 6].includes(candidate.getDay()) && candidate.getTime() > from.getTime()) return candidate
    }
  }
  if (event.startAt) {
    const start = new Date(event.startAt)
    if (start.getTime() > from.getTime()) return start
  }
  return null
}

