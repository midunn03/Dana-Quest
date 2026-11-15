const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('vi')
export function challengeAnswerReady(challenge,answer=''){
 if(!answer.trim())return false
 if(!['ordering','matching','multi-select'].includes(challenge.type))return true
 let value;try{value=JSON.parse(answer)}catch{return false}
 if(!Array.isArray(value))return false
 if(challenge.type==='multi-select')return value.length>0
 if(challenge.type==='ordering')return value.length===challenge.items.length&&new Set(value).size===value.length
 return value.length===challenge.pairs.length&&value.every(pair=>Array.isArray(pair)&&pair.length===2&&pair.every(item=>typeof item==='string'&&item.length>0))
}
export function isChallengeCorrect(challenge,answer='',photoAvailable=false){
 if(challenge.type==='photo')return photoAvailable
 if(challenge.type==='observation')return answer==='confirmed'
 if(typeof answer!=='string'||answer.length>5000)return false
 if(challenge.type==='text')return challenge.acceptedAnswers.some(value=>normalize(value)===normalize(answer))
 if(challenge.type==='single-choice')return answer===challenge.correctOptionId
 let parsed;try{parsed=JSON.parse(answer)}catch{return false}
 if(!Array.isArray(parsed))return false
 if(challenge.type==='ordering')return parsed.length===challenge.correctOrder.length&&parsed.every((value,index)=>value===challenge.correctOrder[index])
 if(challenge.type==='multi-select')return parsed.length===challenge.correctOptionIds.length&&new Set(parsed).size===parsed.length&&parsed.every(value=>challenge.correctOptionIds.includes(value))
 if(challenge.type==='matching')return parsed.length===challenge.pairs.length&&new Set(parsed.map(pair=>Array.isArray(pair)?pair[0]:null)).size===parsed.length&&parsed.every(pair=>Array.isArray(pair)&&pair.length===2&&challenge.pairs.some(item=>item.id===pair[0]&&item.correctOptionId===pair[1]))
 return false
}
export function migrateCatalogRun(id,run){
 if(id!=='due-dau-an-50-nam'||!run||run.catalogVersion>=2)return run
 const next={...run,catalogVersion:2}
 if(run.completedCheckpointIds?.length===2&&Number.isFinite(run.completedAt)){
  next.previousCompletionAt=run.completedAt;delete next.completedAt;next.phase='story'
 }
 return next
}
