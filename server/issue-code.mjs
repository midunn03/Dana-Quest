// Local owner command only. No HTTP issuance endpoint exists.
import { resolve } from 'node:path'
import { createActivationStore, activationQuestIds } from './activation-store.mjs'
const [questId, days='30'] = process.argv.slice(2)
if(!activationQuestIds.includes(questId) || !/^\d+$/.test(days) || Number(days)<1 || Number(days)>365) {
  console.error('Dùng: npm run codes:create -- <quest-id> [số ngày hiệu lực 1..365]')
  console.error('Quest có thể cấp mã:',activationQuestIds.join(', '))
  process.exitCode=1
} else {
  const result=await createActivationStore(resolve('.data/quest-codes.json')).issue(questId,Date.now()+Number(days)*86400000)
  console.log(JSON.stringify(result,null,2))
}
