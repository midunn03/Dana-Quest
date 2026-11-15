import { createAccountFeatures } from '../server/account-features.mjs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect,it } from 'vitest'
import { occurrenceFor } from '../shared/event-policy.mjs'
import catalog from '../shared/city-events.json'
it('serializes concurrent claims, scopes decisions by owner and retains account preferences',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'dana-events-store-'))
 try {
 const now=Date.parse('2026-10-30T11:30:00Z'),store=createAccountFeatures(directory,()=>now)
 const key=occurrenceFor(catalog[0],now)!.key
 const input={kind:'event',eventId:catalog[0].id,key,action:'claim'}
 const results=await Promise.all([store.update('one',input),store.update('one',input)])
 expect(results.map((x:any)=>x.eventResult?.notice).filter(Boolean)).toEqual(['invite'])
 expect((await store.read('two')).events?.decisions??{}).toEqual({})
 await store.update('one',{...input,action:'attend'})
 await store.update('one',{kind:'preferences',language:'en'})
 expect((await store.read('one')).events.decisions[key].choice).toBe('attend')
 expect((await store.read('one')).preferences.language).toBe('en')
 await expect(store.update('one',{...input,key:'forged'})).rejects.toMatchObject({status:409})
 await expect(store.update('one',{...input,eventId:'unknown'})).rejects.toMatchObject({status:404})
 } finally {await rm(directory,{recursive:true,force:true})}
})
