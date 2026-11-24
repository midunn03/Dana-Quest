import { mkdir, readFile, writeFile, rename, unlink } from './db-storage.mjs'
import { join } from 'node:path'

export const DAILY_GREEN_MOBILITY_CAP = 25 // tối đa 25 xu xanh mỗi ngày từ di chuyển thực tế

function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const dPhi = ((lat2 - lat1) * Math.PI) / 180
  const dLambda = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getVietnamDateKey(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp))
}

export function evaluateGpsTrack(points, { isSimulated = false } = {}) {
  if (isSimulated) {
    return { valid: false, reason: 'SIMULATION_BLOCKED', totalMeters: 0, modes: { walk: 0, bike: 0, transit: 0 } }
  }

  if (!Array.isArray(points) || points.length < 2) {
    return { valid: true, totalMeters: 0, modes: { walk: 0, bike: 0, transit: 0 } }
  }

  // 1. Lọc điểm kém chính xác (accuracy > 40m)
  const filtered = points.filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 && Number.isFinite(p.timestamp) && (p.accuracy == null || (Number.isFinite(p.accuracy) && p.accuracy > 0 && p.accuracy <= 40)))

  let totalMeters = 0
  let walkMeters = 0
  let bikeMeters = 0
  let transitMeters = 0

  for (let i = 1; i < filtered.length; i++) {
    const p1 = filtered[i - 1]
    const p2 = filtered[i]
    const dist = calculateHaversine(p1.lat, p1.lng, p2.lat, p2.lng)
    const timeDeltaSec = (p2.timestamp - p1.timestamp) / 1000

    // Bỏ qua điểm đứng yên hoặc trùng
    if (dist < 5) continue

    // Loại điểm nhảy bất thường (tốc độ > 120 km/h = 33.3 m/s)
    if (timeDeltaSec > 0) {
      const speedKmh = (dist / timeDeltaSec) * 3.6
      if (speedKmh > 120) continue

      totalMeters += dist
      if (speedKmh <= 6.5) {
        walkMeters += dist
      } else if (speedKmh <= 25.0) {
        bikeMeters += dist
      } else {
        transitMeters += dist
      }
    }
  }

  return {
    valid: true,
    totalMeters: Math.round(totalMeters),
    modes: {
      walk: Math.round(walkMeters),
      bike: Math.round(bikeMeters),
      transit: Math.round(transitMeters),
    },
  }
}

export function createGreenMobilityStore(directory, { dailyCap = DAILY_GREEN_MOBILITY_CAP } = {}) {
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
      dailyStats: {},
      claims: [],
      sessions: [],
    }
  }

  async function save(owner, state) {
    await mkdir(directory, { recursive: true })
    const tmp = `${filename(owner)}.tmp`
    await writeFile(tmp, JSON.stringify(state, null, 2), { mode: 0o600 })
    await rename(tmp, filename(owner))
  }

  return {
    read: (owner) =>
      serial(async () => {
        const state = await load(owner)
        const today = getVietnamDateKey()
        const todayEarned = state.dailyStats[today]?.earnedCoins ?? 0
        return {
          owner,
          today,
          dailyCap,
          todayEarned,
          remainingCap: Math.max(0, dailyCap - todayEarned),
          claims: state.claims,
          sessions: state.sessions.slice(-10),
        }
      }),

    recordTrackSession: (owner, sessionData) =>
      serial(async () => {
        const { points, isSimulated, destinationIds = [] } = sessionData ?? {}
        const evaluation = evaluateGpsTrack(points, { isSimulated })

        if (!evaluation.valid) {
          throw Object.assign(new Error('Khong the ghi nhan quang duong khi dang mo phong GPS.'), { status: 400, code: 'SIMULATION_BLOCKED' })
        }

        const state = await load(owner)
        // GPS timestamps identify already submitted portions, including retries
        // after a reload. Keep the watermark independently of the capped history.
        const recordedThrough = Math.max(state.recordedThrough ?? -Infinity, ...state.sessions.map(session => session.recordedThrough ?? -Infinity))
        const freshPoints = Array.isArray(points) ? points.filter(point => point && Number.isFinite(point.timestamp) && point.timestamp > recordedThrough) : []
        // Retain the shared boundary point so a growing track does not lose
        // the first new segment after the previous submission.
        const anchor = Array.isArray(points) ? points.findLast(point => point && point.timestamp === recordedThrough) : undefined
        if (anchor) freshPoints.unshift(anchor)
        Object.assign(evaluation, evaluateGpsTrack(freshPoints, { isSimulated }))
        const today = getVietnamDateKey()
        const todayStats = state.dailyStats[today] || { earnedCoins: 0, totalMeters: 0 }

        // Tính xu: Đi bộ 5 xu/km, Xe đạp 3 xu/km, Xe buýt 2 xu/km
        const walkCoins = Math.floor((evaluation.modes.walk / 1000) * 5)
        const bikeCoins = Math.floor((evaluation.modes.bike / 1000) * 3)
        const transitCoins = Math.floor((evaluation.modes.transit / 1000) * 2)
        const rawCoins = walkCoins + bikeCoins + transitCoins

        const awardableCoins = Math.min(rawCoins, Math.max(0, dailyCap - todayStats.earnedCoins))
        const now = Date.now()

        todayStats.totalMeters += evaluation.totalMeters
        state.dailyStats[today] = todayStats
        if (awardableCoins > 0) {
          todayStats.earnedCoins += awardableCoins

          const claimSource = `green-mobility:${today}:${state.claims.length + 1}`
          state.claims.push({
            source: claimSource,
            dateKey: today,
            amount: awardableCoins,
            meters: evaluation.totalMeters,
            claimedAt: now,
          })
        }

        const sessionRecord = {
          id: `session-${now}`,
          dateKey: today,
          timestamp: now,
          totalMeters: evaluation.totalMeters,
          modes: evaluation.modes,
          coinsAwarded: awardableCoins,
          destinationIds,
          pointCount: points?.length ?? 0,
          recordedThrough: Math.max(recordedThrough, ...freshPoints.map(point => point.timestamp)),
        }

        if (Number.isFinite(sessionRecord.recordedThrough)) state.recordedThrough = sessionRecord.recordedThrough

        state.sessions.push(sessionRecord)
        if (state.sessions.length > 50) state.sessions = state.sessions.slice(-50)

        await save(owner, state)

        return {
          success: true,
          session: sessionRecord,
          evaluation,
          coinsAwarded: awardableCoins,
          todayTotalEarned: todayStats.earnedCoins,
          claims: state.claims,
        }
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
