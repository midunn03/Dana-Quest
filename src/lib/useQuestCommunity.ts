import { t } from '../i18n/locale'
import {useCallback,useEffect,useRef,useState} from 'react'
import {useAuth} from '../AuthContext'
import {authApiBase} from './auth'
import {accountRequest} from './accountFeatures'
import {requestLogin} from './authPrompt'
export const creatorId='dana-quest-studio'
export type Review={id:string;displayName:string;rating:number;comment:string;createdAt:number;updatedAt:number}
export type PublicCommunity={reviews:Review[];reviewCount:number;rating:number|null;followers:number;creatorRating?:number|null;creatorReviewCount?:number}
type PrivateCommunity={favorites:string[];following:string[];reviews:Record<string,Omit<Review,'id'>>}
const emptyPublic=():PublicCommunity=>({reviews:[],reviewCount:0,rating:null,followers:0})
export function useQuestCommunity(questId:string){
 const {user}=useAuth(),owner=user?.id,live=useRef<string|undefined>(undefined),mounted=useRef(false),lock=useRef(false)
 const [data,setData]=useState(emptyPublic),[own,setOwn]=useState<(PrivateCommunity&{owner:string})|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const refresh=useCallback(async()=>{
  const response=await fetch(`${authApiBase()}/quest-community?questId=${encodeURIComponent(questId)}`,{credentials:'include'}),value=await response.json()
  if(!response.ok||!Array.isArray(value.reviews)||typeof value.followers!=='number')throw Error(t("Chưa tải được dữ liệu cộng đồng. Hãy thử lại."))
  if(mounted.current)setData(value)
 },[questId])
 useEffect(()=>{mounted.current=true;live.current=owner;let active=true
  void Promise.all([refresh(),owner?accountRequest<PrivateCommunity>(owner,'/quest-social').then(value=>{if(active){if(!Array.isArray(value.favorites)||!Array.isArray(value.following))throw Error(t("Chưa đọc được lựa chọn đã lưu."));setOwn({...value,owner})}}):Promise.resolve()]).catch(cause=>{if(active)setError(cause.message)}).finally(()=>{if(active)setLoading(false)})
  return()=>{active=false;mounted.current=false}
 },[owner,refresh])
 async function act(action:Record<string,unknown>){
  if(!owner){requestLogin();return false}if(lock.current)return false
  lock.current=true;setBusy(true);setError('')
  try{const value=await accountRequest<PrivateCommunity>(owner,'/quest-social',action);if(mounted.current&&live.current===owner){setOwn({...value,owner});await refresh()}return true}catch(cause){if(mounted.current&&live.current===owner)setError(cause instanceof Error?cause.message:t("Chưa lưu được lựa chọn."));return false}finally{lock.current=false;if(mounted.current)setBusy(false)}
 }
 const privateData=own?.owner===owner?own:null
 return {data,loading,busy,error,act,favorite:privateData?.favorites.includes(questId)??false,following:privateData?.following.includes(creatorId)??false,review:privateData?.reviews[questId]}
}
