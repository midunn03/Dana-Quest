import { t } from '../i18n/locale'
export type TravelPlan = 'visiting' | 'planning' | 'home'
export function readTravelPlan(): TravelPlan | null {
  try { const value=localStorage.getItem('dana-travel-plan-v1'); return value==='visiting'||value==='planning'||value==='home' ? value : null } catch { return null }
}
export function saveTravelPlan(plan: TravelPlan | null) {
  try { if(plan) localStorage.setItem('dana-travel-plan-v1',plan); else localStorage.removeItem('dana-travel-plan-v1') }
  catch { throw new Error(t("Chưa lưu được lựa chọn trên thiết bị. Bạn vẫn có thể bấm Bỏ qua để tiếp tục.")) }
}
export function rememberCodeReturn(target:'code'|'quests'='code') { try { sessionStorage.setItem('dana-auth-return',target) } catch { /* Login still works without session storage. */ } }
export function takeCodeReturn() {
  try { const value=sessionStorage.getItem('dana-auth-return');sessionStorage.removeItem('dana-auth-return');return value==='code' ? '#/nhap-ma' : value==='quests' ? '#/quest-cua-toi' : null } catch { return null }
}
export function rememberPageReturn(route:string){try{route=route.split('?')[0];if(/^#\/(nha-sang-tao\/[\w-]+|dia-diem\/[\w-]+|quest-cua-toi|quest\/[\w-]+|su-kien(?:\/[\w-]+)?)$/.test(route))sessionStorage.setItem('dana-context-auth-return',route)}catch{/* Character setup remains usable without session storage. */}}
export function takePageReturn(){try{const route=sessionStorage.getItem('dana-context-auth-return');sessionStorage.removeItem('dana-context-auth-return');return route&&/^#\/(nha-sang-tao\/[\w-]+|dia-diem\/[\w-]+|quest-cua-toi|quest\/[\w-]+|su-kien(?:\/[\w-]+)?)$/.test(route)?route:null}catch{return null}}
