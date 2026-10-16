export const avatars = [
  { id: 'bien', name: 'Nhà thám hiểm biển', note: 'Mang theo sự tò mò và một chút gió biển.', color: '#2385bd', hat: '#ffc64b', skin: '#eeb990' },
  { id: 'nang', name: 'Người bạn nắng', note: 'Một nụ cười, thêm một điều mới để khám phá.', color: '#d87743', hat: '#f4d58b', skin: '#b97750' },
  { id: 'rung', name: 'Nhà thám hiểm xanh', note: 'Bước chân nhỏ, tình yêu thiên nhiên thật lớn.', color: '#458764', hat: '#82b38a', skin: '#e4a879' },
  { id: 'may', name: 'Người bạn mây', note: 'Đi chậm một chút, ngắm thành phố nhiều hơn.', color: '#8575b0', hat: '#d9c8ee', skin: '#f3c9a5' },
] as const
export type Avatar = typeof avatars[number]
const key = 'dana-quest-avatar-v1'
export function readAvatar(): Avatar | null {
  try { return avatars.find(avatar => avatar.id === localStorage.getItem(key)) ?? null } catch { return null }
}
export function saveAvatar(id: string) {
  if (!avatars.some(avatar => avatar.id === id)) throw new Error('Nhân vật không hợp lệ.')
  localStorage.setItem(key, id)
  window.dispatchEvent(new Event('dana-avatar-changed'))
}
