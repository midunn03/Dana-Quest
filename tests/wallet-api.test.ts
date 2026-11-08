import {test,expect} from 'vitest'
import {createServer} from 'node:http'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createAuthApi} from '../server/auth.mjs'
test('wallet API enforces session ownership and credits only accepted server checkpoint completions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dana-wallet-api-')),api=createAuthApi({file:join(dir,'accounts.json')})
 const server=createServer((req,res)=>api(req,res,()=>{res.statusCode=404;res.end()}));await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
 try{const base=`http://127.0.0.1:${(server.address() as {port:number}).port}/api/auth`;let cookie='',owner=''
 const request=(path:string,body?:unknown)=>fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Cookie:cookie,'X-Dana-User':owner},body:body?JSON.stringify(body):undefined})
 expect((await request('/wallet')).status).toBe(401)
 const register=await request('/register',{username:'wallet-test',password:'long-test-password'});cookie=register.headers.get('set-cookie')!.split(';')[0];const id=(await register.json()).user.id
 expect((await request('/wallet')).status).toBe(409);owner=id
 expect((await (await request('/wallet')).json()).balance).toBe(0)
 for(const action of [{type:'start'},{type:'confirm-arrival'},{type:'continue-story',checkpointId:'cong-71'},{type:'complete-checkpoint',checkpointId:'cong-71',answer:'71'}])expect((await request('/quest-runs',{questId:'due-dau-an-50-nam',...action})).status).toBe(200)
 expect((await (await request('/wallet')).json()).balance).toBe(10)
 expect((await request('/wallet',{rewardId:'postcard',amount:100000})).status).toBe(400)
 expect((await (await request('/wallet')).json()).balance).toBe(10)
 owner='other-account';expect((await request('/wallet',{rewardId:'postcard'})).status).toBe(409)
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(dir,{recursive:true,force:true})}
})
