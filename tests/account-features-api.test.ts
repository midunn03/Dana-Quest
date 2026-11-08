import { afterEach, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAuthApi } from '../server/auth.mjs'
let server:Server;let directory=''
afterEach(async()=>{if(server){server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()))}if(directory)await rm(directory,{recursive:true,force:true})})
async function setup(options:Record<string,unknown>={}){
 directory=await mkdtemp(join(tmpdir(),'dana-account-features-'))
 const api=createAuthApi({file:join(directory,'accounts.json'),...options})
 server=createServer((req,res)=>api(req,res,()=>{res.statusCode=404;res.end()}))
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
 const base=`http://127.0.0.1:${(server.address() as {port:number}).port}`
 let cookie='',owner=''
 const request=(path:string,body?:unknown,method=body?'POST':'GET',identity?:string)=>fetch(`${base}/api/auth${path}`,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie,'X-Dana-User':identity??owner},body:body?JSON.stringify(body):undefined})
 const registration=await request('/register',{username:'account-fixture',password:'old-password-fixture'})
 cookie=registration.headers.get('set-cookie')!.split(';')[0];owner=(await registration.json()).user.id
 return {request,owner,setCookie:(value:string)=>{cookie=value}}
}
it('persists private profile and preferences, validates input, and publishes only consented leaderboard data',async()=>{
 const {request}=await setup()
 expect((await request('/account')).status).toBe(200)
 expect((await request('/account',undefined,'GET','another-owner')).status).toBe(409)
 expect((await request('/account',{kind:'preferences',language:'vi',leaderboard:true,inApp:true,marketing:false})).status).toBe(200)
 expect((await request('/account',{kind:'profile',displayName:'Người khám phá',bio:'Tôi thích khám phá Đà Nẵng.',home:'Việt Nam'})).status).toBe(200)
 expect((await (await request('/account')).json()).profile.bio).toContain('Đà Nẵng')
 expect((await request('/account',{kind:'profile',displayName:'x'.repeat(81)})).status).toBe(400)
 await request('/quest-runs',{type:'start',questId:'due-dau-an-50-nam'})
 await request('/quest-runs',{type:'confirm-arrival',questId:'due-dau-an-50-nam'})
 await request('/quest-runs',{type:'continue-story',questId:'due-dau-an-50-nam'})
 await request('/quest-runs',{type:'complete-checkpoint',questId:'due-dau-an-50-nam',checkpointId:'cong-71',answer:'71'})
 const board=await (await request('/leaderboard')).json()
 expect(board.items[0]).toMatchObject({displayName:'Người khám phá',xp:50})
 expect(JSON.stringify(board)).not.toMatch(/email|phone|photoData|password|salt|hash/)
 await request('/account',{kind:'preferences',leaderboard:false})
 expect((await (await request('/leaderboard')).json()).items).toHaveLength(0)
 const note=await request('/account',{kind:'message',category:'spot',subject:'Gợi ý địa điểm',message:'Một khu vực công cộng cần được khảo sát.'})
 expect(note.status).toBe(200)
 expect((await (await request('/account')).json()).messages).toHaveLength(1)
})
it('changes password with verification and deletes only the authenticated account after explicit confirmation',async()=>{
 const {request}=await setup()
 expect((await request('/password',{currentPassword:'wrong-password',newPassword:'new-password-fixture'})).status).toBe(401)
 expect((await request('/password',{currentPassword:'old-password-fixture',newPassword:'new-password-fixture'})).status).toBe(200)
 expect((await request('/delete-account',{password:'old-password-fixture',confirmation:'XÓA TÀI KHOẢN'})).status).toBe(401)
 expect((await request('/delete-account',{password:'new-password-fixture',confirmation:'not-confirmed'})).status).toBe(400)
 expect((await request('/delete-account',{password:'new-password-fixture',confirmation:'XÓA TÀI KHOẢN'})).status).toBe(200)
 expect((await request('/session')).status).toBe(401)
 expect((await request('/login',{username:'account-fixture',password:'new-password-fixture'})).status).toBe(401)
})
it('protects event state by session and owner, validates occurrence keys and persists attendance',async()=>{
 const {request}=await setup()
 const {cityEvents}=await import('../src/data/events')
 const {occurrenceFor}=await import('../shared/event-policy.mjs')
 const event=cityEvents[0],key=occurrenceFor(event,Date.now())!.key
 expect((await request('/event-state',undefined,'GET','other-owner')).status).toBe(409)
 const initial=await(await request('/event-state')).json()
 expect(initial.events.decisions).toEqual({});expect(initial.serverNow).toBeTypeOf('number')
 expect((await request('/event-state',{eventId:event.id,key:'forged',action:'attend'})).status).toBe(409)
 expect((await request('/event-state',{eventId:event.id,key,action:'attend'})).status).toBe(200)
 expect((await(await request('/event-state')).json()).events.decisions[key].choice).toBe('attend')
 expect((await request('/event-state',{eventId:event.id,key,action:'remove'})).status).toBe(200)
 expect((await(await request('/event-state')).json()).events.decisions[key].choice).toBe('removed')
})
it('gates public quest reviews by completion and keeps favorites/follows private',async()=>{
 const {request}=await setup(),id='due-dau-an-50-nam'
 expect((await request('/quest-social',undefined,'GET','another-owner')).status).toBe(409)
 expect((await request('/quest-social',{action:'favorite',questId:id,enabled:true})).status).toBe(200)
 expect((await(await request('/quest-social')).json()).favorites).toEqual([id])
 expect((await request('/quest-social',{action:'follow',creatorId:'dana-quest-studio',enabled:true})).status).toBe(200)
 expect((await request('/quest-social',{action:'review',questId:id,rating:5,comment:'Một trải nghiệm tốt.'})).status).toBe(403)
 await request('/quest-runs',{type:'start',questId:id});await request('/quest-runs',{type:'confirm-arrival',questId:id});await request('/quest-runs',{type:'continue-story',questId:id});await request('/quest-runs',{type:'complete-checkpoint',questId:id,checkpointId:'cong-71',answer:'71'});await request('/quest-runs',{type:'advance',questId:id});await request('/quest-runs',{type:'continue-story',questId:id});await request('/quest-runs',{type:'complete-checkpoint',questId:id,checkpointId:'dau-moc-1975',answer:'1975'})
 for(const [checkpointId,answer] of [['sap-xep-ky-uc',JSON.stringify(['1975','2000','2015','2025'])],['ghep-dau-moc',JSON.stringify([['2000','25'],['2025','50'],['1975','0'],['2015','40']])],['mat-thu-tong-ket',JSON.stringify(['address','start','25','40','50'])]]){await request('/quest-runs',{type:'advance',questId:id});await request('/quest-runs',{type:'continue-story',questId:id});expect((await request('/quest-runs',{type:'complete-checkpoint',questId:id,checkpointId,answer})).status).toBe(200)}
 const review=await request('/quest-social',{action:'review',questId:id,rating:5,comment:'Một trải nghiệm tốt.'});expect(review.status).toBe(200)
 const data=await(await request(`/quest-community?questId=${id}`)).json();expect(data.reviewCount).toBe(1);expect(data.followers).toBe(1);expect(JSON.stringify(data)).not.toMatch(/password|email|phone|favorites/)
})

it('requires the existing eighty-percent completion rule before reviewing a destination',async()=>{
 const {request}=await setup(),id='cau-rong'
 const place=(await import('../src/data/destinations')).getDestination(id)!
 expect((await request('/quest-social',{action:'favorite',questId:id,enabled:true})).status).toBe(200)
 expect((await request('/quest-social',{action:'review',questId:id,rating:4,comment:'Một địa điểm thú vị.'})).status).toBe(403)
 let game=await(await request('/game')).json()
 const assign=await request('/game',{kind:'action',revision:game.revision,action:{type:'assign',destinationId:id,count:10}});expect(assign.status).toBe(200);game=await assign.json()
 for(const missionId of game.state.destinations[id].selected.filter((x:string)=>!['overview-photo','detail-photo'].includes(x))){const result=await request('/game',{kind:'action',revision:game.revision,action:{type:'complete',destinationId:id,missionId,location:{latitude:place.position[0],longitude:place.position[1],accuracy:5,timestamp:Date.now()}}});expect(result.status).toBe(200);game=await result.json()}
 expect(game.state.destinations[id].completed).toHaveLength(8)
 expect((await request('/quest-social',{action:'review',questId:id,rating:4,comment:'Một địa điểm thú vị.'})).status).toBe(200)
 expect((await(await request(`/quest-community?questId=${id}`)).json()).reviewCount).toBe(1)
})

it('serves scoped presentation catalog and blocks a notice until active quest is paused',async()=>{
 const {createPresentationEvent}=await import('../server/presentation-events.mjs')
 const {occurrenceFor}=await import('../shared/event-policy.mjs')
 const now=Date.parse('2026-10-27T00:00:00Z'),{request,owner}=await setup({presentationEnabled:true,eventClock:()=>now})
 const record=createPresentationEvent(owner,'invite',now),other=createPresentationEvent('another-owner','invite',now)
 await writeFile(join(directory,'presentation-events.json'),JSON.stringify({version:1,records:[record,other]}))
 const state=await(await request('/event-state')).json()
 expect(state.catalog.some((event:any)=>event.id===record.event.id)).toBe(true)
 expect(state.catalog.some((event:any)=>event.id===other.event.id)).toBe(false)
 const body={eventId:record.event.id,key:occurrenceFor(record.event,now).key,action:'claim'}
 await request('/quest-runs',{type:'start',questId:'cau-rong'})
 expect((await(await request('/event-state',body)).json()).notice).toBeNull()
 await request('/quest-runs',{type:'pause',questId:'cau-rong'})
 expect((await(await request('/event-state',body)).json()).notice).toBe('invite')
 expect((await(await request('/event-state',body)).json()).notice).toBeNull()
})
