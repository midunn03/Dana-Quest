import { authApiBase } from './auth'
import { readState, type ProgressAction, type ProgressState } from './progress'
import { notify } from './notifications'
import { isDestinationComplete } from './rules'
import type { LocalPhoto } from './photos'

let owner: string | null = null
export const setSyncAccount = (id: string | null) => { owner = id }
export const hasSyncAccount = () => owner !== null
// Ảnh trong snapshot tiến độ chỉ gồm metadata (không có dữ liệu base64);
// dữ liệu ảnh đầy đủ chỉ tải khi mở album.
export interface StoredPhotoMeta { id: string; destinationId: string; missionId?: string; createdAt?: number }
type StoredPhoto = StoredPhotoMeta & { data: string }
interface Snapshot { revision: number; state: ReturnType<typeof readState>; photos: StoredPhotoMeta[] }
interface FullSnapshot { revision: number; state: ReturnType<typeof readState>; photos: StoredPhoto[] }
async function request<T>(id: string, body?: unknown, query = ''): Promise<T> {
  if (owner !== id) throw new Error('Tài khoản đã thay đổi. Hãy tải lại trang.')
  const response = await fetch(`${authApiBase()}/game${query}`, { method: body ? 'POST' : 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Dana-User': id }, body: body ? JSON.stringify(body) : undefined })
  const data = await response.json()
  if (!response.ok) throw Object.assign(new Error(data.message ?? 'Không đồng bộ được dữ liệu. Hãy kiểm tra kết nối và thử lại.'), { status: response.status })
  if (owner !== id) throw new Error('Tài khoản đã thay đổi. Hãy tải lại trang.')
  return data as T
}
async function change(build: (value: Snapshot) => Record<string, unknown>) {
  const id = owner!
  for (let attempt = 0; attempt < 3; attempt++) {
    const previous = await request<Snapshot>(id)
    const input = build(previous)
    try { return { previous, result: await request<Snapshot>(id, { ...input, revision: previous.revision }) } }
    catch (error) { if ((error as { status?: number }).status !== 409 || attempt === 2) throw error }
  }
  throw new Error('Dữ liệu đang được thay đổi ở thiết bị khác. Hãy thử lại.')
}
export async function loadAccountProgress() { return readState((await request<Snapshot>(owner!)).state) }
// Client chỉ gửi action; máy chủ tự kiểm tra điều kiện (vị trí, ảnh, chống
// hoàn thành lặp, nhiệm vụ hợp lệ) rồi mới áp dụng và lưu.
export async function saveAccountAction(action: ProgressAction) {
  const { previous, result } = await change(() => ({ kind: 'action', action }))
  const state = readState(result.state)
  if (JSON.stringify(previous.state) !== JSON.stringify(state)) {
    if (action.type === 'assign') notify(`Đã giao ${action.count} nhiệm vụ và lưu theo tài khoản.`)
    if (action.type === 'cancel') notify('Đã hủy hành trình tại điểm đến.')
    if (action.type === 'redeem') notify('Đã đổi voucher demo thành công.')
    if (action.type === 'complete') {
      notify('Đã hoàn thành nhiệm vụ! +10 Green Coins demo.')
      if (!isDestinationComplete(previous.state.destinations[action.destinationId!]) && isDestinationComplete(state.destinations[action.destinationId!])) notify('Chúc mừng! Bạn đã hoàn thành điểm đến.')
    }
  }
  return state
}
export async function loadAccountPhotos(): Promise<LocalPhoto[]> {
  const data = await request<FullSnapshot>(owner!, undefined, '?photos=full')
  return data.photos.map(({ data, ...photo }) => ({ ...photo, blob: new Blob([Uint8Array.from(atob(data), char => char.charCodeAt(0))], { type: 'image/jpeg' }) }))
}
export async function saveAccountPhoto(photo: LocalPhoto) {
  const id = owner
  const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('Không đọc được ảnh.')); reader.readAsDataURL(photo.blob) })
  if (owner !== id) throw new Error('Tài khoản đã thay đổi. Hãy thử lại.')
  await change(() => ({ kind: 'photo', photo: { id: photo.id, destinationId: photo.destinationId, missionId: photo.missionId, data } }))
}
export async function deleteAccountPhoto(photoId: string) { await change(() => ({ kind: 'delete-photo', photoId })) }
// Đặt lại tiến độ khi dữ liệu đã lưu bị hỏng. Máy chủ giữ lại bản sao dữ liệu
// hỏng trước khi đặt lại. Không cần revision vì dữ liệu hỏng không đọc được.
export async function resetAccountProgress(): Promise<ProgressState> {
  const data = await request<Snapshot>(owner!, { kind: 'reset' })
  return readState(data.state)
}
