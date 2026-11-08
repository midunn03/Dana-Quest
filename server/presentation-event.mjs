/** Operator-only local CLI. There is deliberately no HTTP mutation endpoint. */
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises'
import {resolve,dirname} from 'node:path'
import {createPresentationEvent} from './presentation-events.mjs'
const args=process.argv.slice(2),value=name=>{const index=args.indexOf(name);return index<0?undefined:args[index+1]}
if(args.includes('--help')||!value('--owner')){
 console.log('Usage: node server/presentation-event.mjs --owner ACCOUNT_ID --scenario invite|reminder\nRequires DANA_PRESENTATION_EVENTS=1 on the app server. Reminder requires the player to save attendance. Normal cooldown and quest blocking remain active.');process.exit(args.includes('--help')?0:1)
}
const file=resolve(value('--accounts')||'.data/accounts.json'),owner=value('--owner'),scenario=value('--scenario')||'invite'
const accounts=JSON.parse(await readFile(file,'utf8'))
if(!Array.isArray(accounts)||!accounts.some(account=>account.id===owner))throw Error('Account not found. Use the ID of an existing presentation account.')
const target=resolve(dirname(file),'presentation-events.json'),now=Date.now()
let stored={version:1,records:[]}
try{stored=JSON.parse(await readFile(target,'utf8'))}catch(error){if(error.code!=='ENOENT')throw error}
if(stored.version!==1||!Array.isArray(stored.records))throw Error('Invalid event file. Existing data left unchanged.')
// Keep one current scenario per account. Other accounts and their decisions are untouched.
const record=createPresentationEvent(owner,scenario,now)
stored.records=stored.records.filter(item=>item.owner!==owner&&item.expiresAt>now);stored.records.push(record)
await mkdir(dirname(target),{recursive:true});await writeFile(`${target}.tmp`,JSON.stringify(stored,null,2),{mode:0o600});await rename(`${target}.tmp`,target)
console.log(JSON.stringify({eventId:record.event.id,owner,scenario,startAt:record.event.startAt,expiresAt:new Date(record.expiresAt).toISOString(),next:scenario==='reminder'?'Open Events, save attendance, then allow the normal reminder policy to run.':'Open Discover or Events outside an active quest. A recent notice may require waiting for the five-minute cooldown.'},null,2))
