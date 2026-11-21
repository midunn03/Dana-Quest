import {afterEach,expect,it} from 'vitest'
import {createServer,type Server} from 'node:http'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createAuthApi} from '../server/auth.mjs'
let server:Server, directory=''
afterEach(async()=>{if(server){server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()))}if(directory)await rm(directory,{recursive:true,force:true})})
it('uses the signed-in account to create, join, read and leave a persistent private group',async()=>{
 directory=await mkdtemp(join(tmpdir(),'dana-groups-audit-'))
 const api=createAuthApi({file:join(directory,'accounts.json')})
 server=createServer((req,res)=>api(req,res,()=>{res.statusCode=404;res.end()}))
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
 const base=`http://127.0.0.1:${(server.address() as {port:number}).port}/api/auth`
 async function register(username:string){const response=await fetch(base+'/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password:'audit-only-password'})});return {cookie:response.headers.get('set-cookie')!.split(';')[0],owner:(await response.json()).user.id}}
 const one=await register('group-one'),two=await register('group-two'),outsider=await register('group-three')
 const request=(user:typeof one,path:string,body?:unknown,owner=user.owner)=>fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:user.cookie,'X-Dana-User':owner,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})
 expect((await request(one,'/groups/my')).status).toBe(200)
 expect((await request(one,'/groups/my',undefined,'stale-owner')).status).toBe(409)
 const creation=await request(one,'/groups/create',{name:'Bạn bè khám phá'})
 expect(creation.status).toBe(200)
 const group=await creation.json()
 expect(group.code).toMatch(/^DANA-/)
 expect((await request(two,'/groups/join',{code:group.code})).status).toBe(200)
 expect((await request(two,'/groups/join',{code:group.code})).status).toBe(409)
 const before=await (await request(two,'/groups/my')).json()
 expect(before.groups[0].memberCount).toBe(2)
 expect(before.groups[0].leaderboard.filter(member=>member.isSelf)).toHaveLength(1)
 expect(JSON.stringify(before)).not.toMatch(/password|salt|email|phone/)
 expect((await (await request(outsider,'/groups/my')).json()).groups).toEqual([])
 expect((await request(outsider,'/groups/leave',{groupId:group.groupId})).status).toBe(404)
 expect((await request(one,'/groups/leave',{groupId:group.groupId})).status).toBe(200)
 const remaining=await (await request(two,'/groups/my')).json()
 expect(remaining.groups[0].isLeader).toBe(true)
 expect(remaining.groups[0].memberCount).toBe(1)
 expect((await request(two,'/groups/leave',{groupId:group.groupId})).status).toBe(200)
 expect((await (await request(two,'/groups/my')).json()).groups).toEqual([])
})
