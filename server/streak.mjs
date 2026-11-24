import { mkdir, readFile, writeFile, rename, unlink } from './db-storage.mjs'
import { join } from 'node:path'

export const DEFAULT_STREAK_MILESTONES = [
  { days: 3, bonusCoins: 15, bonusXp: 20, message: 'Khởi đầu kiên trì: 3 ngày khám phá liên tiếp!' },
  { days: 7, bonusCoins: 35, bonusXp: 50, message: 'Trọn một tuần gắn bó: 7 ngày kiên cường!' },
  { days: 14, bonusCoins: 80, bonusXp: 100, message: 'Nhà thám hiểm bản lĩnh: 14 ngày đồng hành!' },
  { days: 30, bonusCoins: 200, bonusXp: 250, message: 'Huyền thoại kiên định: 30 ngày chinh phục Đà Nẵng!' },
]

/**
 * Returns date in YYYY-MM-DD format in Asia/Ho_Chi_Minh timezone.
 */
export function getVietnamDateKey(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp))
}

/**
 * Given a YYYY-MM-DD string, returns the previous day in YYYY-MM-DD.
 */
export function getPreviousDayKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const prev = new Date(Date.UTC(y, m - 1, d - 1))
  return prev.toISOString().slice(0, 10)
}

export function createStreakStore(directory) {
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
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      streakCycle: 1,
      claimedMilestones: [],
      claims: [],
      history: [],
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
        const yesterday = getPreviousDayKey(today)
        // If last active was before yesterday, the active streak has lapsed to 0 for display
        const isLapsed = state.lastActiveDate && state.lastActiveDate !== today && state.lastActiveDate !== yesterday
        const activeStreak = isLapsed ? 0 : state.currentStreak
        const todayActive = state.lastActiveDate === today
        return {
          owner,
          currentStreak: activeStreak,
          longestStreak: state.longestStreak,
          lastActiveDate: state.lastActiveDate,
          todayActive,
          claimedMilestones: isLapsed ? [] : state.claimedMilestones,
          claims: state.claims,
          milestones: DEFAULT_STREAK_MILESTONES,
        }
      }),

    recordActivity: (owner, timestamp = Date.now(), milestones = DEFAULT_STREAK_MILESTONES) =>
      serial(async () => {
        const state = await load(owner)
        const today = getVietnamDateKey(timestamp)
        const yesterday = getPreviousDayKey(today)
        const newlyClaimed = []

        if (state.lastActiveDate === today) {
          // Already recorded for today
          return {
            owner,
            currentStreak: state.currentStreak,
            longestStreak: state.longestStreak,
            lastActiveDate: state.lastActiveDate,
            todayActive: true,
            newlyClaimed: [],
            claims: state.claims,
          }
        } else if (state.lastActiveDate === yesterday) {
          // Consecutive day continuation
          state.currentStreak += 1
          if (state.currentStreak > state.longestStreak) {
            state.longestStreak = state.currentStreak
          }
          state.lastActiveDate = today
        } else {
          // Lapsed or brand new streak
          if (state.lastActiveDate !== null) {
            state.streakCycle = (state.streakCycle || 1) + 1
          }
          state.currentStreak = 1
          if (state.longestStreak < 1) {
            state.longestStreak = 1
          }
          state.claimedMilestones = []
          state.lastActiveDate = today
        }

        if (!state.history.includes(today)) {
          state.history.push(today)
          if (state.history.length > 365) {
            state.history = state.history.slice(-365)
          }
        }

        // Check milestones
        for (const milestone of milestones) {
          if (state.currentStreak >= milestone.days && !state.claimedMilestones.includes(milestone.days)) {
            state.claimedMilestones.push(milestone.days)
            const claimSource = `streak:${milestone.days}:cycle-${state.streakCycle}`
            const claim = {
              source: claimSource,
              milestone: milestone.days,
              amount: milestone.bonusCoins,
              xp: milestone.bonusXp,
              claimedAt: timestamp,
            }
            state.claims.push(claim)
            newlyClaimed.push({
              days: milestone.days,
              bonusCoins: milestone.bonusCoins,
              bonusXp: milestone.bonusXp,
              message: milestone.message,
            })
          }
        }

        await save(owner, state)

        return {
          owner,
          currentStreak: state.currentStreak,
          longestStreak: state.longestStreak,
          lastActiveDate: state.lastActiveDate,
          todayActive: true,
          newlyClaimed,
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
