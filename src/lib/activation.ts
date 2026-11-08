import { t } from '../i18n/locale'
import { authApiBase } from './auth'
import { getSyncAccountId } from './accountSync'
export interface ActivatedQuest {questId:string;redeemedAt:number}
export async function loadActivatedQuests(): Promise<ActivatedQuest[]> {
  const owner=getSyncAccountId()
  const response=await fetch(`${authApiBase()}/quest-codes`,{credentials:'include',headers:owner?{'X-Dana-User':owner}:{}})
  const data=await response.json()
  if(owner!==getSyncAccountId())throw new Error(t("Tài khoản đã thay đổi. Hãy tải lại trang."))
  if(!response.ok) throw new Error(data.message||t("Chưa đọc được quest đã kích hoạt."))
  if(!Array.isArray(data.items)) throw new Error(t("Phản hồi danh sách quest đã kích hoạt không hợp lệ."))
  return data.items
}
export async function redeemQuestCode(code:string): Promise<ActivatedQuest> {
  const owner=getSyncAccountId()
  const csrf=decodeURIComponent(document.cookie.split('; ').find(row=>row.startsWith('csrftoken='))?.slice(10)??'')
  const response=await fetch(`${authApiBase()}/quest-codes/redeem`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','X-CSRFToken':csrf,...(owner?{'X-Dana-User':owner}:{})},body:JSON.stringify({code})})
  const data=await response.json()
  if(owner!==getSyncAccountId())throw new Error(t("Tài khoản đã thay đổi. Hãy tải lại trang."))
  if(!response.ok) throw new Error(data.message||t("Chưa kích hoạt được mã. Hãy thử lại."))
  return data
}
