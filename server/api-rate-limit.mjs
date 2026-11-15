import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { clientAddress } from './auth-rate-limit.mjs'

// Shared by processes on one host; multi-host deployments need a shared service.
export function createPersistentLimiter({ file = resolve('.data/rate-limits.sqlite3'), clock = () => Date.now() } = {}) {
  function transaction(action) {
    mkdirSync(dirname(file), { recursive: true })
    const db = new DatabaseSync(file)
    try {
      db.exec('PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, pending INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS limits_expiry ON limits(expires); BEGIN IMMEDIATE')
      db.prepare('DELETE FROM limits WHERE expires <= ?').run(clock())
      const result = action(db)
      db.exec('COMMIT')
      return result
    } finally { db.close() }
  }
  const keyFor = key => createHash('sha256').update(key).digest('hex')
  function bucket(db, key, duration) {
    db.prepare('INSERT OR IGNORE INTO limits (key, count, expires) VALUES (?, 0, ?)').run(key, clock() + duration)
    return db.prepare('SELECT count, pending, expires FROM limits WHERE key = ?').get(key)
  }
  return {
    prune() {}, // Expired rows are removed in each transaction.
    consume(rawKey, limit, duration) {
      return transaction(db => {
        const key = keyFor(rawKey)
        const entry = bucket(db, key, duration)
        if (entry.count >= limit) return false
        db.prepare('UPDATE limits SET count = count + 1 WHERE key = ?').run(key)
        return true
      })
    },
    beginLogin(rawKey) {
      const key = keyFor(rawKey)
      const expires = transaction(db => {
        const entry = bucket(db, key, 15 * 60_000)
        if (entry.count + entry.pending >= 5) return null
        db.prepare('UPDATE limits SET pending = pending + 1 WHERE key = ?').run(key)
        return entry.expires
      })
      if (expires === null) return null
      let finished = false
      return outcome => {
        if (finished) return
        finished = true
        const result = outcome === true ? 1 : outcome === false ? 0 : -1
        transaction(db => {
          db.prepare('UPDATE limits SET pending = MAX(0, pending - 1), count = CASE WHEN ? = 1 THEN 0 WHEN ? = 0 THEN count + 1 ELSE count END WHERE key = ? AND expires = ?')
            .run(result, result, key, expires)
        })
      }
    },
  }
}

export function rateLimitResponse(response, status = 429) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Retry-After', '60')
  response.end(JSON.stringify({ message: status === 429 ? 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.' : 'Bộ giới hạn đang bận. Vui lòng thử lại sau.' }))
}

export function createApiRateLimit({ limiter = createPersistentLimiter(), trustProxy = process.env.TRUST_PROXY === '1' } = {}) {
  return (request, response, next) => {
    let path
    try { path = new URL(request.url ?? '/', 'http://localhost').pathname }
    catch {
      response.statusCode = 400
      response.end('Invalid URL')
      return
    }
    if (!path.startsWith('/api/')) return next()
    try {
      const address = clientAddress(request, trustProxy)
      if (!limiter.consume(`api-ip:${address}`, 120, 60_000)) return rateLimitResponse(response)
      if (['/api/navigation/route', '/api/places/visit-info'].includes(path)
          && !limiter.consume(`upstream-ip:${address}`, 10, 60_000)) return rateLimitResponse(response)
    } catch { return rateLimitResponse(response, 503) }
    return next()
  }
}

export const apiRateLimit = createApiRateLimit()
