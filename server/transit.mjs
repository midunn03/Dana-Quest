import { mkdir, readFile, writeFile, rename, unlink } from './db-storage.mjs'
import { join } from 'node:path'

export const DAILY_TRANSIT_CAP = 20
export const MAX_TRANSIT_DISTANCE_METERS = 80
export const MAX_GPS_ACCURACY_METERS = 50
export const MIN_DWELL_SECONDS = 60

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

        // Trần xu di chuyển xanh mỗi ngày
        const todayCoins = state.claims
          .filter(c => c.dateKey === dateKey)
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

    remove: owner =>
      serial(async () => {
        await unlink(filename(owner)).catch(cause => {
          if (cause.code !== 'ENOENT') throw cause
        })
      }),
  }
}
