import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'

export const DEFAULT_GOLDEN_HOURS = [
  {
    id: 'cau-rong-fire',
    destinationId: 'cau-rong',
    title: 'Cầu Rồng Phun Lửa & Phun Nước',
    description: 'Màn trình diễn phun lửa và nước huyền thoại tại biểu tượng Đà Nẵng.',
    daysOfWeek: [4, 5, 6], // T6, T7, CN
    startTime: '20:30',
    endTime: '21:30',
    bonusCoins: 20,
    multiplier: 2.0,
    latitude: 16.061,
    longitude: 108.227,
    radiusMeters: 150,
  },
  {
    id: 'son-tra-sunrise',
    destinationId: 'son-tra',
    title: 'Bình Minh Sơn Trà & Đón Ban Mai',
    description: 'Đón ánh mặt trời đầu ngày trên đỉnh bán đảo Sơn Trà.',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Hàng ngày
    startTime: '05:00',
    endTime: '06:30',
    bonusCoins: 25,
    multiplier: 1.5,
    latitude: 16.103,
    longitude: 108.277,
    radiusMeters: 300,
  },
]

function getVietnamTimeParts(timestamp = Date.now()) {
  const d = new Date(timestamp)
  // Format as YYYY-MM-DD
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)

  // Get HH:mm
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)

  // Get day of week (0 = Monday, ... 6 = Sunday)
  const weekdayStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
  }).format(d)

  const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
  const dayOfWeek = dayMap[weekdayStr] ?? 0

  return { dateKey, timeStr, dayOfWeek }
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const dPhi = ((lat2 - lat1) * Math.PI) / 180
  const dLambda = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function createGoldenHourStore(directory, { challenges = DEFAULT_GOLDEN_HOURS } = {}) {
  let queue = Promise.resolve()
  const filename = (owner) => join(directory, `${owner}.json`)
  const serial = (action) => {
    const task = queue.then(action)
    queue = task.catch(() => {})
    return task
  }

  async function load(owner) {
    try {
      const data = JSON.parse(await readFile(filename(owner), 'utf8'))
      if (data && data.version === 1 && data.owner === owner) {
        return data
      }
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
    return {
      version: 1,
      owner,
      claims: [],
    }
  }

  async function save(owner, state) {
    await mkdir(directory, { recursive: true })
    const tmp = `${filename(owner)}.tmp`
    await writeFile(tmp, JSON.stringify(state, null, 2), { mode: 0o600 })
    await rename(tmp, filename(owner))
  }

  return {
    read: (owner, timestamp = Date.now()) =>
      serial(async () => {
        const state = await load(owner)
        const { dateKey, timeStr, dayOfWeek } = getVietnamTimeParts(timestamp)
        const currentMins = timeToMinutes(timeStr)

        const items = challenges.map((ch) => {
          const startMins = timeToMinutes(ch.startTime)
          const endMins = timeToMinutes(ch.endTime)
          const isTodayValid = ch.daysOfWeek.includes(dayOfWeek)
          const isActive = isTodayValid && currentMins >= startMins && currentMins <= endMins
          const isUpcoming = isTodayValid && currentMins >= startMins - 60 && currentMins < startMins
          const minutesUntil = isUpcoming ? startMins - currentMins : null
          const claimSource = `golden-hour:${ch.id}:${dateKey}`
          const claimedToday = state.claims.some((c) => c.source === claimSource)

          return {
            ...ch,
            isActive,
            isUpcoming,
            minutesUntil,
            claimedToday,
          }
        })

        return {
          owner,
          serverDateKey: dateKey,
          serverTime: timeStr,
          challenges: items,
          claims: state.claims,
        }
      }),

    claim: (owner, input, timestamp = Date.now()) =>
      serial(async () => {
        const { challengeId, latitude, longitude, accuracy, isSimulated } = input ?? {}

        if (isSimulated) {
          throw Object.assign(new Error('Khong the nhan thuong gio vang khi dang mo phong GPS.'), { status: 400, code: 'SIMULATION_BLOCKED' })
        }
        if (!Number.isFinite(accuracy) || accuracy <= 0 || accuracy > 50) {
          throw Object.assign(new Error('Do chinh xac GPS phai <= 50m.'), { status: 400, code: 'ACCURACY_INSUFFICIENT' })
        }
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
          throw Object.assign(new Error('Toa do GPS khong hop le.'), { status: 400, code: 'INVALID_COORDINATES' })
        }

        const challenge = challenges.find((c) => c.id === challengeId || c.destinationId === challengeId)
        if (!challenge) {
          throw Object.assign(new Error('Khong tim thay thu thach gio vang.'), { status: 404, code: 'CHALLENGE_NOT_FOUND' })
        }

        const { dateKey, timeStr, dayOfWeek } = getVietnamTimeParts(timestamp)
        const currentMins = timeToMinutes(timeStr)
        const startMins = timeToMinutes(challenge.startTime)
        const endMins = timeToMinutes(challenge.endTime)

        if (!challenge.daysOfWeek.includes(dayOfWeek) || currentMins < startMins || currentMins > endMins) {
          throw Object.assign(new Error('Hien tai chua den hoac da qua khung gio vang cua dia diem nay.'), { status: 400, code: 'NOT_IN_GOLDEN_HOUR' })
        }

        const dist = calculateDistance(latitude, longitude, challenge.latitude, challenge.longitude)
        if (dist > challenge.radiusMeters) {
          throw Object.assign(new Error(`Ban dang o cach dia diem ${Math.round(dist)}m (yeu cau <= ${challenge.radiusMeters}m).`), { status: 400, code: 'OUT_OF_RANGE' })
        }

        const state = await load(owner)
        const claimSource = `golden-hour:${challenge.id}:${dateKey}`
        if (state.claims.some((c) => c.source === claimSource)) {
          throw Object.assign(new Error('Ban da nhan thuong gio vang nay trong hom nay roi.'), { status: 409, code: 'ALREADY_CLAIMED' })
        }

        const claim = {
          source: claimSource,
          challengeId: challenge.id,
          destinationId: challenge.destinationId,
          amount: challenge.bonusCoins,
          multiplier: challenge.multiplier,
          claimedAt: timestamp,
        }

        state.claims.push(claim)
        await save(owner, state)

        return claim
      }),

    remove: (owner) =>
      serial(async () => {
        for (const suffix of ['', '.tmp']) {
          await unlink(`${filename(owner)}${suffix}`).catch((err) => {
            if (err.code !== 'ENOENT') throw err
          })
        }
      }),
  }
}
