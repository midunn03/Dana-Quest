import { afterEach, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { createApiRateLimit, createPersistentLimiter } from '../server/api-rate-limit.mjs'

let directory: string
afterEach(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })
async function fixture() {
 directory = await mkdtemp(join(tmpdir(), 'dana-rate-limits-'))
 return join(directory, 'limits.sqlite3')
}

it('shares counters across independent processes, retains login reservations and expires windows', async () => {
 const file = await fixture()
 let now = 1000
 const limiter = createPersistentLimiter({ file, clock: () => now })
 expect(limiter.consume('ip:test', 1, 60000)).toBe(true)
 const moduleUrl = pathToFileURL(join(process.cwd(), 'server/api-rate-limit.mjs')).href
 const code = `import {createPersistentLimiter} from ${JSON.stringify(moduleUrl)}; console.log(createPersistentLimiter({file:${JSON.stringify(file)},clock:()=>1000}).consume('ip:test',1,60000))`
 expect(execFileSync(process.execPath, ['--input-type=module', '-e', code], {encoding:'utf8'}).trim()).toBe('false')
 const finishes = Array.from({length:5}, () => limiter.beginLogin('account:test'))
 const other = createPersistentLimiter({file,clock:()=>now})
 expect(other.beginLogin('account:test')).toBeNull()
 finishes.forEach(finish => finish!(false))
 expect(other.beginLogin('account:test')).toBeNull()
 now += 15 * 60000 + 1
 expect(other.beginLogin('account:test')).toBeTypeOf('function')
 expect(limiter.consume('ip:test',1,60000)).toBe(true)
})

it('limits all APIs, ignores forged forwarding headers and leaves static assets public', async () => {
 const limiter = createPersistentLimiter({file:await fixture()})
 const middleware = createApiRateLimit({limiter,trustProxy:false})
 let reached = 0
 const headers:Record<string,string> = {}
 const response = {statusCode:200,setHeader(key:string,value:string){headers[key]=value},end(){}}
 const request = {url:'/api/recommendations/nearby',headers:{'x-forwarded-for':'198.51.100.1'},socket:{remoteAddress:'127.0.0.1'}}
 for(let i=0;i<120;i++) middleware(request,response,()=>{reached++})
 request.headers['x-forwarded-for']='203.0.113.1'
 middleware(request,response,()=>{reached++})
 expect(reached).toBe(120)
 expect(response.statusCode).toBe(429)
 expect(headers['Retry-After']).toBe('60')
 middleware({...request,url:'/brand/icon.png'},response,()=>{reached++})
 expect(reached).toBe(121)
})

it('fails closed when the shared counter store cannot be opened', () => {
 const middleware=createApiRateLimit({limiter:{consume(){throw Error('store offline')}}})
 const response={statusCode:200,setHeader(){},end(){}}
 let reached=false
 middleware({url:'/api/navigation/route',headers:{},socket:{remoteAddress:'127.0.0.1'}},response,()=>{reached=true})
 expect(reached).toBe(false)
 expect(response.statusCode).toBe(503)
})

it('counts absolute-form HTTP targets against the same upstream budget', async () => {
 const middleware=createApiRateLimit({limiter:createPersistentLimiter({file:await fixture()}),trustProxy:false})
 const response={statusCode:200,setHeader(){},end(){}}
 let reached=0
 for(let i=0;i<11;i++) middleware({url:'http://localhost/api/navigation/route?id=invalid',headers:{},socket:{remoteAddress:'127.0.0.1'}},response,()=>{reached++})
 expect(reached).toBe(10)
 expect(response.statusCode).toBe(429)
})
