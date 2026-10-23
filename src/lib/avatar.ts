import { lookFromCode, shirtColors, skinTones, hairColors, type AvatarLook } from './pixelAvatar'

export type Avatar = { id: string; name: string; note: string; color: string; hat: string; skin: string; look?: AvatarLook }

export const avatars: Avatar[] = [
  { id: 'bien', name: 'Nhà thám hiểm biển', note: 'Mang theo sự tò mò và một chút gió biển.', color: '#2385bd', hat: '#ffc64b', skin: '#eeb990' },
  { id: 'nang', name: 'Người bạn nắng', note: 'Một nụ cười, thêm một điều mới để khám phá.', color: '#d87743', hat: '#f4d58b', skin: '#b97750' },
  { id: 'rung', name: 'Nhà thám hiểm xanh', note: 'Bước chân nhỏ, tình yêu thiên nhiên thật lớn.', color: '#458764', hat: '#82b38a', skin: '#e4a879' },
  { id: 'may', name: 'Người bạn mây', note: 'Đi chậm một chút, ngắm thành phố nhiều hơn.', color: '#8575b0', hat: '#d9c8ee', skin: '#f3c9a5' },
]
export type PresetAvatar = typeof avatars[number]
/** Nhận id nhân vật có sẵn hoặc mã tự tạo (c1.…) và trả về dữ liệu để hiển thị. */
export function resolveAvatar(id: string | null | undefined): Avatar | null {
  if (!id) return null
  const preset = avatars.find(item => item.id === id)
  if (preset) return preset
  const look = lookFromCode(id)
  if (!look) return null
  return { id, name: 'Nhân vật của bạn', note: 'Do chính bạn tạo nên.', color: shirtColors[look.shirt].color, hat: hairColors[look.hairColor].color, skin: skinTones[look.skin].color, look }
}
export const isValidAvatarId = (id: string) => resolveAvatar(id) !== null
const key = 'dana-quest-avatar-v1'
export function readAvatar(): Avatar | null {
  try { return resolveAvatar(localStorage.getItem(key)) } catch { return null }
}
export function saveAvatar(id: string) {
  if (!isValidAvatarId(id)) throw new Error('Nhân vật không hợp lệ.')
  localStorage.setItem(key, id)
  window.dispatchEvent(new Event('dana-avatar-changed'))
}
