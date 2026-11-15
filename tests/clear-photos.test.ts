import {expect,it} from 'vitest'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createAccountData} from '../server/account-data.mjs'
it('clears photos only after explicit confirmation for the selected owner and preserves progress',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'dana-clear-photos-'));try{
 const store=createAccountData(directory)
 for(const owner of ['one','two']){let data=await store.update(owner,{kind:'action',revision:0,action:{type:'assign',destinationId:'cau-rong',count:10}});await store.update(owner,{kind:'photo',revision:data.revision,photo:{id:'cau-rong:overview-photo',destinationId:'cau-rong',missionId:'overview-photo',data:'/9j/AA=='}})}
 const before=await store.read('one','full');expect(before.photos).toHaveLength(1)
 await expect(store.update('one',{kind:'clear-photos',revision:before.revision})).rejects.toMatchObject({status:400})
 await store.update('one',{kind:'clear-photos',revision:before.revision,confirmation:'XÓA ẢNH CŨ'})
 const after=await store.read('one','full');expect(after.photos).toEqual([]);expect(after.state).toEqual(before.state);expect((await store.read('two','full')).photos).toHaveLength(1)
 }finally{await rm(directory,{recursive:true,force:true})}
})
