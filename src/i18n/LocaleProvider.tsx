import {updatePageMetadata} from '../lib/pageMetadata'
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useAuth } from '../AuthContext'
import { loadAccountFeatures } from '../lib/accountFeatures'
import { getLocale, languageStorageKey, readLanguage, rememberLanguage, resolveLocale, setLocale, subscribeLocale, t, type Language } from './locale'
const LocaleContext=createContext<{language:Language;setLanguage:(language:Language)=>void}|null>(null)
export function LocaleProvider({children}:{children:ReactNode}){
 const {user}=useAuth(),owner=user?.id
 const currentOwner=useRef(owner);currentOwner.current=owner
 const [preference,setPreference]=useState<{owner:string|undefined;language:Language}>(()=>({owner,language:readLanguage(owner)}))
 const language=preference.owner===owner?preference.language:readLanguage(owner)
 // Resolve account changes during render so the previous owner's locale never renders for the next owner.
 const locale=resolveLocale(language)
 if(getLocale()!==locale){setLocale(locale,false)}
 useEffect(()=>{let active=true;setPreference({owner,language:readLanguage(owner)});if(owner)void loadAccountFeatures(owner).then(data=>{if(active){rememberLanguage(data.preferences.language,owner);setPreference({owner,language:data.preferences.language})}}).catch(()=>{});return()=>{active=false}},[owner])
 useEffect(()=>updatePageMetadata(locale),[locale])
 useEffect(()=>{const update=()=>{if(language==='system')setLocale(resolveLocale('system'))};window.addEventListener('languagechange',update);return()=>window.removeEventListener('languagechange',update)},[language])
 useEffect(()=>{const update=(event:StorageEvent)=>{if(event.key===languageStorageKey(owner))setPreference({owner,language:readLanguage(owner)})};window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update)},[owner])
 const setLanguage=(next:Language)=>{if(currentOwner.current!==owner)return;rememberLanguage(next,owner);setPreference({owner,language:next});setLocale(resolveLocale(next))}
 return <LocaleContext.Provider value={{language,setLanguage}}>{children}</LocaleContext.Provider>
}
export function useLocale(){const context=useContext(LocaleContext);const locale=useSyncExternalStore(subscribeLocale,getLocale,getLocale);return {...context,language:context?.language??locale,setLanguage:context?.setLanguage??((language:Language)=>setLocale(resolveLocale(language))),locale,t}}
