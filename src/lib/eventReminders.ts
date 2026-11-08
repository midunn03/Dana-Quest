import { t } from '../i18n/locale'
const ENABLED_KEY='dana-event-reminders-v1'
export const remindersEnabled=()=>{try{return localStorage.getItem(ENABLED_KEY)==='enabled'}catch{return false}}
// One server-claimed scheduler now owns all reminder timing, including device notices.
export function scheduleEventReminders(){window.dispatchEvent(new Event('dana-event-preferences'))}
export async function showEventReminder(eventId:string,title:string,body:string){
 if(!remindersEnabled()||!('Notification' in window)||Notification.permission!=='granted')return
 try{
 const registration=await navigator.serviceWorker?.getRegistration()
 if(registration)return await registration.showNotification(title,{body,icon:`${import.meta.env.BASE_URL}brand/icon-192.png`,data:{url:`#/su-kien/${eventId}`},tag:`dana-event-${eventId}`})
 new Notification(title,{body,icon:`${import.meta.env.BASE_URL}brand/icon-192.png`,tag:`dana-event-${eventId}`})
 }catch{/* The in-app card remains available when device notifications are unsupported. */}
}
export async function enableEventReminders(){
 if(!('Notification' in window))throw Error(t("Trình duyệt này chưa hỗ trợ thông báo hệ thống."))
 if(await Notification.requestPermission()!=='granted')throw Error(t("Bạn chưa cho phép DANA QUEST gửi thông báo."))
 localStorage.setItem(ENABLED_KEY,'enabled');scheduleEventReminders()
}
export function disableEventReminders(){localStorage.removeItem(ENABLED_KEY);scheduleEventReminders()}
