import {useEffect, useLayoutEffect, useRef, useState} from 'react'

/** Keep the player mounted until the server acknowledges a pause. */
export function useQuestNavigationGuard(active:boolean, pause:()=>Promise<boolean>, busy=false, permittedDestination?:string){
 const [destination,setDestination]=useState<string|null>(null)
 const [saving,setSaving]=useState(false)
 const latest=useRef({active,pause,busy,permittedDestination})
 useLayoutEffect(()=>{latest.current={active,pause,busy,permittedDestination}},[active,pause,busy,permittedDestination])
 const bypass=useRef<string|null>(null)
 useEffect(()=>{
  const navigate=(event:Event)=>{
   const request=event as CustomEvent<{hash:string}>
   if(bypass.current===request.detail.hash){bypass.current=null;return}
   if(!latest.current.active||request.detail.hash===latest.current.permittedDestination)return
   event.preventDefault();setDestination(request.detail.hash)
  }
  const unload=(event:BeforeUnloadEvent)=>{if(latest.current.active){event.preventDefault();event.returnValue=''}}
  window.addEventListener('dana-before-navigation',navigate)
  window.addEventListener('beforeunload',unload)
  return()=>{window.removeEventListener('dana-before-navigation',navigate);window.removeEventListener('beforeunload',unload)}
 },[])
 async function confirm(){
  if(!destination||saving||latest.current.busy)return
  setSaving(true)
  try{if(await latest.current.pause()){bypass.current=destination;window.location.hash=destination;setDestination(null)}}
  finally{setSaving(false)}
 }
 return {destination,saving,confirm,cancel:()=>{if(!saving)setDestination(null)}}
}
