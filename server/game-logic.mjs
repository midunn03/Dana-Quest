// Server-side game rules for DANA QUEST.
// Mirrors the client rules in src/lib/progress.ts, src/lib/rules.ts and the
// arrival check in src/lib/location.ts. The server is authoritative: the client
// only sends an action, and the server validates every precondition (mission
// exists and was assigned, arrival GPS sample is valid, photo was uploaded,
// no double completion, mission count in range) before persisting.
// Keep the catalogs below in sync with src/data/missions.ts and
// src/data/rewards.ts when those change.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const error = (status, message) => Object.assign(new Error(message), { status })

const destinations = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'destinations.json'), 'utf8'))
const positions = new Map(destinations.map(place => [place.id, place.position]))

// Mission catalogue: id -> kind. Must match getMissions() in src/data/missions.ts.
const MISSION_KINDS = {
  arrival: 'arrival',
  'overview-photo': 'photo',
  'detail-photo': 'photo',
  read: 'self',
  observe: 'self',
  learn: 'self',
  walk: 'self',
  respect: 'self',
  green: 'self',
  remember: 'self',
}
const MISSION_IDS = Object.keys(MISSION_KINDS)

// Reward catalogue: id -> cost. Must match src/data/rewards.ts.
const REWARD_COSTS = {
  postcard: 30,
  drink: 50,
  souvenir: 80,
  'local-food': 70,
  transport: 100,
  admission: 150,
  'outdoor-activity': 140,
}
const COINS_PER_MISSION = 10

const ARRIVAL_RADIUS = 100
const MAX_ACCURACY = 50
const MAX_LOCATION_AGE = 60_000

function distanceMeters(from, to) {
  const rad = degrees => degrees * Math.PI / 180
  const deltaLat = rad(to[0] - from[0])
  const deltaLon = rad(to[1] - from[1])
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(rad(from[0])) * Math.cos(rad(to[0])) * Math.sin(deltaLon / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)))
}

function arrivalOk(sample, position) {
  if (!sample || !Array.isArray(position)) return false
  const { latitude, longitude, accuracy, timestamp } = sample
  if (![latitude, longitude, accuracy, timestamp].every(Number.isFinite)) return false
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || accuracy <= 0) return false
  const now = Date.now()
  if (now < timestamp || now - timestamp > MAX_LOCATION_AGE) return false
  if (accuracy > MAX_ACCURACY) return false
  return distanceMeters([latitude, longitude], position) + accuracy <= ARRIVAL_RADIUS
}

const earnedCoins = state => Object.values(state.destinations).reduce((total, progress) => total + progress.completed.length * COINS_PER_MISSION, 0)
const coinBalance = state => earnedCoins(state) - state.redemptions.reduce((total, item) => total + (REWARD_COSTS[item.rewardId] ?? 0), 0)
const emptyProgress = () => ({ selected: [], completed: [], started: false })

function validateStateShape(state) {
  if (state?.version !== 1 || !state.destinations || typeof state.destinations !== 'object' || !Array.isArray(state.redemptions)) throw error(400, 'Tiến độ không hợp lệ.')
}

// Applies one game action to the stored state and returns the new state.
// Throws an error with .status (400) when the action is invalid or its
// preconditions are not met. Unknown destinations, missions or rewards are
// rejected; already-applied idempotent actions return the state unchanged.
export function applyGameAction(state, action, photos = []) {
  if (!action || typeof action !== 'object' || !['assign', 'complete', 'redeem', 'cancel'].includes(action.type)) throw error(400, 'Thao tác không hợp lệ.')
  validateStateShape(state)
  if (action.type === 'redeem') {
    if (typeof action.rewardId !== 'string' || !(action.rewardId in REWARD_COSTS)) throw error(400, 'Không tìm thấy voucher mẫu.')
    if (state.redemptions.some(item => item.rewardId === action.rewardId)) throw error(400, 'Voucher này đã đổi. Mỗi mẫu chỉ đổi một lần.')
    if (coinBalance(state) < REWARD_COSTS[action.rewardId]) throw error(400, 'Chưa đủ Green Coins demo để đổi voucher này.')
    return { ...state, redemptions: [...state.redemptions, { rewardId: action.rewardId, redeemedAt: Date.now() }] }
  }
  const destinationId = action.destinationId
  if (typeof destinationId !== 'string' || !positions.has(destinationId)) throw error(400, 'Không tìm thấy địa điểm.')
  const progress = state.destinations[destinationId] ?? emptyProgress()
  if (action.type === 'cancel') {
    if (!progress.started) return state
    if (progress.completed.length) throw error(400, 'Không thể hủy hành trình đã có nhiệm vụ hoàn thành vì sẽ ảnh hưởng số xu đã nhận.')
    const destinations = { ...state.destinations }
    delete destinations[destinationId]
    return { ...state, destinations }
  }
  if (action.type === 'assign') {
    if (progress.started) return state
    if (!Number.isInteger(action.count) || action.count < 5 || action.count > 10) throw error(400, 'Hãy chọn số lượng từ 5 đến 10 nhiệm vụ.')
    const pool = [...MISSION_IDS]
    const selected = []
    while (selected.length < action.count) selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
    const next = { selected, completed: [], started: true, startedAt: Date.now(), completedAt: {} }
    return { ...state, destinations: { ...state.destinations, [destinationId]: next } }
  }
  // action.type === 'complete'
  const missionId = action.missionId
  if (typeof missionId !== 'string' || !(missionId in MISSION_KINDS)) throw error(400, 'Nhiệm vụ không tồn tại.')
  if (!progress.started || !progress.selected.includes(missionId)) throw error(400, 'Nhiệm vụ chưa được chọn hoặc chưa bắt đầu.')
  if (progress.completed.includes(missionId)) return state
  const kind = MISSION_KINDS[missionId]
  if (kind === 'arrival' && !arrivalOk(action.location, positions.get(destinationId))) throw error(400, 'Vị trí chưa đạt điều kiện hoặc đã hết hạn. Hãy kiểm tra lại.')
  if (kind === 'photo' && !photos.some(photo => photo.id === `${destinationId}:${missionId}`)) throw error(400, 'Hãy lưu ảnh cho nhiệm vụ trước khi tự xác nhận hoàn thành.')
  const next = { ...progress, completed: [...progress.completed, missionId], completedAt: { ...progress.completedAt, [missionId]: Date.now() } }
  return { ...state, destinations: { ...state.destinations, [destinationId]: next } }
}
