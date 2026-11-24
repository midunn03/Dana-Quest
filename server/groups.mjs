import {readFile,writeFile,mkdir,rename} from './db-storage.mjs'
import {dirname} from 'node:path'
import {randomBytes} from 'node:crypto'

const fail=(status,message)=>Object.assign(new Error(message),{status})

// Same friend-group operations as the Django service, bound to the local
// account service's identities. One writer and atomic replacements, as for auth.
export function createGroupStore(file,{readMember}) {
  let queue=Promise.resolve()
  async function read() {
    try {
      const value=JSON.parse(await readFile(file,'utf8'))
      if(value?.version!==1||!Array.isArray(value.groups)||!Number.isSafeInteger(value.nextId)||value.groups.some(group=>!Number.isSafeInteger(group.id)||typeof group.name!=='string'||typeof group.code!=='string'||!Array.isArray(group.members)||!group.members.length||group.members.some(id=>typeof id!=='string')||!group.members.includes(group.leader)))throw Error('invalid')
      return value
    } catch(error) {
      if(error.code==='ENOENT')return {version:1,nextId:1,groups:[]}
      throw fail(422,'Chưa đọc được dữ liệu nhóm. Dữ liệu cũ được giữ nguyên.')
    }
  }
  function serial(action) {const task=queue.then(action);queue=task.catch(()=>{});return task}
  async function save(value) {await mkdir(dirname(file),{recursive:true});await writeFile(`${file}.tmp`,JSON.stringify(value),{mode:0o600});await rename(`${file}.tmp`,file)}
  return {
    list:owner=>serial(async()=>{
      const value=await read(),groups=[]
      for(const group of value.groups.filter(group=>group.members.includes(owner))) {
        const leaderboard=[]
        for(const id of group.members) {
          const member=await readMember(id)
          if(member)leaderboard.push({userId:id,displayName:member.displayName,avatarId:member.avatarId,score:member.score,isLeader:id===group.leader,isSelf:id===owner})
        }
        leaderboard.sort((a,b)=>b.score-a.score||a.userId.localeCompare(b.userId))
        groups.push({id:group.id,name:group.name,code:group.code,isLeader:group.leader===owner,optIn:true,memberCount:group.members.length,leaderboard:leaderboard.map((member,index)=>({...member,rank:index+1}))})
      }
      return {groups}
    }),
    update:(owner,action,input)=>serial(async()=>{
      const value=await read()
      let result={success:true}
      if(action==='create') {
        const name=typeof input.name==='string'?input.name.trim():''
        if(name.length<2||name.length>80)throw fail(400,'Tên nhóm phải từ 2 đến 80 ký tự.')
        let code
        do{code=`DANA-${randomBytes(3).toString('hex').toUpperCase()}`}while(value.groups.some(group=>group.code===code))
        const group={id:value.nextId++,name,code,leader:owner,members:[owner],createdAt:Date.now()}
        value.groups.push(group);result={success:true,groupId:group.id,name,code}
      } else if(action==='join') {
        const code=typeof input.code==='string'?input.code.trim().toUpperCase():''
        const group=value.groups.find(group=>group.code===code)
        if(!group)throw fail(404,'Mã nhóm không tồn tại.')
        if(group.members.includes(owner))throw fail(409,'Bạn đã ở trong nhóm này rồi.')
        group.members.push(owner);result={success:true,groupId:group.id,name:group.name}
      } else if(action==='leave') {
        const group=value.groups.find(group=>group.id===input.groupId&&group.members.includes(owner))
        if(!group)throw fail(404,'Bạn không thuộc nhóm này.')
        group.members=group.members.filter(id=>id!==owner)
        if(!group.members.length)value.groups=value.groups.filter(item=>item!==group)
        else if(group.leader===owner)group.leader=group.members[0]
      } else throw fail(400,'Thao tác nhóm không hợp lệ.')
      await save(value);return result
    }),
    removeOwner:owner=>serial(async()=>{
      const value=await read()
      for(const group of value.groups){group.members=group.members.filter(id=>id!==owner);if(group.leader===owner)group.leader=group.members[0]}
      value.groups=value.groups.filter(group=>group.members.length)
      await save(value)
    }),
  }
}
