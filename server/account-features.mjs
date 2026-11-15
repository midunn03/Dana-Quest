import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { occurrenceFor, dueNotice, decideEvent, claimNotice } from '../shared/event-policy.mjs'
const catalog=JSON.parse(readFileSync(new URL('../shared/city-events.json',import.meta.url),'utf8'))
const fail=(status,message)=>Object.assign(new Error(message),{status})
const fresh=()=>({version:1,profile:{displayName:'',bio:'',home:'',photoData:''},preferences:{language:'vi',leaderboard:false,marketing:false,inApp:true},messages:[]})
function text(value,max,label){if(typeof value!=='string'||value.length>max)throw fail(400,`${label} không hợp lệ (tối đa ${max} ký tự).`);return value.trim()}
export function createAccountFeatures(directory,clock=Date.now,catalogFor=()=>catalog,canClaim=async()=>true){
 let queue=Promise.resolve()
 const filename=id=>{if(typeof id!=='string'||!/^[-\w]{1,80}$/.test(id))throw fail(400,'Tài khoản không hợp lệ.');return join(directory,`${id}.json`)}
 async function read(id){
  try{const value=JSON.parse(await readFile(filename(id),'utf8'));if(value.version!==1||!value.profile||!value.preferences||!Array.isArray(value.messages))throw Error();return value}
  catch(error){if(error.code==='ENOENT')return fresh();throw fail(422,'Chưa đọc được hồ sơ mở rộng. Dữ liệu cũ được giữ nguyên.')}
 }
 function enqueue(action){const task=queue.then(action);queue=task.catch(()=>{});return task}
 return {read,remove:id=>enqueue(async()=>{await unlink(filename(id)).catch(error=>{if(error.code!=='ENOENT')throw error})}),update:(id,input)=>enqueue(async()=>{
  const value=await read(id)
  let eventResult
  if(input.kind==='event'){
   const now=clock(),event=catalogFor(id,now).find(item=>item.id===input.eventId)
   if(!event)throw fail(404,'Không tìm thấy sự kiện.')
   const occurrence=occurrenceFor(event,now)
   if(!occurrence||occurrence.key!==input.key)throw fail(409,'Lịch sự kiện đã thay đổi hoặc đã kết thúc. Hãy tải lại.')
   if(!['claim','attend','later','remove'].includes(input.action))throw fail(400,'Lựa chọn sự kiện không hợp lệ.')
   const events=value.events??={decisions:{},lastShown:0}
   const state=events.decisions[occurrence.key]||{}
   if(input.action==='claim'){
    const notice=await canClaim(id)&&event.status==='confirmed'&&!event.allDay&&value.preferences.inApp&&now-(events.lastShown||0)>=300000?dueNotice(state,occurrence.start,now):null
    eventResult={notice,key:occurrence.key,serverNow:now}
    if(!notice)return {...value,eventResult}
    events.decisions[occurrence.key]=claimNotice(state,notice,now);events.lastShown=now
   }else events.decisions[occurrence.key]=decideEvent(state,input.action,now)
   // Keep recent occurrence decisions; never prune an active occurrence.
   events.decisions=Object.fromEntries(Object.entries(events.decisions).filter(([key])=>Number(key.slice(key.lastIndexOf(':')+1))>now-90*86400000).slice(-500))
  }else if(input.kind==='profile'){
   for(const [key,max] of [['displayName',80],['bio',280],['home',80]])if(input[key]!==undefined)value.profile[key]=text(input[key],max,key)
   if(input.photoData!==undefined){
    if(typeof input.photoData!=='string'||input.photoData.length>1_400_000)throw fail(400,'Ảnh hồ sơ tối đa 1 MB.')
    if(input.photoData){if(!/^[A-Za-z0-9+/]+={0,2}$/.test(input.photoData))throw fail(400,'Ảnh hồ sơ không hợp lệ.');const bytes=Buffer.from(input.photoData,'base64');if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw fail(400,'Ảnh hồ sơ cần là JPEG.')}
    value.profile.photoData=input.photoData
   }
  }else if(input.kind==='preferences'){
   if(input.language!==undefined){if(!['vi','en','system'].includes(input.language))throw fail(400,'Ngôn ngữ không hợp lệ.');value.preferences.language=input.language}
   for(const key of ['leaderboard','marketing','inApp'])if(input[key]!==undefined){if(typeof input[key]!=='boolean')throw fail(400,'Lựa chọn không hợp lệ.');value.preferences[key]=input[key]}
  }else if(input.kind==='message'){
   if(!['report','support','spot','tour'].includes(input.category))throw fail(400,'Loại yêu cầu không hợp lệ.')
   const subject=text(input.subject,120,'Tiêu đề'),message=text(input.message,2000,'Nội dung')
   if(!subject||message.length<5)throw fail(400,'Hãy nhập tiêu đề và nội dung ít nhất 5 ký tự.')
   if(value.messages.length>=100)throw fail(429,'Đã đạt 100 yêu cầu trong bản thử nghiệm.')
   const recent=value.messages.filter(item=>Date.now()-item.createdAt<60000).length
   if(recent>=5)throw fail(429,'Vui lòng chờ một phút trước khi gửi thêm.')
   value.messages.push({id:randomUUID(),category:input.category,subject,message,createdAt:Date.now(),status:'received'})
  }else throw fail(400,'Thao tác tài khoản không được hỗ trợ.')
  await mkdir(directory,{recursive:true});await writeFile(`${filename(id)}.tmp`,JSON.stringify(value),{mode:0o600});await rename(`${filename(id)}.tmp`,filename(id));return eventResult?{...value,eventResult}:value
 })}
}
