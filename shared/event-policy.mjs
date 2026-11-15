export const MINUTE=60000
export function dueNotice(state={},start,now){
 if(!Number.isFinite(start)||!Number.isFinite(now)||now>=start)return null
 if(state.choice==='attend')return now>=start-30*MINUTE&&!state.remindedAt?'reminder':null
 if(state.choice==='removed'||now<start-180*MINUTE||now>=start-30*MINUTE)return null
 return now>=(state.nextAt||0)?'invite':null
}
export function decideEvent(state={},choice,now){
 if(choice==='attend')return {...state,choice,nextAt:0,updatedAt:now}
 if(choice==='remove')return {...state,choice:'removed',nextAt:0,updatedAt:now}
 return {...state,choice:'later',nextAt:now+60*MINUTE,updatedAt:now}
}
export function claimNotice(state={},kind,now){return kind==='reminder'?{...state,remindedAt:now,updatedAt:now}:{...state,nextAt:now+60*MINUTE,updatedAt:now}}
export function occurrenceFor(event,now=Date.now()){
 if(event.status==='cancelled')return null
 let start=Date.parse(event.startAt||''),end=Date.parse(event.endAt||'')
 if(event.recurring==='dragon-weekend'){
  const local=new Date(now+7*3600000)
  for(let offset=0;offset<8;offset++){
   const day=new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate()+offset))
   const candidate=day.getTime()+14*3600000
   if([0,5,6].includes(day.getUTCDay())&&candidate+20*MINUTE>now){start=candidate;end=start+20*MINUTE;break}
  }
 }
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=now||end<=start)return null
 return {key:`${event.id}:${start}`,start,end}
}
