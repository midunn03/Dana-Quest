import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {randomUUID} from 'node:crypto'
const catalog=JSON.parse(readFileSync(new URL('../src/data/questCatalog.json',import.meta.url),'utf8'))
export const rewardCosts={postcard:30,drink:50,souvenir:80,'local-food':70,transport:100,admission:150,'outdoor-activity':140}
const fail=(code,status=409)=>Object.assign(new Error(code),{status,code})
const blocked=(receipts=[],reason='SOURCE_INVALID')=>({version:1,status:'reconciliation-required',reason,balance:null,entries:[],receipts})
// The local API runs as one Node process. Every reconciliation/debit uses this
// queue and an atomic rename; never run several server writers on this directory.
export function createWallet(directory,{readGame,readQuests,readSourceBackup=async()=>null}) {
 let queue=Promise.resolve()
 const filename=owner=>{if(typeof owner!=='string'||!/^[-\w]{1,80}$/.test(owner))throw fail('WALLET_OWNER',400);return join(directory,`${owner}.json`)}
 const serial=action=>{const task=queue.then(action);queue=task.catch(()=>{});return task}
 async function save(owner,value){await mkdir(directory,{recursive:true});await writeFile(`${filename(owner)}.tmp`,JSON.stringify(value),{mode:0o600});await rename(`${filename(owner)}.tmp`,filename(owner))}
 async function reconcile(owner){
  let wallet
  try{wallet=JSON.parse(await readFile(filename(owner),'utf8'))}catch(cause){if(cause.code!=='ENOENT')return blocked([], 'LEDGER_INVALID')}
  if(wallet&& (wallet.version!==1||wallet.owner!==owner||!Array.isArray(wallet.entries)||!Array.isArray(wallet.receipts)||new Set(wallet.entries.map(e=>e?.source)).size!==wallet.entries.length||wallet.entries.some(e=>!e||typeof e.source!=='string'||!Number.isSafeInteger(e.amount)||!Number.isFinite(e.at))||wallet.receipts.some(r=>!r||r.owner!==owner||!Object.hasOwn(rewardCosts,r.rewardId)||!Number.isFinite(r.redeemedAt))||new Set(wallet.receipts.map(r=>r?.rewardId)).size!==wallet.receipts.length))return blocked(Array.isArray(wallet?.receipts)?wallet.receipts.filter(r=>r&&typeof r.rewardId==='string'&&Number.isFinite(r.redeemedAt)).map(({id,rewardId,redeemedAt})=>({id,rewardId,redeemedAt})):[], 'LEDGER_INVALID')
  let game,quests
  try{game=await readGame(owner);quests=await readQuests(owner)}catch{const backup=await readSourceBackup(owner).catch(()=>null);return blocked(wallet?.receipts??backup?.game?.state?.redemptions??[], 'SOURCE_INVALID')}
  const receipts=wallet?.receipts??[]
  try{
   const credits=new Map()
   const add=(source,amount,at)=>{if(!Number.isSafeInteger(amount)||amount<0)throw fail('SOURCE_INVALID');credits.set(source,{source,amount,at:Number.isFinite(at)?at:0})}
   const legacy=game.state
   // Embedded legacy is a historical copy, never a second pool of earnings.
   const copy=quests.legacy
   for(const [id,progress]of Object.entries(copy?.destinations??{}))for(const mission of progress.completed??[])if(!legacy.destinations[id]?.completed?.includes(mission))throw fail('LEGACY_OVERLAP_UNRESOLVED')
   for(const [id,progress]of Object.entries(legacy.destinations))for(const mission of progress.completed)add(`legacy:${id}:${mission}`,10,progress.completedAt?.[mission])
   for(const [id,run]of Object.entries(quests.quests)){
    const quest=catalog.find(q=>q.id===id);if(!quest)throw fail('QUEST_UNKNOWN')
    for(const checkpointId of run.completedCheckpointIds){const cp=quest.checkpoints.find(c=>c.id===checkpointId);if(!cp)throw fail('CHECKPOINT_UNKNOWN');add(`quest:${id}:${checkpointId}`,cp.reward.coins,run.completedAtByCheckpoint[checkpointId])}
   }
   for(const item of copy?.redemptions??[])if(!(legacy.redemptions??[]).some(r=>r.rewardId===item.rewardId&&r.redeemedAt===item.redeemedAt))throw fail('LEGACY_OVERLAP_UNRESOLVED')
   const entries=wallet?[...wallet.entries]:[]
   for(const credit of credits.values()){const old=entries.find(e=>e.source===credit.source);if(old&&old.amount!==credit.amount)throw fail('SOURCE_AMOUNT_CHANGED');if(!old)entries.push(credit)}
   // Once awarded, source disappearance must be reconciled, never reset away.
   if(entries.some(e=>e.amount>0&&!credits.has(e.source)))throw fail('SOURCE_DISAPPEARED')
   for(const item of legacy.redemptions??[]){if(!Object.hasOwn(rewardCosts,item.rewardId)||!Number.isFinite(item.redeemedAt))throw fail('RECEIPT_INVALID');if(!receipts.some(r=>r.rewardId===item.rewardId)){receipts.push({id:`legacy:${item.rewardId}`,owner,rewardId:item.rewardId,redeemedAt:item.redeemedAt,status:'collected',kind:'digital-keepsake'});entries.push({source:`redeem:${item.rewardId}`,amount:-rewardCosts[item.rewardId],at:item.redeemedAt})}}
   if(receipts.some(r=>entries.filter(e=>e.source===`redeem:${r.rewardId}`&&e.amount===-rewardCosts[r.rewardId]).length!==1)||entries.some(e=>e.amount<0&&!receipts.some(r=>e.source===`redeem:${r.rewardId}`)))throw fail('RECEIPT_LEDGER_MISMATCH')
   const balance=entries.reduce((sum,e)=>sum+e.amount,0);if(!Number.isSafeInteger(balance)||balance<0)throw fail('SPEND_EXCEEDS_VERIFIED_EARNINGS')
   const next={version:1,migrationVersion:1,owner,status:'ready',balance,entries,receipts}
   if(!wallet){await mkdir(directory,{recursive:true});await writeFile(`${filename(owner)}.migration-v1-backup`,JSON.stringify({game,quests,original:await readSourceBackup(owner)}),{mode:0o600,flag:'wx'}).catch(cause=>{if(cause.code!=='EEXIST')throw cause})}
   if(JSON.stringify(next)!==JSON.stringify(wallet))await save(owner,next)
   return next
  }catch(cause){return blocked(receipts,cause.code??'SOURCE_INVALID')}
 }
 return {read:owner=>serial(()=>reconcile(owner)),redeem:(owner,rewardId)=>serial(async()=>{
  if(typeof rewardId!=='string'||!Object.hasOwn(rewardCosts,rewardId))throw fail('WALLET_REWARD_UNKNOWN',400)
  const wallet=await reconcile(owner);if(wallet.status!=='ready')throw fail('WALLET_RECONCILIATION')
  if(wallet.receipts.some(r=>r.rewardId===rewardId))return wallet
  const cost=rewardCosts[rewardId];if(wallet.balance<cost)throw fail('WALLET_INSUFFICIENT',400)
  const at=Date.now();wallet.entries.push({source:`redeem:${rewardId}`,amount:-cost,at});wallet.receipts.push({id:randomUUID(),owner,rewardId,redeemedAt:at,status:'collected',kind:'digital-keepsake'});wallet.balance-=cost;await save(owner,wallet);return wallet
 }),remove:owner=>serial(async()=>{for(const suffix of ['', '.tmp','.migration-v1-backup'])await unlink(`${filename(owner)}${suffix}`).catch(cause=>{if(cause.code!=='ENOENT')throw cause})})}
}
