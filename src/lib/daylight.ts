/** Mức "tối" của bản đồ theo giờ thật tại Đà Nẵng: 0 = ban ngày, 1 = ban đêm, chuyển dần lúc hoàng hôn / bình minh. */
const LAT = 16.0544
const LON = 108.2022
const VN_OFFSET_MIN = 7 * 60
const rad = (deg: number) => deg * Math.PI / 180

/** Giờ mặt trời mọc / lặn (mili giây UTC) của ngày địa phương chứa `date`, theo công thức NOAA đơn giản. */
export function sunTimes(date: Date) {
  const local = new Date(date.getTime() + VN_OFFSET_MIN * 60000)
  const base = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
  const dayOfYear = Math.floor((base - Date.UTC(local.getUTCFullYear(), 0, 0)) / 86400000)
  const g = 2 * Math.PI / 365 * (dayOfYear - 1)
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
  const cosHa = Math.cos(rad(90.833)) / (Math.cos(rad(LAT)) * Math.cos(decl)) - Math.tan(rad(LAT)) * Math.tan(decl)
  const ha = Math.acos(Math.max(-1, Math.min(1, cosHa))) * 180 / Math.PI
  return {
    base,
    sunrise: base + (720 - 4 * (LON + ha) - eqTime) * 60000,
    sunset: base + (720 - 4 * (LON - ha) - eqTime) * 60000,
  }
}

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t) }

export function mapDarkness(date: Date = new Date()): number {
  const { sunrise, sunset } = sunTimes(date)
  const minute = 60000
  const now = date.getTime()
  if (now < sunrise + 20 * minute) return 1 - smooth((now - (sunrise - 60 * minute)) / (80 * minute)) // bình minh
  if (now > sunset - 20 * minute) return smooth((now - (sunset - 20 * minute)) / (80 * minute))       // hoàng hôn
  return 0
}

/** Cho phép thử nhanh bằng địa chỉ ?gio=19.5 (19 giờ 30, giờ Việt Nam). Giá trị sai thì dùng giờ thật. */
export function clockOverride(search: string, now: Date = new Date()): Date | null {
  const raw = new URLSearchParams(search).get('gio')
  const hours = raw === null || raw.trim() === '' ? NaN : Number(raw)
  if (!Number.isFinite(hours) || hours < 0 || hours >= 24) return null
  const { base } = sunTimes(now)
  return new Date(base + (hours * 60 - VN_OFFSET_MIN) * 60000)
}
