import { mkdir, readFile, writeFile, rename, unlink } from './db-storage.mjs'
import { join } from 'node:path'

export const DAILY_TRANSIT_CAP = 20
export const MAX_TRANSIT_DISTANCE_METERS = 80
export const MAX_GPS_ACCURACY_METERS = 50
export const MIN_DWELL_SECONDS = 60

// Danh mục 8 tuyến DanaBus Đà Nẵng — mỗi tuyến có 6 giftcode (tổng 48 mã) để test liên tục;
// mỗi tài khoản chỉ được nhập mỗi mã duy nhất 1 lần.
const BUS_ROUTE_GIFTCODE_SPECS = [
  { routeCode: '02', label: 'Tuyến 02 · BX Trung tâm ↔ Cửa Đại', coins: 15 },
  { routeCode: '03', label: 'Tuyến 03 · Sân bay ↔ Bà Nà Hills', coins: 20 },
  { routeCode: '05', label: 'Tuyến 05 · Hòa Hiệp Nam ↔ CV Biển Đông', coins: 15 },
  { routeCode: '06', label: 'Tuyến 06 · Sân bay ↔ Cầu Rồng ↔ Mỹ Khê', coins: 15 },
  { routeCode: '07', label: 'Tuyến 07 · Xuân Diệu ↔ Hòa Phước', coins: 15 },
  { routeCode: '08', label: 'Tuyến 08 · Vũng Thùng ↔ ĐH Kinh tế DUE', coins: 15 },
  { routeCode: '11', label: 'Tuyến 11 · Xuân Diệu ↔ Lotte ↔ BV Phụ sản Nhi', coins: 15 },
  { routeCode: '12', label: 'Tuyến 12 · Xuân Diệu ↔ Sân bay ↔ Phạm Hùng', coins: 15 },
]

export const BUS_GIFTCODE_SUFFIXES = ['', 'A', 'B', 'C', 'D', 'E']

export const BUS_GIFTCODES = Object.fromEntries(
  BUS_ROUTE_GIFTCODE_SPECS.flatMap(spec =>
    BUS_GIFTCODE_SUFFIXES.map(suffix => {
      const code = `DANABUS${spec.routeCode}${suffix}`
      return [code, { code, routeCode: spec.routeCode, label: spec.label, coins: spec.coins }]
    }),
  ),
)

export const BUS_MINIGAME_REWARD_COINS = 10

export function normalizeBusGiftcode(raw) {
  if (typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  // Hỗ trợ quét QR dạng URL ?buscode=DANABUS06 hoặc ?code=DANABUS06
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const parsed = new URL(trimmed)
      const q = parsed.searchParams.get('buscode') || parsed.searchParams.get('code') || parsed.searchParams.get('giftcode')
      if (q) return q.replace(/[^a-z0-9]/gi, '').toUpperCase()
    }
  } catch {}
  return trimmed.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

const fail = (code, status = 400, message = code) => Object.assign(new Error(message), { status, code })

export function getVietnamDateKey(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp))
}

export function distanceMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Danh sách trạm đã xác minh tại Đà Nẵng
export const VERIFIED_STATIONS = [
  { id: 'tngo-bao-tang-cham', name: 'Trạm TNGo - Bảo tàng Điêu khắc Chăm', type: 'bike', position: [16.0598, 108.2230], bonusCoins: 5 },
  { id: 'tngo-cong-vien-apec', name: 'Trạm TNGo - Công viên APEC', type: 'bike', position: [16.0585, 108.2227], bonusCoins: 5 },
  { id: 'tngo-cau-song-han', name: 'Trạm TNGo - Cầu Sông Hàn', type: 'bike', position: [16.0718, 108.2241], bonusCoins: 5 },
  { id: 'tngo-cho-han', name: 'Trạm TNGo - Chợ Hàn', type: 'bike', position: [16.0682, 108.2245], bonusCoins: 5 },
  { id: 'tngo-bien-dong', name: 'Trạm TNGo - Công viên Biển Đông', type: 'bike', position: [16.0715, 108.2475], bonusCoins: 5 },
  { id: 'tngo-due', name: 'Trạm TNGo - Đại học Kinh tế (DUE)', type: 'bike', position: [16.0468, 108.2375], bonusCoins: 5 },
  { id: 'tngo-bien-my-khe', name: 'Trạm TNGo - Bãi biển Mỹ Khê', type: 'bike', position: [16.0655, 108.2468], bonusCoins: 5 },
  { id: 'danabus-cham', name: 'Điểm xe buýt DanaBus - Bảo tàng Điêu khắc Chăm', type: 'bus', position: [16.0592, 108.2238], bonusCoins: 5 },
  { id: 'danabus-my-khe', name: 'Điểm xe buýt DanaBus - Tuyến ven biển Võ Nguyên Giáp', type: 'bus', position: [16.0660, 108.2462], bonusCoins: 5 },
  { id: 'danabus-due', name: 'Điểm xe buýt DanaBus - Đại học Kinh tế (DUE)', type: 'bus', position: [16.0475, 108.2368], bonusCoins: 5 },
]

export function createTransitClaims(directory, { dailyCap = DAILY_TRANSIT_CAP, stations = VERIFIED_STATIONS } = {}) {
  let queue = Promise.resolve()
  const filename = owner => {
    if (typeof owner !== 'string' || !/^[-\w]{1,80}$/.test(owner)) throw fail('TRANSIT_OWNER', 400)
    return join(directory, `${owner}.json`)
  }
  const serial = action => {
    const task = queue.then(action)
    queue = task.catch(() => {})
    return task
  }

  async function save(owner, value) {
    await mkdir(directory, { recursive: true })
    await writeFile(`${filename(owner)}.tmp`, JSON.stringify(value), { mode: 0o600 })
    await rename(`${filename(owner)}.tmp`, filename(owner))
  }

  async function read(owner) {
    try {
      const data = JSON.parse(await readFile(filename(owner), 'utf8'))
      if (data && data.version === 1 && data.owner === owner && Array.isArray(data.claims)) {
        return data
      }
    } catch (cause) {
      if (cause.code !== 'ENOENT') throw cause
    }
    return { version: 1, owner, claims: [] }
  }

  return {
    read: owner => serial(() => read(owner)),

    claim: (owner, { stationId, coordinates, accuracy, dwellSeconds = 60, simulating = false, now = Date.now() }) =>
      serial(async () => {
        // Chống gian lận 1: Không chấp nhận vị trí mô phỏng
        if (simulating === true) {
          throw fail('SIMULATION_BLOCKED', 403, 'Không thể nhận thưởng khi đang ở chế độ mô phỏng.')
        }

        // Kiểm tra trạm tồn tại trong danh mục xác minh
        const station = stations.find(s => s.id === stationId)
        if (!station) {
          throw fail('STATION_NOT_FOUND', 404, 'Trạm di chuyển xanh không tồn tại hoặc chưa được xác minh.')
        }

        // Chống gian lận 2: Kiểm tra tọa độ GPS
        if (!Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(Number.isFinite) || Math.abs(coordinates[0]) > 90 || Math.abs(coordinates[1]) > 180) {
          throw fail('INVALID_COORDINATES', 400, 'Tọa độ GPS không hợp lệ.')
        }
        const dist = distanceMeters(coordinates, station.position)
        if (dist > MAX_TRANSIT_DISTANCE_METERS) {
          throw fail('TOO_FAR', 400, `Bạn đang cách trạm ${Math.round(dist)}m (yêu cầu trong phạm vi ${MAX_TRANSIT_DISTANCE_METERS}m).`)
        }

        // Chống gian lận 3: Kiểm tra độ chính xác GPS
        if (!Number.isFinite(accuracy) || accuracy <= 0 || accuracy > MAX_GPS_ACCURACY_METERS) {
          throw fail('ACCURACY_TOO_LOW', 400, `Độ chính xác GPS (${Math.round(accuracy || 0)}m) chưa đạt yêu cầu (≤ ${MAX_GPS_ACCURACY_METERS}m).`)
        }

        // Chống gian lận 4: Kiểm tra thời gian lưu lại trạm tối thiểu 60s
        if (!Number.isFinite(dwellSeconds) || dwellSeconds < MIN_DWELL_SECONDS) {
          throw fail('DWELL_TOO_SHORT', 400, `Cần ở lại khu vực trạm tối thiểu ${MIN_DWELL_SECONDS} giây (hiện tại: ${Math.round(dwellSeconds || 0)}s).`)
        }

        // Chống gian lận 5: Giới hạn theo ngày tại Việt Nam
        const dateKey = getVietnamDateKey(now)
        const state = await read(owner)

        // Mỗi trạm tối đa 1 lần / ngày
        const alreadyClaimed = state.claims.some(c => c.stationId === stationId && c.dateKey === dateKey)
        if (alreadyClaimed) {
          throw fail('ALREADY_CLAIMED_TODAY', 409, 'Bạn đã nhận thưởng cho trạm này trong ngày hôm nay rồi.')
        }

        // Trần xu di chuyển xanh mỗi ngày (chỉ tính các lượt check-in trạm)
        const todayCoins = state.claims
          .filter(c => c.dateKey === dateKey && typeof c.source === 'string' && c.source.startsWith('transit:'))
          .reduce((sum, c) => sum + c.amount, 0)
        if (todayCoins + station.bonusCoins > dailyCap) {
          throw fail('DAILY_CAP_REACHED', 409, `Bạn đã đạt trần nhận thưởng di chuyển xanh trong ngày (${dailyCap} xu/ngày).`)
        }

        const record = {
          stationId,
          amount: station.bonusCoins,
          claimedAt: now,
          dateKey,
          source: `transit:${stationId}:${dateKey}`,
          coordinates,
          accuracy,
          dwellSeconds,
        }

        state.claims.push(record)
        await save(owner, state)
        return record
      }),

    redeemGiftcode: (owner, { code, now = Date.now() }) =>
      serial(async () => {
        const normalized = normalizeBusGiftcode(code)
        if (!normalized || !Object.hasOwn(BUS_GIFTCODES, normalized)) {
          throw fail('INVALID_GIFTCODE', 404, 'Mã giftcode xe buýt không hợp lệ. Vui lòng kiểm tra lại mã dán trên xe.')
        }
        const entry = BUS_GIFTCODES[normalized]
        const source = `bus-giftcode:${normalized}`
        const state = await read(owner)

        if (state.claims.some(c => c.source === source)) {
          throw fail('GIFTCODE_ALREADY_REDEEMED', 409, `Tài khoản của bạn đã sử dụng mã ${normalized} rồi (mỗi tài khoản chỉ được nhập 1 lần).`)
        }

        const dateKey = getVietnamDateKey(now)
        const record = {
          stationId: `giftcode-${normalized.toLowerCase()}`,
          giftcode: normalized,
          routeCode: entry.routeCode,
          amount: entry.coins,
          claimedAt: now,
          dateKey,
          source,
        }
        state.claims.push(record)
        await save(owner, state)
        return { ...record, label: entry.label }
      }),

    claimMinigame: (owner, { routeCode, score, total = 5, now = Date.now() }) =>
      serial(async () => {
        const cleanRoute = typeof routeCode === 'string' ? routeCode.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 12) : ''
        if (!cleanRoute) throw fail('INVALID_ROUTE', 400, 'Thiếu mã tuyến xe buýt.')
        if (!Number.isFinite(score) || !Number.isFinite(total) || total < 3 || score < 3) {
          throw fail('SCORE_TOO_LOW', 400, 'Bạn cần trả lời đúng ít nhất 3/5 câu để nhận thưởng minigame trên xe.')
        }
        const dateKey = getVietnamDateKey(now)
        const source = `bus-minigame:${cleanRoute}:${dateKey}`
        const state = await read(owner)

        if (state.claims.some(c => c.source === source)) {
          throw fail('MINIGAME_ALREADY_CLAIMED', 409, `Bạn đã nhận thưởng minigame trên tuyến ${cleanRoute} hôm nay rồi.`)
        }

        const record = {
          stationId: `minigame-${cleanRoute.toLowerCase()}`,
          routeCode: cleanRoute,
          score: Math.round(score),
          total: Math.round(total),
          amount: BUS_MINIGAME_REWARD_COINS,
          claimedAt: now,
          dateKey,
          source,
        }
        state.claims.push(record)
        await save(owner, state)
        return record
      }),

    remove: owner =>
      serial(async () => {
        await unlink(filename(owner)).catch(cause => {
          if (cause.code !== 'ENOENT') throw cause
        })
      }),
  }
}
