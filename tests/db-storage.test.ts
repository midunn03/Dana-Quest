import { afterEach, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  __setTestPool,
  isDatabaseEnabled,
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  toDocKey,
  unlink,
  writeFile,
} from '../server/db-storage.mjs'
import { createAuthApi } from '../server/auth.mjs'

function createFakePgPool() {
  const rows = new Map<string, { content: string; updatedAt: number }>()
  let tableCreated = false

  const pool = {
    rows,
    async query(sql: string, params: unknown[] = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim()

      if (/^CREATE TABLE IF NOT EXISTS dana_kv_store/i.test(normalized)) {
        tableCreated = true
        return { rows: [] }
      }
      if (normalized === 'SELECT 1') {
        return { rows: [{ '?column?': 1 }] }
      }
      if (/^SELECT content FROM dana_kv_store WHERE doc_key = \$1$/i.test(normalized)) {
        const entry = rows.get(String(params[0]))
        return { rows: entry ? [{ content: entry.content }] : [] }
      }
      if (/^INSERT INTO dana_kv_store .* ON CONFLICT \(doc_key\) DO NOTHING RETURNING doc_key$/i.test(normalized)) {
        const key = String(params[0])
        const content = params.length > 1 ? String(params[1]) : ''
        if (rows.has(key)) return { rows: [] }
        rows.set(key, { content, updatedAt: Date.now() })
        return { rows: [{ doc_key: key }] }
      }
      if (/^INSERT INTO dana_kv_store .* ON CONFLICT \(doc_key\) DO UPDATE/i.test(normalized)) {
        const key = String(params[0])
        const content = String(params[1])
        rows.set(key, { content, updatedAt: Date.now() })
        return { rows: [] }
      }
      if (/^WITH moved AS \( DELETE FROM dana_kv_store WHERE doc_key = \$1 RETURNING content \)/i.test(normalized)) {
        const oldKey = String(params[0])
        const newKey = String(params[1])
        const entry = rows.get(oldKey)
        if (!entry) return { rows: [] }
        rows.delete(oldKey)
        rows.set(newKey, { content: entry.content, updatedAt: Date.now() })
        return { rows: [{ doc_key: newKey }] }
      }
      if (/^DELETE FROM dana_kv_store WHERE doc_key = \$1 AND updated_at < NOW\(\) - INTERVAL '30 seconds'$/i.test(normalized)) {
        const key = String(params[0])
        const entry = rows.get(key)
        if (entry && Date.now() - entry.updatedAt > 30_000) rows.delete(key)
        return { rows: [] }
      }
      if (/^DELETE FROM dana_kv_store WHERE doc_key = \$1 RETURNING doc_key$/i.test(normalized)) {
        const key = String(params[0])
        if (!rows.has(key)) return { rows: [] }
        rows.delete(key)
        return { rows: [{ doc_key: key }] }
      }
      if (/^SELECT doc_key FROM dana_kv_store WHERE doc_key LIKE \$1 ESCAPE '\\'$/i.test(normalized)) {
        const pattern = String(params[0])
        const prefix = pattern.slice(0, -1).replace(/\\([\\_%])/g, '$1')
        const matched = [...rows.keys()]
          .filter(key => key.startsWith(prefix))
          .map(doc_key => ({ doc_key }))
        return { rows: matched }
      }
      throw new Error(`Unhandled SQL in fake pg pool: ${normalized}`)
    },
    isTableCreated: () => tableCreated,
  }
  return pool
}

let server: Server | null = null
let tempDir = ''
const originalRender = process.env.RENDER

afterEach(async () => {
  __setTestPool(null)
  if (originalRender === undefined) delete process.env.RENDER
  else process.env.RENDER = originalRender
  if (server) {
    server.closeAllConnections()
    await new Promise<void>(resolve => server!.close(() => resolve()))
    server = null
  }
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true })
    tempDir = ''
  }
})

describe('PostgreSQL database storage & Render HTTPS proxy', () => {
  it('supports readFile, writeFile, wx flag, atomic rename, readdir, open lock and unlink in PostgreSQL mode', async () => {
    const fakePool = createFakePgPool()
    __setTestPool(fakePool)
    expect(isDatabaseEnabled()).toBe(true)

    await mkdir('.data/players', { recursive: true })
    await expect(readFile('.data/missing.json', 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })

    await writeFile('.data/players/u1.json.tmp', JSON.stringify({ coins: 100 }), { mode: 0o600 })
    await rename('.data/players/u1.json.tmp', '.data/players/u1.json')
    expect(fakePool.isTableCreated()).toBe(true)
    expect(fakePool.rows.has(toDocKey('.data/players/u1.json.tmp'))).toBe(false)
    expect(JSON.parse(await readFile('.data/players/u1.json', 'utf8'))).toEqual({ coins: 100 })

    // wx exclusive write fails when row already exists
    await writeFile('.data/players/u1.backup', 'v1', { flag: 'wx' })
    await expect(writeFile('.data/players/u1.backup', 'v2', { flag: 'wx' })).rejects.toMatchObject({ code: 'EEXIST' })

    // readdir returns unique filenames under directory
    const list = await readdir('.data/players')
    expect(list.sort()).toEqual(['u1.backup', 'u1.json'])

    // lock via open('wx') blocks concurrent open until unlinked
    const lock = await open('.data/quest-codes.json.lock', 'wx')
    await expect(open('.data/quest-codes.json.lock', 'wx')).rejects.toMatchObject({ code: 'EEXIST' })
    await lock.close()
    await unlink('.data/quest-codes.json.lock')
    const relock = await open('.data/quest-codes.json.lock', 'wx')
    await relock.close()
    await unlink('.data/quest-codes.json.lock')
  })

  it('persists accounts, sessions, quest XP and wallet coins across server restarts when backed by PostgreSQL', async () => {
    const fakePool = createFakePgPool()
    __setTestPool(fakePool)
    tempDir = await mkdtemp(join(tmpdir(), 'dana-pg-persist-'))
    const accountsFile = join(tempDir, 'accounts.json')

    // Instance 1: Register, start quest, complete checkpoint (earn XP & coins)
    const api1 = createAuthApi({ file: accountsFile })
    server = createServer((req, res) => api1(req, res, () => { res.statusCode = 404; res.end() }))
    await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))
    const base1 = `http://127.0.0.1:${(server.address() as { port: number }).port}`

    const reg = await fetch(`${base1}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base1 },
      body: JSON.stringify({ username: 'CloudExplorer', password: 'strong-password-123' }),
    })
    expect(reg.status).toBe(200)
    const cookie = reg.headers.get('set-cookie')!.split(';')[0]
    const user = (await reg.json()).user

    const authHeaders = { 'Content-Type': 'application/json', Origin: base1, Cookie: cookie, 'X-Dana-User': user.id }
    expect((await fetch(`${base1}/api/auth/quest-runs`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ type: 'start', questId: 'due-dau-an-50-nam' }) })).status).toBe(200)
    expect((await fetch(`${base1}/api/auth/quest-runs`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ type: 'confirm-arrival', questId: 'due-dau-an-50-nam' }) })).status).toBe(200)
    expect((await fetch(`${base1}/api/auth/quest-runs`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ type: 'continue-story', questId: 'due-dau-an-50-nam', checkpointId: 'cong-71' }) })).status).toBe(200)
    expect((await fetch(`${base1}/api/auth/quest-runs`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ type: 'complete-checkpoint', questId: 'due-dau-an-50-nam', checkpointId: 'cong-71', answer: '71' }) })).status).toBe(200)

    const walletBefore = await (await fetch(`${base1}/api/auth/wallet`, { headers: { Cookie: cookie, 'X-Dana-User': user.id } })).json()
    expect(walletBefore.balance).toBeGreaterThan(0)

    // Simulate full container restart (stop server 1, spin up brand new auth instance 2)
    server.closeAllConnections()
    await new Promise<void>(resolve => server!.close(() => resolve()))

    const api2 = createAuthApi({ file: accountsFile })
    server = createServer((req, res) => api2(req, res, () => { res.statusCode = 404; res.end() }))
    await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))
    const base2 = `http://127.0.0.1:${(server.address() as { port: number }).port}`

    // Session cookie still authenticates immediately after restart!
    const sessionAfter = await fetch(`${base2}/api/auth/session`, { headers: { Cookie: cookie } })
    expect(sessionAfter.status).toBe(200)
    expect((await sessionAfter.json()).user.id).toBe(user.id)

    // Wallet coins & quest runs are still intact!
    const walletAfter = await (await fetch(`${base2}/api/auth/wallet`, { headers: { Cookie: cookie, 'X-Dana-User': user.id } })).json()
    expect(walletAfter.balance).toBe(walletBefore.balance)

    const runsAfter = await (await fetch(`${base2}/api/auth/quest-runs`, { headers: { Cookie: cookie, 'X-Dana-User': user.id } })).json()
    expect(runsAfter.quests['due-dau-an-50-nam'].completedCheckpointIds).toContain('cong-71')
  })

  it('accepts HTTPS Origin behind Render proxy (X-Forwarded-Proto: https) while still blocking cross-origin requests', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'dana-render-proxy-'))
    process.env.RENDER = 'true'
    const api = createAuthApi({ file: join(tempDir, 'accounts.json') })
    server = createServer((req, res) => api(req, res, () => { res.statusCode = 404; res.end() }))
    await new Promise<void>(resolve => server!.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as { port: number }).port
    const host = `127.0.0.1:${port}`

    // Same-host HTTPS behind Render proxy succeeds and sets Secure cookie
    const ok = await fetch(`http://${host}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: `https://${host}`,
        'X-Forwarded-Proto': 'https',
      },
      body: JSON.stringify({ username: 'RenderPlayer', password: 'strong-password-123' }),
    })
    expect(ok.status).toBe(200)
    expect(ok.headers.get('set-cookie')).toContain('; Secure')

    // Cross-origin request is still blocked with 403
    const evil = await fetch(`http://${host}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example',
        'X-Forwarded-Proto': 'https',
      },
      body: JSON.stringify({ username: 'RenderPlayer', password: 'strong-password-123' }),
    })
    expect(evil.status).toBe(403)
  })
})
