import {useCallback,useEffect,useRef,useState} from 'react'
import {getSyncAccountId} from './accountSync'
import {authApiBase} from './auth'
import {emptyWallet,type Wallet} from './wallet'
export function useWallet(){
 const owner=getSyncAccountId(),generation=useRef(0),submitting=useRef(false)
 const [record,setRecord]=useState<{owner:string|null;wallet:Wallet}>({owner:null,wallet:emptyWallet()})
 const [loading,setLoading]=useState(!!owner),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const request=useCallback(async (rewardId?:string)=>{
  if(!owner)throw new Error('WALLET_AUTH_REQUIRED')
  const response=await fetch(`${authApiBase()}/wallet`,{method:rewardId?'POST':'GET',credentials:'include',headers:{'Content-Type':'application/json','X-Dana-User':owner},body:rewardId?JSON.stringify({rewardId}):undefined})
  const value=await response.json();if(getSyncAccountId()!==owner)throw new Error('WALLET_OWNER_CHANGED');if(!response.ok)throw new Error(value.code||value.message||'WALLET_UNAVAILABLE');return value as Wallet
 },[owner])
 useEffect(()=>{
  let alive=true
  const load=()=>{const version=++generation.current;if(!owner){setRecord({owner:null,wallet:emptyWallet()});setLoading(false);setError('WALLET_AUTH_REQUIRED');return}setLoading(true);void request().then(wallet=>{if(alive&&generation.current===version){setRecord({owner,wallet});setError('')}}).catch(cause=>{if(alive&&generation.current===version)setError(cause.message)}).finally(()=>{if(alive&&generation.current===version)setLoading(false)})}
  load();window.addEventListener('focus',load);window.addEventListener('dana-wallet-updated',load)
  return()=>{alive=false;window.removeEventListener('focus',load);window.removeEventListener('dana-wallet-updated',load)}
 // The account identity owns this effect and its request lifetime.
 },[owner,request])
 async function redeem(rewardId:string){if(submitting.current||!owner)return false;submitting.current=true;setBusy(true);const version=++generation.current;try{const wallet=await request(rewardId);if(generation.current===version&&getSyncAccountId()===owner){setRecord({owner,wallet});setError('');window.dispatchEvent(new Event('dana-wallet-updated'));return true}return false}catch(cause){if(getSyncAccountId()===owner)setError((cause as Error).message);return false}finally{submitting.current=false;setBusy(false)}}
 return {wallet:record.owner===owner?record.wallet:emptyWallet(),loading:loading||record.owner!==owner,busy,error,redeem,authenticated:!!owner}
}
