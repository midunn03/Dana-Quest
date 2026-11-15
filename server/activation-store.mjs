import { randomBytes, createHash } from 'node:crypto'
import { mkdir, open, readFile, writeFile, rename, unlink } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname } from 'node:path'

const catalog = [...JSON.parse(readFileSync(new URL('../src/data/destinations.json', import.meta.url),'utf8')), ...JSON.parse(readFileSync(new URL('../src/data/questLocations.json', import.meta.url),'utf8'))]
export const activationQuestIds = catalog.map(item=>item.id)
const fail = (status,message)=>Object.assign(new Error(message),{status})
const normalize = code => typeof code === 'string' ? code.replace(/[\s-]/g,'').toUpperCase() : ''
const hash = code => createHash('sha256').update(code).digest('hex')

export function createActivationStore(file) {
  async function read() {
    try { const data=JSON.parse(await readFile(file,'utf8')); if(!Array.isArray(data)) throw new Error('Kho mã không hợp lệ.'); return data }
    catch(error) { if(error.code==='ENOENT') return []; throw error }
  }
  async function transaction(action) {
    await mkdir(dirname(file),{recursive:true})
    let lock
    for(let attempt=0;attempt<100;attempt++) {
      try { lock=await open(`${file}.lock`,'wx'); break }
      catch(error) { if(error.code!=='EEXIST') throw error; await new Promise(resolve=>setTimeout(resolve,25)) }
    }
    if(!lock) throw fail(503,'Kho mã đang bận. Vui lòng thử lại.')
    try {
      const records=await read(); const result=action(records)
      await writeFile(`${file}.tmp`,JSON.stringify(records),{mode:0o600})
      await rename(`${file}.tmp`,file)
      return result
    } finally { await lock.close(); await unlink(`${file}.lock`) }
  }
  return {
    async issue(questId,expiresAt) {
      if(!activationQuestIds.includes(questId) || !Number.isFinite(expiresAt) || expiresAt<=Date.now()) throw fail(400,'Quest hoặc hạn sử dụng không hợp lệ.')
      const code=`DQ${randomBytes(12).toString('hex').toUpperCase()}`
      return transaction(records=>{records.push({hash:hash(code),questId,expiresAt,createdAt:Date.now()});return {code,questId,expiresAt}})
    },
    async redeem(input,userId) {
      const code=normalize(input)
      if(!userId || !/^DQ[A-F0-9]{24}$/.test(code)) throw fail(400,'Mã không hợp lệ. Hãy kiểm tra mã Dana Quest đã nhận.')
      return transaction(records=>{
        const record=records.find(item=>item.hash===hash(code))
        if(!record) throw fail(400,'Không tìm thấy mã Dana Quest này.')
        if(record.revoked) throw fail(410,'Mã đã bị thu hồi và không thể sử dụng lại.')
        if(record.userId && record.userId!==userId) throw fail(409,'Mã đã được sử dụng bởi một tài khoản khác.')
        if(!record.userId && record.expiresAt<=Date.now()) throw fail(410,'Mã đã hết hạn sử dụng.')
        if(!record.userId) {record.userId=userId;record.redeemedAt=Date.now()}
        return {questId:record.questId,redeemedAt:record.redeemedAt}
      })
    },
    async list(userId) { return (await read()).filter(item=>item.userId===userId).map(item=>({questId:item.questId,redeemedAt:item.redeemedAt})) },
    async removeOwner(userId){return transaction(records=>{for(const item of records)if(item.userId===userId){delete item.userId;delete item.redeemedAt;item.revoked=true}})},
  }
}
