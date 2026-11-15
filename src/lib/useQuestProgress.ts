import { t } from '../i18n/locale'
import { useEffect, useRef, useState } from 'react'
import { migrateQuestState, newQuestState, updateQuestProgress, type QuestProgressAction } from './questProgress'
import { getSyncAccountId } from './accountSync'
import { authApiBase } from './auth'

const STORAGE_KEY = 'dana-quest-progress-v2'
function localProgress() {
  try { const saved=localStorage.getItem(STORAGE_KEY); return {state:saved?migrateQuestState(JSON.parse(saved)):newQuestState(),error:''} }
  catch { return {state:newQuestState(),error:t("Không đọc được tiến độ quest trên thiết bị. Dữ liệu cũ được giữ nguyên, chưa ghi đè.")} }
}
async function accountRequest(owner:string, action?:QuestProgressAction) {
  if(getSyncAccountId()!==owner)throw new Error(t("Tài khoản đã thay đổi. Hãy tải lại trang."))
  const response=await fetch(`${authApiBase()}/quest-runs`,{method:action?'POST':'GET',credentials:'include',headers:{'Content-Type':'application/json','X-Dana-User':owner},body:action?JSON.stringify(action):undefined})
  const data=await response.json()
  if(!response.ok)throw new Error(data.message||t("Không lưu được tiến độ quest. Hãy kiểm tra kết nối và thử lại."))
  if(getSyncAccountId()!==owner)throw new Error(t("Tài khoản đã thay đổi. Hãy tải lại trang."))
  return migrateQuestState(data)
}
export function useQuestProgress() {
  const owner=getSyncAccountId()
  const [initial]=useState(()=>owner?{state:newQuestState(),error:''}:localProgress())
  const [state,setState]=useState(initial.state)
  const [error,setError]=useState(initial.error)
  const [loadedOwner,setLoadedOwner]=useState<string|null|undefined>(owner?undefined:null)
  const [ready,setReady]=useState(!owner&&!initial.error)
  const [busy,setBusy]=useState(false)
  const submitting=useRef(false)
  const generation=useRef(0)
  useEffect(()=>{
    let alive=true
    const load=()=>{
      if(submitting.current)return
      const requestGeneration=++generation.current
      const result=owner?accountRequest(owner).then(state=>({state,error:''})):Promise.resolve(localProgress())
      void result.then(value=>{if(alive&&requestGeneration===generation.current&&getSyncAccountId()===owner){setState(value.state);setError(value.error);setReady(!value.error);setLoadedOwner(owner)}}).catch(cause=>{if(alive&&requestGeneration===generation.current&&getSyncAccountId()===owner){setError((cause as Error).message);setReady(false);setLoadedOwner(owner)}})
    }
    load();window.addEventListener('focus',load)
    return ()=>{alive=false;window.removeEventListener('focus',load)}
  },[owner])
  async function dispatch(action:QuestProgressAction) {
    if(submitting.current||!ready||loadedOwner!==owner)return false
    submitting.current=true;setBusy(true)
    generation.current++
    try {
      const next=owner?await accountRequest(owner,action):updateQuestProgress(state,action)
      if(!owner&&next!==state)localStorage.setItem(STORAGE_KEY,JSON.stringify(next))
      if(getSyncAccountId()!==owner)throw new Error(t("Tài khoản đã thay đổi. Hãy tải lại trang."))
      setState(next);setError('');return true
    }catch(cause){setError(cause instanceof Error?cause.message:t("Không lưu được tiến trình quest."));return false}
    finally{submitting.current=false;setBusy(false)}
  }
  return {state:loadedOwner===owner?state:newQuestState(),error,dispatch,busy,loading:loadedOwner!==owner,ready,storage:owner?'account' as const:'device' as const}
}
