import {isChallengeCorrect,migrateCatalogRun} from '../shared/quest-challenges.mjs'
import { readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'
const quests=JSON.parse(readFileSync(new URL('../src/data/questCatalog.json',import.meta.url),'utf8'))
const fail=(status,message)=>Object.assign(new Error(message),{status})
const fresh=()=>({version:2,legacy:{version:1,destinations:{},redemptions:[]},quests:{}})
export function createQuestRuns(directory) {
 let queue=Promise.resolve()
 const filename=owner=>{if(typeof owner!=='string'||!/^[-\w]{1,80}$/.test(owner))throw fail(400,'Tài khoản không hợp lệ.');return join(directory,`${owner}.json`)}
 async function read(owner) {
  let value
  try{value=JSON.parse(await readFile(filename(owner),'utf8'))}catch(cause){if(cause.code==='ENOENT')return fresh();throw fail(422,'Không đọc được tiến độ quest. Dữ liệu cũ chưa bị ghi đè.')}
  if(value.version!==2||!value.quests||typeof value.quests!=='object'||Array.isArray(value.quests))throw fail(422,'Dữ liệu quest không hợp lệ. Chưa ghi đè dữ liệu cũ.')
  for(const [id,old] of Object.entries(value.quests)) {
   const run=value.quests[id]=migrateCatalogRun(id,old)
   const quest=quests.find(item=>item.id===id)
   if(!quest||!run||!Number.isFinite(run.startedAt)||!Array.isArray(run.completedCheckpointIds)||run.completedCheckpointIds.some((id,index)=>quest.checkpointOrder[index]!==id)||!run.completedAtByCheckpoint||run.completedCheckpointIds.some(id=>!Number.isFinite(run.completedAtByCheckpoint[id]))||!['story','challenge','feedback','results'].includes(run.phase))throw fail(422,'Tiến độ quest bị hỏng. Chưa ghi đè dữ liệu cũ.')
   const complete=run.completedCheckpointIds.length===quest.checkpointOrder.length
   if(complete!==Number.isFinite(run.completedAt)||(run.phase==='results'&&!complete))throw fail(422,'Kết quả quest không hợp lệ. Chưa ghi đè dữ liệu cũ.')
  }
  return value
 }
 return {read,remove(owner){const task=queue.then(()=>unlink(filename(owner)).catch(cause=>{if(cause.code!=='ENOENT')throw cause}));queue=task.catch(()=>{});return task},update(owner,action){
  const pending=queue.then(async()=>{
   if(!action||typeof action!=='object')throw fail(400,'Thao tác quest không hợp lệ.')
   const quest=quests.find(quest=>quest.id===action.questId)
   if(!quest)throw fail(400,'Không tìm thấy quest.')
   const state=await read(owner);let run=state.quests[quest.id]
   if(action.type==='start') {
    if(run)return state
    run=state.quests[quest.id]={startedAt:Date.now(),completedCheckpointIds:[],completedAtByCheckpoint:{},phase:'story',paused:false,catalogVersion:quest.catalogVersion||1}
   } else {
    if(!run)throw fail(400,'Quest chưa được bắt đầu.')
    if(action.type==='confirm-arrival') {
     if(run.arrivalConfirmedAt)return state
     run.arrivalConfirmedAt=Date.now();run.arrivalMethod='visual'
    }
    else if(action.type==='pause')run.paused=true
    else if(action.type==='resume')run.paused=false
    else {
     if(!run.arrivalConfirmedAt)throw fail(409,'Hãy xác nhận đã đến điểm bắt đầu trước khi chơi quest.')
     if(run.paused)throw fail(400,'Quest đang tạm dừng. Hãy tiếp tục hành trình trước.')
     if(action.type==='continue-story') {
      if(action.checkpointId&&action.checkpointId!==quest.checkpointOrder[run.completedCheckpointIds.length])return state
      if(run.phase==='challenge')return state
      if(run.phase!=='story')throw fail(409,'Bước chơi đã thay đổi. Hãy tải lại.');run.phase='challenge'
     }
     else if(action.type==='advance') {
      if(action.checkpointId&&action.checkpointId!==run.completedCheckpointIds.at(-1))return state
      if(run.phase==='story'||run.phase==='results')return state
      if(run.phase!=='feedback')throw fail(409,'Hãy hoàn thành thử thách trước.');run.phase=run.completedAt?'results':'story'
     }
     else if(action.type==='complete-checkpoint') {
      if(run.completedCheckpointIds.includes(action.checkpointId))return state
      const checkpoint=quest.checkpoints[run.completedCheckpointIds.length]
      if(run.phase!=='challenge'||!checkpoint||checkpoint.id!==action.checkpointId)throw fail(409,'Hãy hoàn thành checkpoint theo đúng thứ tự.')
      const challenge=checkpoint.challenge;const answer=typeof action.answer==='string'?action.answer:''
      const correct=isChallengeCorrect(challenge,answer)
      if(!correct)throw fail(400,'Câu trả lời chưa chính xác. Bạn có thể xem lại chỉ dẫn và thử lần nữa.')
      run.completedCheckpointIds.push(checkpoint.id);run.completedAtByCheckpoint[checkpoint.id]=Date.now();run.phase='feedback'
      if(run.completedCheckpointIds.length===quest.checkpoints.length)run.completedAt=Date.now()
     } else throw fail(400,'Thao tác quest không được hỗ trợ.')
    }
   }
   await mkdir(directory,{recursive:true});await writeFile(`${filename(owner)}.tmp`,JSON.stringify(state),{mode:0o600});await rename(`${filename(owner)}.tmp`,filename(owner))
   return state
  });queue=pending.catch(()=>{});return pending
 }}
}
