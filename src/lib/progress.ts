import { getDestination } from '../data/destinations'
import { getMissions } from '../data/missions'
import { emptyProgress, type DestinationProgress } from './rules'
import { hasArrived, type LocationSample } from './location'
import { COINS_PER_MISSION, rewards } from '../data/rewards'

export interface Redemption { rewardId: string; redeemedAt: number }
export interface ProgressState { version: 1; destinations: Record<string, DestinationProgress>; redemptions: Redemption[] }
export const newState = (): ProgressState => ({ version: 1, destinations: {}, redemptions: [] })
// Lỗi dữ liệu lưu bị hỏng (khác với lỗi mạng/tạm thời): giao diện có thể đề
// nghị người dùng đặt lại tiến độ, kèm bản sao dữ liệu hỏng để khôi phục.
export class CorruptStateError extends Error { readonly corrupt = true }
export const isCorruptStateError = (error: unknown) =>
  error instanceof CorruptStateError || (error instanceof Error && (error as { status?: number }).status === 422)
export type ProgressAction = { type: 'assign' | 'complete' | 'redeem' | 'cancel'; count?: number; destinationId?: string; missionId?: string; location?: LocationSample; rewardId?: string }
export const earnedCoins = (state: ProgressState) => Object.values(state.destinations).reduce((total, progress) => total + progress.completed.length * COINS_PER_MISSION, 0)
export const coinBalance = (state: ProgressState) => earnedCoins(state) - state.redemptions.reduce((total, item) => total + (rewards.find(reward => reward.id === item.rewardId)?.cost ?? 0), 0)

export function readState(value: unknown): ProgressState {
  if (value === undefined) return newState()
  const state = value as ProgressState
  if (state?.version !== 1 || !state.destinations || typeof state.destinations !== 'object') throw new CorruptStateError('Dữ liệu lưu không hợp lệ. Chưa ghi đè dữ liệu cũ.')
  for (const [id, progress] of Object.entries(state.destinations)) {
    const place = getDestination(id)
    const ids = place ? getMissions(place).map(item => item.id) : []
    const completedAt = progress?.completedAt
    const invalidCompletedAt = completedAt !== undefined && (completedAt === null || typeof completedAt !== 'object' || Array.isArray(completedAt) || Object.entries(completedAt).some(([missionId, timestamp]) => !progress.completed.includes(missionId) || !Number.isFinite(timestamp)))
    if (!progress || typeof progress.started !== 'boolean' || !Array.isArray(progress.selected) || !Array.isArray(progress.completed) ||
      new Set(progress.selected).size !== progress.selected.length || new Set(progress.completed).size !== progress.completed.length ||
      progress.selected.some(item => !ids.includes(item)) || progress.completed.some(item => !progress.selected.includes(item)) ||
      (progress.started && (progress.selected.length < 5 || progress.selected.length > 10)) || (!progress.started && progress.completed.length > 0) ||
      (progress.startedAt !== undefined && (!progress.started || !Number.isFinite(progress.startedAt))) || invalidCompletedAt) {
      throw new CorruptStateError('Tiến độ lưu không hợp lệ. Chưa ghi đè dữ liệu cũ.')
    }
  }
  const normalized = { ...state, redemptions: state.redemptions ?? [] }
  if (!Array.isArray(normalized.redemptions) || normalized.redemptions.some(item => !item || !rewards.some(reward => reward.id === item.rewardId) || !Number.isFinite(item.redeemedAt)) || new Set(normalized.redemptions.map(item => item.rewardId)).size !== normalized.redemptions.length || coinBalance(normalized) < 0) throw new CorruptStateError('Dữ liệu xu hoặc voucher không hợp lệ. Chưa ghi đè dữ liệu cũ.')
  return normalized
}

export function updateProgress(state: ProgressState, action: ProgressAction, photoAvailable = false): ProgressState {
  if (action.type === 'redeem') {
    const reward = rewards.find(item => item.id === action.rewardId)
    if (!reward) throw new Error('Không tìm thấy voucher mẫu.')
    if (state.redemptions.some(item => item.rewardId === reward.id)) throw new Error('Voucher này đã đổi. Mỗi mẫu chỉ đổi một lần.')
    if (coinBalance(state) < reward.cost) throw new Error('Chưa đủ Green Coins demo để đổi voucher này.')
    return { ...state, redemptions: [...state.redemptions, { rewardId: reward.id, redeemedAt: Date.now() }] }
  }
  const place = getDestination(action.destinationId ?? '')
  if (!place) throw new Error('Không tìm thấy địa điểm.')
  const progress = state.destinations[place.id] ?? emptyProgress()
  if (action.type === 'cancel') {
    if (!progress.started) return state
    if (progress.completed.length) throw new Error('Không thể hủy hành trình đã có nhiệm vụ hoàn thành vì sẽ ảnh hưởng số xu đã nhận.')
    const destinations = { ...state.destinations }
    delete destinations[place.id]
    return { ...state, destinations }
  }
  const mission = getMissions(place).find(item => item.id === action.missionId)
  let next = progress
  if (action.type === 'assign') {
    if (progress.started) return state
    if (!Number.isInteger(action.count) || action.count! < 5 || action.count! > 10) throw new Error('Hãy chọn số lượng từ 5 đến 10 nhiệm vụ.')
    const pool = getMissions(place).map(item => item.id)
    const selected: string[] = []
    while (selected.length < action.count!) selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
    next = { selected, completed: [], started: true, startedAt: Date.now(), completedAt: {} }
  } else {
    if (!progress.started || !mission || !progress.selected.includes(mission.id)) throw new Error('Nhiệm vụ chưa được chọn hoặc chưa bắt đầu.')
    if (progress.completed.includes(mission.id)) return state
    if (mission.kind === 'arrival' && (!action.location || !hasArrived(action.location, place.position))) throw new Error('Vị trí chưa đạt điều kiện hoặc đã hết hạn. Hãy kiểm tra lại.')
    if (mission.kind === 'photo' && !photoAvailable) throw new Error('Hãy lưu ảnh cho nhiệm vụ trước khi tự xác nhận hoàn thành.')
    next = { ...progress, completed: [...progress.completed, mission.id], completedAt: { ...progress.completedAt, [mission.id]: Date.now() } }
  }
  return { ...state, destinations: { ...state.destinations, [place.id]: next } }
}
