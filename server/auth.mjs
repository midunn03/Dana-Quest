import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createWallet } from './wallet.mjs'
import { createAccountData } from './account-data.mjs'
import { createActivationStore } from './activation-store.mjs'
import { createQuestRuns } from './quest-runs.mjs'
import {loadPresentationEvents} from './presentation-events.mjs'
import { createAccountFeatures } from './account-features.mjs'
import { createQuestCommunity, isCommunityQuest } from './quest-community.mjs'
import { readFileSync } from 'node:fs'
import { clientAddress } from './auth-rate-limit.mjs'
import { createPersistentLimiter } from './api-rate-limit.mjs'
const cityEventCatalog=JSON.parse(readFileSync(new URL('../shared/city-events.json',import.meta.url),'utf8'))
const questCatalog=JSON.parse(readFileSync(new URL('../src/data/questCatalog.json',import.meta.url),'utf8'))

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
export function createAuthApi({ file = resolve('.data/accounts.json'), eventClock = Date.now, presentationEnabled = process.env.DANA_PRESENTATION_EVENTS==='1', trustProxy = process.env.TRUST_PROXY==='1' } = {}) {
  const game = createAccountData(resolve(dirname(file), 'players'))
  const codes = createActivationStore(resolve(dirname(file), 'quest-codes.json'))
  const questRuns = createQuestRuns(resolve(dirname(file), 'quest-runs'))
  const eventCatalog=(owner,now=eventClock())=>[...cityEventCatalog,...loadPresentationEvents(resolve(dirname(file),'presentation-events.json'),owner,now,presentationEnabled)]
  const accountFeatures = createAccountFeatures(resolve(dirname(file), 'account-features'), eventClock,eventCatalog,async owner=>{const state=await questRuns.read(owner);return !Object.values(state.quests).some(run=>!run.completedAt&&!run.paused)})
  const community = createQuestCommunity(resolve(dirname(file),'quest-community.json'))
  const wallet = createWallet(resolve(dirname(file), 'wallets'), {
    readGame: owner => game.read(owner), readQuests: owner => questRuns.read(owner),
    readSourceBackup: async owner => {
      const read = async folder => { try { return JSON.parse(await readFile(resolve(dirname(file), folder, owner + '.json'), 'utf8')) } catch { return null } }
      return { game: await read('players'), quests: await read('quest-runs') }
    },
  })
  const deleting = new Set()
  const sessions = new Map()
  const attempts = createPersistentLimiter({ file: resolve(dirname(file), 'rate-limits.sqlite3') })
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
      if (status === 429) res.setHeader('Retry-After', '900')
      res.end(JSON.stringify(data))
    }
    void (async () => {
      attempts.prune()
      const secure = Boolean(req.socket.encrypted)
      const origin = `${secure ? 'https' : 'http'}://${req.headers.host}`
      if (req.headers.origin && req.headers.origin !== origin) throw fail(403, 'Yêu cầu khác nguồn không được phép.')
      const token = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) ?? ''
      const key = digest(token)
      for (const [id, session] of sessions) if (session.expires <= Date.now()) sessions.delete(id)
      const session = sessions.get(key)
      if (session && !attempts.consume(`api-user:${session.userId}`,120,60000)) throw fail(429,'Bạn thao tác quá nhanh. Vui lòng thử lại sau.')
      if(session&&deleting.has(session.userId))throw fail(409,'Tài khoản đang được xóa. Vui lòng chờ.')
      if(path==='/api/auth/quest-community'&&req.method==='GET'){
        const id=new URL(req.url,origin).searchParams.get('questId')
        if(!isCommunityQuest(id))throw fail(404,'Không tìm thấy quest.')
        return send(200,await community.public(id))
      }
      if(path==='/api/auth/quest-social'){
        if(!session)throw fail(401,'Hãy đăng nhập để lưu quest hoặc theo dõi nhà sáng tạo.')
        if(req.headers['x-dana-user']!==session.userId)throw fail(409,'Tài khoản đã thay đổi. Hãy tải lại trang.')
        if(req.method==='GET')return send(200,await community.private(session.userId))
      }
      if(path==='/api/auth/leaderboard'&&req.method==='GET'){
        const items=[]
        for(const user of await load()){
          if(deleting.has(user.id))continue
          const profile=await accountFeatures.read(user.id)
          if(!profile.preferences.leaderboard)continue
          const progress=await questRuns.read(user.id)
          const xp=questCatalog.reduce((sum,quest)=>sum+quest.checkpoints.filter(item=>progress.quests[quest.id]?.completedCheckpointIds.includes(item.id)).reduce((value,item)=>value+item.reward.xp,0),0)
          if(xp>0)items.push({id:digest(user.id).slice(0,20),displayName:profile.profile.displayName||user.name,avatarId:user.avatarId,xp,city:'Đà Nẵng'})
        }
        items.sort((a,b)=>b.xp-a.xp||a.id.localeCompare(b.id))
        return send(200,{items:items.slice(0,50).map((item,index)=>({...item,rank:index+1})),scope:'all-time',city:'Đà Nẵng'})
      }
      if(['/api/auth/account','/api/auth/event-state','/api/auth/password','/api/auth/delete-account'].includes(path)){
        if(!session)throw fail(401,'Hãy đăng nhập để quản lý tài khoản.')
        if(req.headers['x-dana-user']!==session.userId)throw fail(409,'Tài khoản đã thay đổi. Hãy tải lại trang.')
        if(path==='/api/auth/account'&&req.method==='GET')return send(200,await accountFeatures.read(session.userId))
        if(path==='/api/auth/event-state'&&req.method==='GET'){
          const value=await accountFeatures.read(session.userId)
          return send(200,{events:value.events??{decisions:{},lastShown:0},enabled:value.preferences.inApp,serverNow:eventClock(),catalog:eventCatalog(session.userId)})
        }
      }
      if (path === '/api/auth/wallet') {
        if (!session) throw fail(401, 'WALLET_AUTH_REQUIRED')
        if (req.headers['x-dana-user'] !== session.userId) throw fail(409, 'WALLET_OWNER_CHANGED')
        if (req.method === 'GET') return send(200, await wallet.read(session.userId))
      }
      if (path === '/api/auth/quest-runs') {
        if (!session) throw fail(401, 'Hãy đăng nhập để lưu tiến độ quest.')
        if (req.headers['x-dana-user'] !== session.userId) throw fail(409, 'Tài khoản đã thay đổi. Hãy tải lại trang.')
        if (req.method === 'GET') return send(200, await questRuns.read(session.userId))
      }
      if (path === '/api/auth/quest-codes' && req.method === 'GET') {
        if (!session) throw fail(401, 'Hãy đăng nhập để xem quest đã kích hoạt.')
        return send(200, { items: await codes.list(session.userId) })
      }
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
        if (Buffer.byteLength(body) > (path === '/api/auth/game' ? 4500000 : path==='/api/auth/account'?1450000:8192)) throw fail(413, 'Dữ liệu quá lớn.')
      }
      let input
      try { input = JSON.parse(body) } catch { throw fail(400, 'Dữ liệu không hợp lệ.') }
      if (!input || typeof input !== 'object') throw fail(400, 'Dữ liệu không hợp lệ.')
      if(session&&deleting.has(session.userId))throw fail(409,'Tài khoản đang được xóa. Vui lòng chờ.')
      if(path==='/api/auth/quest-social'&&req.method==='POST'){
        if(input.action==='review'){
          const runs=await questRuns.read(session.userId)
          const legacy=(await game.read(session.userId)).state.destinations[input.questId]
          const legacyComplete=legacy?.started&&legacy.selected.length>=5&&legacy.completed.length>=Math.ceil(legacy.selected.length*.8)
          if(!runs.quests[input.questId]?.completedAt&&!legacyComplete)throw fail(403,'Hoàn thành quest trước khi gửi đánh giá.')
        }
        const user=(await load()).find(item=>item.id===session.userId)
        const profile=await accountFeatures.read(session.userId)
        return send(200,await community.update(session.userId,input,profile.profile.displayName||user.name))
      }
      if(path==='/api/auth/account'&&req.method==='POST')return send(200,await accountFeatures.update(session.userId,input))
      if(path==='/api/auth/event-state'&&req.method==='POST'){
        const value=await accountFeatures.update(session.userId,{...input,kind:'event'})
        return send(200,{events:value.events,enabled:value.preferences.inApp,serverNow:eventClock(),notice:value.eventResult?.notice??null,catalog:eventCatalog(session.userId)})
      }
      if(['/api/auth/password','/api/auth/delete-account'].includes(path)){
        if(!attempts.consume(`sensitive:${session.userId}`,10,60000))throw fail(429,'Bạn đã thử quá nhiều lần. Vui lòng chờ một phút.')
      }
      if(path==='/api/auth/password'&&req.method==='POST'){
        if(typeof input.currentPassword!=='string'||typeof input.newPassword!=='string'||input.newPassword.length<6||input.newPassword.length>128)throw fail(400,'Mật khẩu mới phải từ 6 đến 128 ký tự.')
        await mutate(async users=>{
          const found=users.find(item=>item.id===session.userId)
          if(!found)throw fail(401,'Phiên tài khoản không còn hợp lệ.')
          const old=await derive(input.currentPassword,found.salt,64)
          if(!timingSafeEqual(old,Buffer.from(found.hash,'hex')))throw fail(401,'Mật khẩu hiện tại không đúng.')
          const salt=randomBytes(16).toString('hex');found.hash=(await derive(input.newPassword,salt,64)).toString('hex');found.salt=salt;return found
        })
        for(const [id,value] of sessions)if(value.userId===session.userId&&id!==key)sessions.delete(id)
        return send(200,{ok:true})
      }
      if(path==='/api/auth/delete-account'&&req.method==='POST'){
        if(input.confirmation!=='XÓA TÀI KHOẢN')throw fail(400,'Nhập đúng XÓA TÀI KHOẢN để xác nhận.')
        const user=(await load()).find(item=>item.id===session.userId)
        if(!user||typeof input.password!=='string'||input.password.length>128)throw fail(401,'Mật khẩu không đúng.')
        const hash=await derive(input.password,user.salt,64)
        if(!timingSafeEqual(hash,Buffer.from(user.hash,'hex')))throw fail(401,'Mật khẩu không đúng.')
        if(deleting.has(user.id))throw fail(409,'Tài khoản đang được xóa.')
        deleting.add(user.id)
        try{
          await Promise.all([wallet.remove(user.id),game.remove(user.id),questRuns.remove(user.id),accountFeatures.remove(user.id),codes.removeOwner(user.id),community.removeOwner(user.id)])
          await mutate(users=>{const index=users.findIndex(item=>item.id===user.id);if(index>=0)users.splice(index,1);return user})
          for(const [id,value] of sessions)if(value.userId===user.id)sessions.delete(id)
          setCookie(res,'',secure,0);return send(200,{ok:true})
        }finally{deleting.delete(user.id)}
      }
      if (path === '/api/auth/quest-runs' && req.method === 'POST') return send(200, await questRuns.update(session.userId, input))
      if (path === '/api/auth/quest-codes/redeem' && req.method === 'POST') {
        if (!session) throw fail(401, 'Hãy đăng nhập trước khi kích hoạt mã.')
        if (!attempts.consume(`codes:${session.userId}`,10,60000)) throw fail(429, 'Bạn đã thử quá nhiều mã. Hãy chờ một phút rồi thử lại.')
        return send(200, await codes.redeem(input.code, session.userId))
      }
      if (path === '/api/auth/wallet' && req.method === 'POST') return send(200, await wallet.redeem(session.userId, input.rewardId))
      if (path === '/api/auth/game' && req.method === 'POST') {
        if (input.kind === 'action' && input.action?.type === 'redeem') {
          const value = await wallet.redeem(session.userId, input.action.rewardId)
          const current = await game.read(session.userId)
          return send(200, { ...current, state: { ...current.state, redemptions: value.receipts.map(({ rewardId, redeemedAt }) => ({ rewardId, redeemedAt })) } })
        }
        return send(200, await game.update(session.userId, input))
      }
      if (path === '/api/auth/profile/avatar' && req.method === 'PATCH') {
        if (!session) throw fail(401, 'Chưa đăng nhập.')
        const customAvatar = typeof input.avatarId === 'string' && /^c1\.(m|f)\.(tron|vuong|to|det|xoan)\.(den|xu|haimai|mullet)\.(ngan|dai|coc)\.(dai|ngan)\.[0-4]\.[0-4]\.[0-5]\.[0-4]$/.test(input.avatarId)
        if (!['bien', 'nang', 'rung', 'may'].includes(input.avatarId) && !customAvatar) throw fail(400, 'Nhân vật không hợp lệ.')
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
      const address = clientAddress(req, trustProxy)
      if (!attempts.consume(`ip:${address}`,15,60000)) throw fail(429, 'Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.')
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
        const suppliedIdentifier = input.username || input.name || input.email || ''
        if (typeof suppliedIdentifier !== 'string') throw fail(400, 'Vui lòng nhập tên đăng nhập hoặc email.')
        const identifier = suppliedIdentifier.trim().toLowerCase()
        if (!identifier) throw fail(400, 'Vui lòng nhập tên đăng nhập hoặc email.')
        user = (await load()).find(item => item.name.toLowerCase() === identifier || item.email.toLowerCase() === identifier)
        const finishAttempt = attempts.beginLogin(user ? `account:${user.id}` : `account:missing:${digest(identifier)}`)
        if (!finishAttempt) throw fail(429, 'Bạn đã nhập sai quá nhiều lần. Hãy thử lại sau 15 phút.')
        let valid
        try {
          const hash = await derive(password, user?.salt ?? '00000000000000000000000000000000', 64)
          valid = Boolean(user && timingSafeEqual(hash, Buffer.from(user.hash, 'hex')))
        } catch (error) { finishAttempt(null); throw error }
        finishAttempt(valid)
        if (!valid) throw fail(401, 'Tên đăng nhập / email hoặc mật khẩu không đúng.')
      }
      const newToken = randomBytes(32).toString('hex')
      if(deleting.has(user.id))throw fail(409,'Tài khoản đang được xóa.')
      sessions.delete(key)
      sessions.set(digest(newToken), { userId: user.id, expires: Date.now() + lifetime })
      setCookie(res, newToken, secure)
      send(200, { user: publicUser(user) })
    })().catch(error => send(error.status ?? 500, { code: error.code, message: error.status ? error.message : 'Không thể lưu hoặc đọc tài khoản. Vui lòng thử lại.' }))
  }
}

export const authApi = createAuthApi()
