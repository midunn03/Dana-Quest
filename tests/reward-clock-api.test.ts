import {afterEach, expect, it} from 'vitest'
import {createServer, type Server} from 'node:http'
import {mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createAuthApi} from '../server/auth.mjs'
import {getVietnamDateKey, createStreakStore} from '../server/streak.mjs'

let server: Server | undefined
let directory = ''
afterEach(async () => {
  if (server) {server.closeAllConnections(); await new Promise<void>(resolve=>server!.close(()=>resolve()))}
  if (directory) await rm(directory,{recursive:true,force:true})
})
it('uses the server date for daily rewards and records completed quest checkpoints as activity', async () => {
  directory=await mkdtemp(join(tmpdir(),'dana-clock-audit-'))
  const api=createAuthApi({file:join(directory,'accounts.json')})
  server=createServer((req,res)=>api(req,res,()=>{res.statusCode=404;res.end()}))
  await new Promise<void>(resolve=>server!.listen(0,'127.0.0.1',resolve))
  const base=`http://127.0.0.1:${(server.address() as {port:number}).port}`
  let cookie='',owner=''
  const request=(path:string,body?:unknown)=>fetch(`${base}/api/auth${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:base,Cookie:cookie,'X-Dana-User':owner},body:body?JSON.stringify(body):undefined})
  const registration=await request('/register',{username:'clock-audit',password:'audit-password'})
  cookie=registration.headers.get('set-cookie')!.split(';')[0];owner=(await registration.json()).user.id
  for (const timestamp of [Date.UTC(2000,0,1), Date.UTC(2000,0,2), Date.UTC(2000,0,3)]) {
    expect((await request('/streak/activity',{timestamp})).status).toBe(200)
  }
  const streak=await (await request('/streak')).json()
  expect(streak.lastActiveDate).toBe(getVietnamDateKey())
  expect(streak.currentStreak).toBe(1)
  expect(streak.claims).toHaveLength(0)
  const transit=await (await request('/transit/claim',{stationId:'tngo-bao-tang-cham',coordinates:[16.0598,108.223],accuracy:10,dwellSeconds:60,now:Date.UTC(2000,0,1)})).json()
  expect(transit.claim.dateKey).toBe(getVietnamDateKey())
  const questId='due-dau-an-50-nam'
  await request('/quest-runs',{type:'start',questId})
  await request('/quest-runs',{type:'confirm-arrival',questId})
  await request('/quest-runs',{type:'continue-story',questId})
  await createStreakStore(join(directory,'streaks')).recordActivity(owner,Date.now()-86400000)
  expect((await request('/quest-runs',{type:'complete-checkpoint',questId,checkpointId:'cong-71',answer:'71'})).status).toBe(200)
  expect((await (await request('/streak')).json()).lastActiveDate).toBe(getVietnamDateKey())
  const points=Array.from({length:200},(_,index)=>({lat:16.06+index*0.00001,lng:108.22,timestamp:Date.now()-200000+index*1000,accuracy:10}))
  expect((await request('/journey/track',{points})).status).toBe(200)
})
