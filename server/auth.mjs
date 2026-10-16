import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createAccountData } from './account-data.mjs'

const derive = promisify(scrypt)
const cookieName = 'dana_session'
const lifetime = 7 * 24 * 60 * 60 * 1000
const digest = value => createHash('sha256').update(value).digest('hex')
const publicUser = ({ id, name, phone, email, avatarId, phoneVerifiedAt }) => ({ id, name, phone: phone ?? '', email: email ?? '', avatarId, phoneVerifiedAt: phoneVerifiedAt ?? null, storageMode: 'account' })

export function normalizePhone(value) {
  if (!value) return ''
  let phone = typeof value === 'string' ? value.replace(/[ ()-]/g, '') : ''
  if (/^0[35789]\d{8}$/.test(phone)) phone = '+84' + phone.slice(1)
  if (/^84[35789]\d{8}$/.test(phone)) phone = '+' + phone
  return /^\+84[35789]\d{8}$/.test(phone) ? phone : ''
}

function unique(users, email, phone, name, currentId = null) {
  if (name) {
    const nameExists = users.some(item => item.id !== currentId && item.name.toLowerCase() === name.toLowerCase())
    if (nameExists) throw fail(409, 'Tên người dùng này đã được đăng ký rồi.')
  }
  if (email) {
    const emailExists = users.some(item => item.id !== currentId && item.email && item.email.toLowerCase() === email.toLowerCase())
    if (emailExists) throw fail(409, 'Email này đã được sử dụng.')
  }
  if (phone) {
    const phoneExists = users.some(item => item.id !== currentId && item.phone && normalizePhone(item.phone) === phone)
    if (phoneExists) throw fail(409, 'Số điện thoại này đã được sử dụng.')
  }
}
const fail = (status, message) => Object.assign(new Error(message), { status })

// Local development service: one Node process, durable accounts, in-memory sessions.
export function createAuthApi({ file = resolve('.data/accounts.json') } = {}) {
  const game = createAccountData(resolve(dirname(file), 'players'))
  const sessions = new Map()
  const attempts = new Map()
  let queue = Promise.resolve()
  async function load() {
    try { return JSON.parse(await readFile(file, 'utf8')) }
    catch (error) { if (error.code === 'ENOENT') return []; throw error }
  }
  function mutate(action) {
    const result = queue.then(async () => {
      const users = await load()
      const user = await action(users)
      await mkdir(dirname(file), { recursive: true })
      await writeFile(`${file}.tmp`, JSON.stringify(users), { mode: 0o600 })
      await rename(`${file}.tmp`, file)
      return user
    })
    queue = result.catch(() => {})
    return result
  }
  function setCookie(res, value, secure, age = lifetime / 1000) {
    res.setHeader('Set-Cookie', `${cookieName}=${value}; Path=/api/auth; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? '; Secure' : ''}`)
  }
  return function authApi(req, res, next) {
    const path = req.url?.split('?')[0]
    if (!path?.startsWith('/api/auth/')) return next()
    const send = (status, data) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(data))
    }
    void (async () => {
      const secure = Boolean(req.socket.encrypted)
      const origin = `${secure ? 'https' : 'http'}://${req.headers.host}`
      if (req.headers.origin && req.headers.origin !== origin) throw fail(403, 'Yêu cầu khác nguồn không được phép.')
      const token = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) ?? ''
      const key = digest(token)
      for (const [id, session] of sessions) if (session.expires <= Date.now()) sessions.delete(id)
      const session = sessions.get(key)
      if (path === '/api/auth/game') {
        if (!session) throw fail(401, 'Phiên đã hết hạn. Hãy đăng nhập lại để đồng bộ.')
        if (req.headers['x-dana-user'] !== session.userId) throw fail(409, 'Tài khoản đã thay đổi ở tab khác. Hãy tải lại trang.')
        if (req.method === 'GET') {
          const photosMode = req.url?.split('?')[1]?.split('&').includes('photos=full') ? 'full' : 'meta'
          return send(200, await game.read(session.userId, photosMode))
        }
      }
      if (path === '/api/auth/session' && req.method === 'GET') {
        const user = session && (await load()).find(item => item.id === session.userId)
        if (!user) throw fail(401, 'Chưa đăng nhập.')
        return send(200, { user: publicUser(user) })
      }
      if (path === '/api/auth/logout' && req.method === 'POST') {
        sessions.delete(key); setCookie(res, '', secure, 0)
        return send(200, { ok: true })
      }
      if (!['POST', 'PATCH'].includes(req.method)) throw fail(405, 'Phương thức không được hỗ trợ.')
      if (!req.headers['content-type']?.startsWith('application/json')) throw fail(415, 'Dữ liệu phải có định dạng JSON.')
      let body = ''
      for await (const chunk of req) {
        body += chunk
        if (Buffer.byteLength(body) > (path === '/api/auth/game' ? 4500000 : 8192)) throw fail(413, 'Dữ liệu quá lớn.')
      }
      let input
      try { input = JSON.parse(body) } catch { throw fail(400, 'Dữ liệu không hợp lệ.') }
      if (!input || typeof input !== 'object') throw fail(400, 'Dữ liệu không hợp lệ.')
      if (path === '/api/auth/game' && req.method === 'POST') return send(200, await game.update(session.userId, input))
      if (path === '/api/auth/profile/avatar' && req.method === 'PATCH') {
        if (!session) throw fail(401, 'Chưa đăng nhập.')
        if (!['bien', 'nang', 'rung', 'may'].includes(input.avatarId)) throw fail(400, 'Nhân vật không hợp lệ.')
        const user = await mutate(users => {
          const found = users.find(item => item.id === session.userId)
          if (!found) throw fail(401, 'Chưa đăng nhập.')
          found.avatarId = input.avatarId
          return found
        })
        return send(200, { user: publicUser(user) })
      }
      if (path === '/api/auth/profile' && req.method === 'PATCH') {
        if (!session) throw fail(401, 'Chưa đăng nhập.')
        const user = await mutate(users => {
          const found = users.find(item => item.id === session.userId)
          if (!found) throw fail(401, 'Chưa đăng nhập.')
          const newName = typeof input.name === 'string' && input.name.trim() ? input.name.trim() : found.name
          const newEmail = typeof input.email === 'string' ? input.email.trim().toLowerCase() : found.email
          const newPhone = typeof input.phone === 'string' ? (input.phone.trim() ? normalizePhone(input.phone) : '') : found.phone
          if (newEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) || newEmail.length > 254)) {
            throw fail(400, 'Email không hợp lệ.')
          }
          if (input.phone && input.phone.trim() && !newPhone) {
            throw fail(400, 'Số điện thoại không hợp lệ.')
          }
          unique(users, newEmail, newPhone, newName !== found.name ? newName : null, found.id)
          found.name = newName
          found.email = newEmail
          found.phone = newPhone
          return found
        })
        return send(200, { user: publicUser(user) })
      }
      if (!['/api/auth/register', '/api/auth/login'].includes(path) || req.method !== 'POST') throw fail(404, 'Không tìm thấy chức năng.')
      const address = req.socket.remoteAddress
      for (const [id, value] of attempts) if (value.until < Date.now()) attempts.delete(id)
      const attempt = attempts.get(address) ?? { count: 0, until: Date.now() + 60_000 }
      attempts.set(address, attempt)
      if (++attempt.count > 15) throw fail(429, 'Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.')
      const name = typeof input.name === 'string' ? input.name.trim() : (typeof input.username === 'string' ? input.username.trim() : (typeof input.email === 'string' ? input.email.split('@')[0] : ''))
      const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
      const phone = normalizePhone(input.phone)
      const password = input.password
      if (typeof password !== 'string' || password.length < 6 || password.length > 128) throw fail(400, 'Mật khẩu phải từ 6 đến 128 ký tự.')

      let user
      if (path.endsWith('/register')) {
        if (!name || name.length < 2 || name.length > 100) throw fail(400, 'Tên đăng nhập phải từ 2 đến 100 ký tự.')
        if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) throw fail(400, 'Email không hợp lệ.')
        if (input.phone && !phone) throw fail(400, 'Số điện thoại không hợp lệ.')
        unique(await load(), email, phone, name)
        const salt = randomBytes(16).toString('hex')
        const hash = (await derive(password, salt, 64)).toString('hex')
        user = await mutate(users => {
          unique(users, email, phone, name)
          const record = { id: randomUUID(), name, phone: phone || '', email: email || '', salt, hash, avatarId: null, phoneVerifiedAt: null }
          users.push(record)
          return record
        })
      } else {
        const identifier = (input.username || input.name || input.email || '').trim().toLowerCase()
        if (!identifier) throw fail(400, 'Vui lòng nhập tên đăng nhập hoặc email.')
        user = (await load()).find(item => item.name.toLowerCase() === identifier || item.email.toLowerCase() === identifier)
        const hash = await derive(password, user?.salt ?? '00000000000000000000000000000000', 64)
        if (!user || !timingSafeEqual(hash, Buffer.from(user.hash, 'hex'))) throw fail(401, 'Tên đăng nhập / email hoặc mật khẩu không đúng.')
      }
      const newToken = randomBytes(32).toString('hex')
      sessions.delete(key)
      sessions.set(digest(newToken), { userId: user.id, expires: Date.now() + lifetime })
      setCookie(res, newToken, secure)
      send(200, { user: publicUser(user) })
    })().catch(error => send(error.status ?? 500, { message: error.status ? error.message : 'Không thể lưu hoặc đọc tài khoản. Vui lòng thử lại.' }))
  }
}

export const authApi = createAuthApi()

