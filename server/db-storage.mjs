import * as fs from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg

let activePool = null
let activeUrl = ''
let schemaPromise = null
let testPoolOverride = null

const isLocalHost = hostname => ['localhost', '127.0.0.1', '::1'].includes(hostname.toLowerCase())

function connectionUrl() {
  return (process.env.DATABASE_URL ?? '').trim()
}

export function isDatabaseEnabled() {
  return Boolean(testPoolOverride || connectionUrl())
}

export function toDocKey(filePath) {
  const full = resolve(String(filePath))
  const rel = relative(process.cwd(), full)
  if (!rel || (!rel.startsWith('..') && !isAbsolute(rel))) {
    return (rel || '.').replace(/\\/g, '/').replace(/^\.\//, '')
  }
  return `abs:${full.replace(/\\/g, '/')}`
}

function makeFsError(code, message) {
  return Object.assign(new Error(message), { code })
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, char => `\\${char}`)
}

function getPool() {
  if (testPoolOverride) return testPoolOverride
  const url = connectionUrl()
  if (!url) return null
  if (activePool && activeUrl === url) return activePool

  if (activePool) {
    activePool.end().catch(() => {})
    activePool = null
    schemaPromise = null
  }

  let ssl
  try {
    const parsed = new URL(url)
    const sslMode = parsed.searchParams.get('sslmode')?.toLowerCase()
    if (sslMode !== 'disable' && !isLocalHost(parsed.hostname)) {
      ssl = { rejectUnauthorized: false }
    }
  } catch {
    ssl = { rejectUnauthorized: false }
  }

  const pool = new Pool({
    connectionString: url,
    ssl,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  })
  // Prevent idle disconnect from Neon/cloud auto-suspend from crashing the process.
  pool.on('error', () => {})
  activePool = pool
  activeUrl = url
  schemaPromise = null
  return pool
}

function isTransientConnectionError(error) {
  const code = error?.code
  const message = String(error?.message ?? '')
  return (
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === '57P01' ||
    code === '57P02' ||
    code === '57P03' ||
    code === '08006' ||
    /Connection terminated unexpectedly|Client has encountered a connection error/i.test(message)
  )
}

async function ensureSchema(pool) {
  if (!schemaPromise) {
    schemaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS dana_kv_store (
          doc_key TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      .catch(error => {
        schemaPromise = null
        throw error
      })
  }
  await schemaPromise
}

async function runQuery(sql, params = []) {
  const pool = getPool()
  if (!pool) throw new Error('DATABASE_URL is not configured.')
  await ensureSchema(pool)
  try {
    return await pool.query(sql, params)
  } catch (error) {
    if (!isTransientConnectionError(error)) throw error
    return await pool.query(sql, params)
  }
}

export async function mkdir(dirPath, options) {
  if (!isDatabaseEnabled()) return fs.mkdir(dirPath, options)
  return undefined
}

export async function readFile(filePath, options) {
  if (!isDatabaseEnabled()) return fs.readFile(filePath, options)
  const key = toDocKey(filePath)
  const result = await runQuery('SELECT content FROM dana_kv_store WHERE doc_key = $1', [key])
  if (!result.rows.length) {
    throw makeFsError('ENOENT', `ENOENT: no such file or directory, open '${key}'`)
  }
  const content = String(result.rows[0].content)
  const encoding = typeof options === 'string' ? options : options?.encoding
  return encoding ? content : Buffer.from(content, 'utf8')
}

export async function writeFile(filePath, data, options) {
  if (!isDatabaseEnabled()) return fs.writeFile(filePath, data, options)
  const key = toDocKey(filePath)
  const text = typeof data === 'string' ? data : Buffer.from(data).toString('utf8')
  const flag = typeof options === 'object' && options !== null ? options.flag : undefined

  if (flag === 'wx') {
    const result = await runQuery(
      `INSERT INTO dana_kv_store (doc_key, content, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (doc_key) DO NOTHING
       RETURNING doc_key`,
      [key, text],
    )
    if (!result.rows.length) {
      throw makeFsError('EEXIST', `EEXIST: file already exists, open '${key}'`)
    }
    return
  }

  await runQuery(
    `INSERT INTO dana_kv_store (doc_key, content, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (doc_key) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
    [key, text],
  )
}

export async function rename(oldPath, newPath) {
  if (!isDatabaseEnabled()) return fs.rename(oldPath, newPath)
  const oldKey = toDocKey(oldPath)
  const newKey = toDocKey(newPath)
  if (oldKey === newKey) return

  const result = await runQuery(
    `WITH moved AS (
       DELETE FROM dana_kv_store WHERE doc_key = $1 RETURNING content
     )
     INSERT INTO dana_kv_store (doc_key, content, updated_at)
     SELECT $2, content, NOW() FROM moved
     ON CONFLICT (doc_key) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
     RETURNING doc_key`,
    [oldKey, newKey],
  )
  if (!result.rows.length) {
    throw makeFsError('ENOENT', `ENOENT: no such file or directory, rename '${oldKey}' -> '${newKey}'`)
  }
}

export async function unlink(filePath) {
  if (!isDatabaseEnabled()) return fs.unlink(filePath)
  const key = toDocKey(filePath)
  const result = await runQuery('DELETE FROM dana_kv_store WHERE doc_key = $1 RETURNING doc_key', [key])
  if (!result.rows.length) {
    throw makeFsError('ENOENT', `ENOENT: no such file or directory, unlink '${key}'`)
  }
}

export async function readdir(dirPath, options) {
  if (!isDatabaseEnabled()) return fs.readdir(dirPath, options)
  const dirKey = toDocKey(dirPath).replace(/\/+$/, '')
  const prefix = `${dirKey}/`
  const pattern = `${escapeLike(prefix)}%`
  const result = await runQuery(
    "SELECT doc_key FROM dana_kv_store WHERE doc_key LIKE $1 ESCAPE '\\'",
    [pattern],
  )
  const entries = new Set()
  for (const row of result.rows) {
    const rest = String(row.doc_key).slice(prefix.length)
    if (rest) entries.add(rest.split('/')[0])
  }
  return [...entries]
}

export async function open(filePath, flags, mode) {
  if (!isDatabaseEnabled()) return fs.open(filePath, flags, mode)
  const key = toDocKey(filePath)
  if (flags === 'wx') {
    // Clean up stale locks older than 30s in case a container restarted mid-write.
    await runQuery(
      "DELETE FROM dana_kv_store WHERE doc_key = $1 AND updated_at < NOW() - INTERVAL '30 seconds'",
      [key],
    )
    const result = await runQuery(
      `INSERT INTO dana_kv_store (doc_key, content, updated_at)
       VALUES ($1, '', NOW())
       ON CONFLICT (doc_key) DO NOTHING
       RETURNING doc_key`,
      [key],
    )
    if (!result.rows.length) {
      throw makeFsError('EEXIST', `EEXIST: file already exists, open '${key}'`)
    }
    return { async close() {} }
  }
  return fs.open(filePath, flags, mode)
}

export async function verifyDatabaseConnection() {
  if (!isDatabaseEnabled()) return false
  await runQuery('SELECT 1')
  return true
}

export function __setTestPool(pool) {
  testPoolOverride = pool
  schemaPromise = null
}
