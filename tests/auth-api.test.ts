import { afterEach, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAuthApi } from '../server/auth.mjs'
import { createActivationStore } from '../server/activation-store.mjs'

let server: Server
let directory: string
afterEach(async () => {
  if (server) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) }
  if (directory) await rm(directory, { recursive: true, force: true })
})

it('registers durable accounts with username and password, authenticates with HttpOnly cookies, updates avatar & profile, rejects abuse and logs out', async () => {
  directory = await mkdtemp(join(tmpdir(), 'dana-auth-test-'))
  const file = join(directory, 'accounts.json')
  const api = createAuthApi({ file })
  server = createServer((req, res) => api(req, res, () => { res.statusCode = 404; res.end() }))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }
  const base = `http://127.0.0.1:${address.port}`
  let cookie = ''
  let owner = ''
  const request = (path: string, body?: unknown, method = 'POST', origin = base) => fetch(`${base}/api/auth${path}`, {
    method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie, 'X-Dana-User': owner }, body: body === undefined ? undefined : JSON.stringify(body),
  })
  const input = { username: 'Nguyễn Minh', password: 'test-password-long' }
  expect((await request('/session', undefined, 'GET')).status).toBe(401)
  expect((await request('/quest-codes', undefined, 'GET')).status).toBe(401)
  expect((await request('/quest-codes/redeem', { code:'DQ'+'A'.repeat(24) })).status).toBe(401)
  expect((await request('/register', input, 'POST', 'https://other.invalid')).status).toBe(403)
  expect((await request('/register', { ...input, username: 'a' })).status).toBe(400)
  const registration = await request('/register', input)
  expect(registration.status).toBe(200)
  expect(registration.headers.get('set-cookie')).toContain('HttpOnly; SameSite=Strict')
  cookie = registration.headers.get('set-cookie')!.split(';')[0]
  const issuedCode = await createActivationStore(join(directory,'quest-codes.json')).issue('due-dau-an-50-nam',Date.now()+60000)
  expect((await request('/quest-codes/redeem',{code:issuedCode.code})).status).toBe(200)
  expect((await request('/quest-codes/redeem',{code:issuedCode.code})).status).toBe(200)
  expect((await (await request('/quest-codes',undefined,'GET')).json()).items).toHaveLength(1)
  const profile = (await registration.json()).user
  owner = profile.id
  expect((await request('/quest-runs',undefined,'GET')).status).toBe(200)
  expect((await request('/quest-runs',{type:'start',questId:'due-dau-an-50-nam'})).status).toBe(200)
  expect((await request('/quest-runs',{type:'confirm-arrival',questId:'due-dau-an-50-nam'})).status).toBe(200)
  expect((await (await request('/quest-runs',undefined,'GET')).json()).quests['due-dau-an-50-nam'].arrivalMethod).toBe('visual')
  expect((await request('/quest-runs',{type:'continue-story',questId:'due-dau-an-50-nam',checkpointId:'cong-71'})).status).toBe(200)
  expect((await request('/quest-runs',{type:'complete-checkpoint',questId:'due-dau-an-50-nam',checkpointId:'cong-71',answer:'72'})).status).toBe(400)
  expect((await request('/quest-runs',{type:'complete-checkpoint',questId:'due-dau-an-50-nam',checkpointId:'cong-71',answer:'71'})).status).toBe(200)
  expect((await (await request('/quest-runs',undefined,'GET')).json()).quests['due-dau-an-50-nam'].phase).toBe('feedback')
  expect(profile).toMatchObject({ name: input.username, phone: '', email: '', storageMode: 'account' })
  expect(profile.phoneVerifiedAt).toBeNull()
  expect(profile.hash).toBeUndefined()
  expect(await readFile(file, 'utf8')).not.toContain(input.password)
  expect((await request('/register', input)).status).toBe(409)

  // Test updating email & phone on profile
  const profileUpdate = await request('/profile', { email: 'minh@example.test', phone: '0901234567' }, 'PATCH')
  expect(profileUpdate.status).toBe(200)
  const updatedUser = (await profileUpdate.json()).user
  expect(updatedUser.email).toBe('minh@example.test')
  expect(updatedUser.phone).toBe('+84901234567')

  // The client only sends actions; the server applies and validates them.
  const assignAction = { type: 'assign', destinationId: 'cau-rong', count: 10 }
  expect((await request('/game', { revision: 0, kind: 'action', action: assignAction })).status).toBe(200)
  expect((await request('/game', { revision: 0, kind: 'action', action: assignAction })).status).toBe(409)
  const assignedState = (await (await request('/game', undefined, 'GET')).json()).state
  expect(assignedState.destinations['cau-rong'].started).toBe(true)
  expect(assignedState.destinations['cau-rong'].selected).toHaveLength(10)
  expect(new Set(assignedState.destinations['cau-rong'].selected).size).toBe(10)

  // The server rejects invalid or unproven actions instead of trusting the client.
  expect((await request('/game', { revision: 1, kind: 'action', action: { type: 'assign', destinationId: 'unknown-place', count: 5 } })).status).toBe(400)
  expect((await request('/game', { revision: 1, kind: 'action', action: { type: 'assign', destinationId: 'cho-han', count: 4 } })).status).toBe(400)
  expect((await request('/game', { revision: 1, kind: 'action', action: { type: 'complete', destinationId: 'cau-rong', missionId: 'no-such-mission' } })).status).toBe(400)
  expect((await request('/game', { revision: 1, kind: 'action', action: { type: 'complete', destinationId: 'cau-rong', missionId: 'arrival' } })).status).toBe(400) // no valid GPS sample
  expect((await request('/game', { revision: 1, kind: 'action', action: { type: 'complete', destinationId: 'cau-rong', missionId: 'overview-photo' } })).status).toBe(400) // no photo uploaded yet
  expect((await request('/game', { revision: 1, kind: 'action', action: { type: 'redeem', rewardId: 'postcard' } })).status).toBe(400) // not enough coins

  // A self mission completes; completing it again is idempotent.
  expect((await request('/game', { revision: 1, kind: 'action', action: { type: 'complete', destinationId: 'cau-rong', missionId: 'read' } })).status).toBe(200)
  expect((await request('/game', { revision: 2, kind: 'action', action: { type: 'complete', destinationId: 'cau-rong', missionId: 'read' } })).status).toBe(200)
  const afterComplete = (await (await request('/game', undefined, 'GET')).json()).state
  expect(afterComplete.destinations['cau-rong'].completed).toEqual(['read'])

  expect((await request('/game', { revision: 3, kind: 'photo', photo: { id: 'cau-rong:overview-photo', destinationId: 'cau-rong', missionId: 'overview-photo', data: Buffer.from([255,216,255,224,0,0,255,217]).toString('base64') } })).status).toBe(200)
  expect((await (await request('/game', undefined, 'GET')).json()).photos).toHaveLength(1)
  // Progress reads return photo metadata only; full blobs require ?photos=full.
  const metaPhotos = (await (await request('/game', undefined, 'GET')).json()).photos
  expect(metaPhotos[0].data).toBeUndefined()
  expect(metaPhotos[0].id).toBe('cau-rong:overview-photo')
  const fullPhotos = (await (await request('/game?photos=full', undefined, 'GET')).json()).photos
  expect(fullPhotos).toHaveLength(1)
  expect(typeof fullPhotos[0].data).toBe('string')
  // A photo mission can now be completed because the photo exists server-side.
  expect((await request('/game', { revision: 4, kind: 'action', action: { type: 'complete', destinationId: 'cau-rong', missionId: 'overview-photo' } })).status).toBe(200)
  const withPhotoComplete = (await (await request('/game', undefined, 'GET')).json()).state
  expect(withPhotoComplete.destinations['cau-rong'].completed).toEqual(['read', 'overview-photo'])
  expect((await request('/profile/avatar', { avatarId: 'invalid' }, 'PATCH')).status).toBe(400)
  expect((await request('/profile/avatar', { avatarId: 'c1.m.tron.den.ngan.dai.1.0.2.1' }, 'PATCH')).status).toBe(200)
  expect((await (await request('/session', undefined, 'GET')).json()).user.avatarId).toBe('c1.m.tron.den.ngan.dai.1.0.2.1')
  expect((await request('/profile/avatar', { avatarId: 'c1.m.tron.den.ngan.dai.9.0.2.1' }, 'PATCH')).status).toBe(400)
  expect((await request('/profile/avatar', { avatarId: 'bien' }, 'PATCH')).status).toBe(200)
  expect((await (await request('/session', undefined, 'GET')).json()).user.avatarId).toBe('bien')
  expect((await request('/logout')).status).toBe(200)
  expect((await request('/session', undefined, 'GET')).status).toBe(401)
  expect((await request('/login', { ...input, password: 'wrong-password-long' })).status).toBe(401)
  const login = await request('/login', input)
  expect(login.status).toBe(200)
  expect((await login.json()).user.avatarId).toBe('bien')
  cookie = login.headers.get('set-cookie')!.split(';')[0]
  expect((await request('/session', undefined, 'GET')).status).toBe(200)
  const persisted = (await (await request('/game', undefined, 'GET')).json()).state
  expect(persisted.destinations['cau-rong'].completed).toEqual(['read', 'overview-photo'])
  expect(persisted.redemptions).toEqual([])

  // New device/session, same account: the server still returns its photos.
  const anotherLogin = await request('/login', input)
  cookie = anotherLogin.headers.get('set-cookie')!.split(';')[0]
  expect((await (await request('/game', undefined, 'GET')).json()).photos).toHaveLength(1)

  const second = { username: 'Lê Hoa', password: 'test-password-long' }
  const secondRegistration = await request('/register', second)
  expect(secondRegistration.status).toBe(200)
  cookie = secondRegistration.headers.get('set-cookie')!.split(';')[0]
  const secondUser = (await secondRegistration.json()).user
  expect((await request('/game', undefined, 'GET')).status).toBe(409) // Old tab cannot write as another account.
  owner = secondUser.id
  const isolated = await (await request('/game', undefined, 'GET')).json()
  expect(isolated.photos).toEqual([])
  expect(isolated.state.destinations).toEqual({})
})

async function limitedAuth(options: { trustProxy?: boolean } = {}) {
  directory = await mkdtemp(join(tmpdir(), 'dana-auth-limits-'))
  const api = createAuthApi({ file: join(directory, 'accounts.json'), ...options })
  server = createServer((req, res) => api(req, res, () => { res.statusCode = 404; res.end() }))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  return (path: string, body: Record<string, unknown>, forwarded?: string) => fetch(`${base}/api/auth${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base, ...(forwarded ? { 'X-Forwarded-For': forwarded } : {}) }, body: JSON.stringify(body),
  })
}

it('does not trust changing forwarded IP headers when proxy trust is disabled', async () => {
  const post = await limitedAuth({ trustProxy: false })
  for (let i = 0; i < 15; i++) expect((await post('/register', { username: 'x', password: 'fixture-password' }, `198.51.100.${i+1}`)).status).toBe(400)
  expect((await post('/register', { username: 'x', password: 'fixture-password' }, '203.0.113.7')).status).toBe(429)
})

it('separates trusted client IP limits and shares equivalent forwarded chains', async () => {
  const post = await limitedAuth({ trustProxy: true })
  for (let i = 0; i < 15; i++) expect((await post('/register', { username: 'x', password: 'fixture-password' }, '198.51.100.9, 10.0.0.2')).status).toBe(400)
  expect((await post('/register', { username: 'x', password: 'fixture-password' }, '198.51.100.9')).status).toBe(429)
  expect((await post('/register', { username: 'x', password: 'fixture-password' }, '203.0.113.9')).status).toBe(400)
})

it('falls back to the socket for malformed forwarded headers', async () => {
  const post = await limitedAuth({ trustProxy: true })
  for (let i = 0; i < 15; i++) expect((await post('/register', { username: 'x', password: 'fixture-password' }, `invalid-${i}`)).status).toBe(400)
  expect((await post('/register', { username: 'x', password: 'fixture-password' }, 'invalid-last')).status).toBe(429)
})

it('locks five consecutive wrong passwords across IPs and username/email aliases, then expires', async () => {
  const { vi } = await import('vitest')
  const clock = vi.spyOn(Date, 'now').mockReturnValue(2_000_000_000_000)
  try {
    const post = await limitedAuth({ trustProxy: true })
    expect((await post('/register', { username: 'Limit Owner', email: 'limit@example.test', password: 'fixture-password' }, '192.0.2.1')).status).toBe(200)
    for (let i=0;i<5;i++) expect((await post('/login', { username:i%2?'LIMIT@EXAMPLE.TEST':' limit owner ', password:'wrong-password' }, `198.51.100.${i+1}`)).status).toBe(401)
    expect((await post('/login', { username:'Limit Owner', password:'fixture-password' }, '203.0.113.1')).status).toBe(429)
    clock.mockReturnValue(2_000_000_000_000+15*60_000+1)
    expect((await post('/login', { username:'limit@example.test', password:'fixture-password' }, '203.0.113.2')).status).toBe(200)
  } finally { clock.mockRestore() }
})

it('clears the consecutive-failure count after successful authentication', async () => {
  const post = await limitedAuth({ trustProxy:true })
  await post('/register',{username:'Reset Owner',password:'fixture-password'},'192.0.2.1')
  for(let i=0;i<3;i++) expect((await post('/login',{username:'Reset Owner',password:'wrong-password'},`198.51.100.${i+1}`)).status).toBe(401)
  expect((await post('/login',{username:'Reset Owner',password:'fixture-password'},'198.51.100.10')).status).toBe(200)
  for(let i=0;i<5;i++) expect((await post('/login',{username:'Reset Owner',password:'wrong-password'},`203.0.113.${i+1}`)).status).toBe(401)
  expect((await post('/login',{username:'Reset Owner',password:'fixture-password'},'203.0.113.10')).status).toBe(429)
})

it('reserves the account failure budget during concurrent password checks', async () => {
  const post = await limitedAuth({trustProxy:true})
  await post('/register',{username:'Concurrent Owner',password:'fixture-password'},'192.0.2.1')
  const responses=await Promise.all(Array.from({length:6},(_,i)=>post('/login',{username:'Concurrent Owner',password:'wrong-password'},`198.51.100.${i+1}`)))
  expect(responses.map(response=>response.status).sort()).toEqual([401,401,401,401,401,429])
})

it('prunes expired IP, account, sensitive and code buckets with one expiry field', async () => {
  const {createAttemptLimiter,clientAddress}=await import('../server/auth-rate-limit.mjs')
  let now=100
  const entries=new Map(['ip:one','account:one','sensitive:one','codes:one'].map(key=>[key,{count:10,expires:101}]))
  const limiter=createAttemptLimiter({attempts:entries,clock:()=>now})
  now=102;limiter.prune();expect(entries.size).toBe(0)
  expect(limiter.consume('codes:one',10,60_000)).toBe(true)
  expect(clientAddress({headers:{'x-forwarded-for':'2001:0db8:0:0:0:0:0:1'},socket:{remoteAddress:'127.0.0.1'}},true)).toBe('2001:db8::1')
})

it('falls back safely for scoped IPv6 forwarded addresses', async () => {
  const {clientAddress}=await import('../server/auth-rate-limit.mjs')
  expect(clientAddress({headers:{'x-forwarded-for':'fe80::1%eth0'},socket:{remoteAddress:'127.0.0.1'}},true)).toBe('127.0.0.1')
})
