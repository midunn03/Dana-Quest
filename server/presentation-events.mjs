import {readFileSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
const validOwner=owner=>typeof owner==='string'&&/^[-\w]{1,80}$/.test(owner)
export function createPresentationEvent(owner,scenario,now=Date.now()){
 if(!validOwner(owner)||!['invite','reminder'].includes(scenario)||!Number.isFinite(now))throw Error('Expected an account ID and invite or reminder scenario.')
 const start=now+(scenario==='invite'?90:20)*60000
 return {owner,expiresAt:now+3*3600000,event:{id:`presentation-${randomUUID()}`,title:'Cuộc hẹn bên dòng sông Hàn',summary:'Một cuộc hẹn khám phá dành riêng cho hành trình của bạn: dừng bên bờ sông, ngắm nhịp cầu và tìm góc nhìn mới của thành phố.',location:'Khu vực đi bộ phía đông Cầu Rồng, Đà Nẵng',scheduleLabel:'Theo lịch cuộc hẹn',startAt:new Date(start).toISOString(),endAt:new Date(start+20*60000).toISOString(),destinationId:'cau-rong',sourceUrl:'#/su-kien',status:'confirmed',category:'Khám phá thành phố',area:'Sơn Trà',price:'Miễn phí',image:'cau-rong',tips:'Đứng tại lối đi bộ công cộng, tuân thủ biển báo và giữ khoảng cách an toàn với dòng xe.'}}
}
export function loadPresentationEvents(file,owner,now=Date.now(),enabled=false){
 if(!enabled||!validOwner(owner))return []
 try{
 const data=JSON.parse(readFileSync(file,'utf8'))
 if(data.version!==1||!Array.isArray(data.records))return []
 return data.records.filter(record=>record&&record.owner===owner&&Number.isFinite(record.expiresAt)&&record.expiresAt>now&&record.expiresAt<=now+3*3600000&&record.event&&/^presentation-[a-f0-9-]{36}$/.test(record.event.id)&&record.event.status==='confirmed'&&record.event.destinationId==='cau-rong'&&Number.isFinite(Date.parse(record.event.startAt))&&Date.parse(record.event.endAt)>now&&Date.parse(record.event.endAt)>Date.parse(record.event.startAt)).map(record=>record.event)
 }catch{return []}
}
