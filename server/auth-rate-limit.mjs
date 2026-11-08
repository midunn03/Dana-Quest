import { isIP } from 'node:net'

function normalizeAddress(value) {
  if (!isIP(value) || value.includes('%')) return null
  if (value.toLowerCase().startsWith('::ffff:') && isIP(value.slice(7)) === 4) return value.slice(7)
  return isIP(value) === 6 ? new URL(`http://[${value}]/`).hostname.slice(1, -1) : value
}

// Opt-in means the upstream proxy sanitizes XFF and the origin cannot be
// reached directly. Never trust a client-supplied chain in the default mode.
export function clientAddress(request, trustProxy = false) {
  const socket = normalizeAddress(request.socket.remoteAddress ?? '') ?? 'unknown'
  const forwarded = request.headers['x-forwarded-for']
  if (!trustProxy || typeof forwarded !== 'string' || forwarded.length > 1024) return socket
  const chain = forwarded.split(',').map(value => normalizeAddress(value.trim()))
  return chain.length <= 16 && chain.every(Boolean) ? chain[0] : socket
}

export function createAttemptLimiter({ attempts = new Map(), clock = Date.now } = {}) {
  function prune() {
    const now = clock()
    for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key)
  }
  function bucket(key, duration) {
    prune()
    let entry = attempts.get(key)
    if (!entry) {
      entry = { count: 0, expires: clock() + duration }
      attempts.set(key, entry)
    }
    return entry
  }
  return {
    prune,
    consume(key, limit, duration) {
      const entry = bucket(key, duration)
      return ++entry.count <= limit
    },
    beginLogin(key) {
      const entry = bucket(key, 15 * 60_000)
      if (entry.count + (entry.pending ?? 0) >= 5) return null
      entry.pending = (entry.pending ?? 0) + 1
      let finished = false
      return outcome => {
        if (finished) return
        finished = true
        entry.pending--
        if (attempts.get(key) !== entry) return
        if (outcome === true) entry.count = 0
        if (outcome === false) entry.count++
        if (!entry.pending && !entry.count) attempts.delete(key)
      }
    },
  }
}
