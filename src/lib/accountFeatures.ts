import { t } from '../i18n/locale'
import { authApiBase } from './auth'
import { setInAppNotifications } from './notifications'
import type { EventDecision } from '../../shared/event-policy.mjs'
export interface AccountFeatures {
 version:1
 profile:{displayName:string;bio:string;home:string;photoData:string}
 preferences:{language:'vi'|'en'|'system';leaderboard:boolean;marketing:boolean;inApp:boolean}
 messages:Array<{id:string;category:string;subject:string;message:string;createdAt:number;status:string}>
 events?:{decisions:Record<string,EventDecision>;lastShown:number}
 eventResult?:{notice:'invite'|'reminder'|null;key:string;serverNow:number}
}
export interface LeaderboardEntry {id:string;displayName:string;avatarId:string|null;xp:number;city:string;rank:number}
export const emptyAccountFeatures=():AccountFeatures=>({version:1,profile:{displayName:'',bio:'',home:'',photoData:''},preferences:{language:'vi',leaderboard:false,marketing:false,inApp:true},messages:[]})
export async function accountRequest<T>(owner:string,path:string,body?:unknown):Promise<T>{
 const response=await fetch(`${authApiBase()}${path}`,{method:body?'POST':'GET',credentials:'include',headers:{'Content-Type':'application/json','X-Dana-User':owner},body:body?JSON.stringify(body):undefined})
 const data=await response.json().catch(()=>null)
 if(!response.ok)throw new Error(data?.message||t("Chưa kết nối được dịch vụ tài khoản. Hãy thử lại."))
 return data
}
export async function loadAccountFeatures(owner:string,body?:unknown){
 const data=await accountRequest<AccountFeatures>(owner,'/account',body)
 if(data?.version!==1||!data.profile||!data.preferences||!Array.isArray(data.messages))throw new Error(t("Dịch vụ hồ sơ mở rộng chưa sẵn sàng. Các dữ liệu cũ vẫn được giữ."))
 setInAppNotifications(owner,data.preferences.inApp)
 return data
}
export async function loadLeaderboard():Promise<LeaderboardEntry[]>{
 const response=await fetch(`${authApiBase()}/leaderboard`,{credentials:'include'})
 const data=await response.json()
 if(!response.ok||!Array.isArray(data.items))throw new Error(t("Chưa tải được bảng xếp hạng."))
 return data.items
}
export async function clearQuestCache(){
 if(!('caches' in window))return 0
 const keys=(await caches.keys()).filter(key=>key.startsWith('dana-quest-shell-'))
 await Promise.all(keys.map(key=>caches.delete(key)));return keys.length
}
export async function copyAccountText(value:string){
 try { if(!navigator.clipboard?.writeText)return false;await navigator.clipboard.writeText(value);return true } catch { return false }
}
