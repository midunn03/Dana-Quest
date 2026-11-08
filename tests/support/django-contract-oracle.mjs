// Synthetic contract oracle. Never uses a default store or project .data.
import { createServer } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { createAuthApi } from '../../server/auth.mjs'
import { isChallengeCorrect } from '../../shared/quest-challenges.mjs'

let input = ''
for await (const chunk of process.stdin) input += chunk
const scenario = JSON.parse(input)
Date.now = () => scenario.now
const directory = await mkdtemp(join(tmpdir(), 'dana-django-contract-'))
const api = createAuthApi({ file: join(directory, 'accounts.json') })
const server = createServer((req, res) => api(req, res, () => { res.statusCode = 404; res.end() }))
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}/api/auth`
let cookie = '', owner = ''
async function request(path, body, headers = {}) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json', 'X-Dana-User': owner, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: response.status, body: await response.json() }
}
try {
  const registration = await fetch(base + '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'contract-owner', password: 'synthetic-password' }) })
  if (!registration.ok) throw new Error('Synthetic registration failed')
  cookie = registration.headers.get('set-cookie').split(';')[0]
  owner = (await registration.json()).user.id
  const records = scenario.codes.map(item => ({ ...item, hash: createHash('sha256').update(item.code).digest('hex'), userId: item.otherOwner ? 'other-owner' : undefined }))
  for (const record of records) { delete record.code; delete record.otherOwner }
  await writeFile(join(directory, 'quest-codes.json'), JSON.stringify(records))
  const runs = [await request('/quest-runs')]
  for (const action of scenario.actions) runs.push(await request('/quest-runs', action))
  const codes = []
  for (const code of scenario.redemptions) codes.push(await request('/quest-codes/redeem', { code }))
  codes.push(await request('/quest-codes'))
  const stale = await request('/quest-runs', undefined, { 'X-Dana-User': 'stale-owner' })
  const grades = scenario.grades.map(item => isChallengeCorrect(item.challenge, item.answer, item.photoAvailable))
  process.stdout.write(JSON.stringify({ runs, codes, stale, grades }))
} finally {
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
  await rm(directory, { recursive: true, force: true })
}
