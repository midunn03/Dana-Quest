import {expect,it} from 'vitest'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createPresentationEvent,loadPresentationEvents} from '../server/presentation-events.mjs'
import {createAccountFeatures} from '../server/account-features.mjs'
import {occurrenceFor} from '../shared/event-policy.mjs'
it('uses actual relative time, explicit owner, expiry and disabled-by-default catalog',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dana-presentation-')),now=Date.parse('2026-10-27T00:00:00Z'),file=join(dir,'events.json')
 try{const record=createPresentationEvent('one','invite',now)
 await writeFile(file,JSON.stringify({version:1,records:[record]}))
 expect(loadPresentationEvents(file,'one',now,false)).toEqual([])
 expect(loadPresentationEvents(file,'two',now,true)).toEqual([])
 const events=loadPresentationEvents(file,'one',now,true)
 expect(events).toHaveLength(1);expect(Date.parse(events[0].startAt)-now).toBe(90*60000)
 expect(loadPresentationEvents(file,'one',now+4*3600000,true)).toEqual([])
 expect(createPresentationEvent('one','reminder',now).event.id).not.toBe(record.event.id)
 expect(()=>createPresentationEvent('../escape','invite',now)).toThrow()
 }finally{await rm(dir,{recursive:true,force:true})}
})
it('scoped records retain normal preferences, cooldown and attendance reminder policy',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dana-presentation-store-'));let now=Date.parse('2026-10-27T00:00:00Z')
 const record=createPresentationEvent('one','invite',now),event=record.event
 const store=createAccountFeatures(dir,()=>now,owner=>owner==='one'?[event]:[])
 const input={kind:'event',eventId:event.id,key:occurrenceFor(event,now).key,action:'claim'}
 try{
 await expect(store.update('two',input)).rejects.toMatchObject({status:404})
 await store.update('one',{kind:'preferences',inApp:false})
 expect((await store.update('one',input)).eventResult.notice).toBeNull()
 await store.update('one',{kind:'preferences',inApp:true})
 expect((await store.update('one',input)).eventResult.notice).toBe('invite')
 expect((await store.update('one',input)).eventResult.notice).toBeNull()
 await store.update('one',{...input,action:'attend'});now+=65*60000
 expect((await store.update('one',input)).eventResult.notice).toBe('reminder')
 expect((await store.update('one',input)).eventResult.notice).toBeNull()
 }finally{await rm(dir,{recursive:true,force:true})}
})
it('does not claim a notice while gameplay eligibility is blocked',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dana-presentation-block-')),now=Date.parse('2026-10-27T00:00:00Z'),event=createPresentationEvent('one','invite',now).event
 const store=createAccountFeatures(dir,()=>now,()=>[event],async()=>false)
 try{const value=await store.update('one',{kind:'event',action:'claim',eventId:event.id,key:occurrenceFor(event,now).key});expect(value.eventResult.notice).toBeNull();expect(value.events.lastShown).toBe(0)}finally{await rm(dir,{recursive:true,force:true})}
})
