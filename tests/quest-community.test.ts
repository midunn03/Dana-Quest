import {expect,it} from 'vitest'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createQuestCommunity} from '../server/quest-community.mjs'
it('persists favorites/follows privately, counts once, validates reviews and removes only one owner',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'dana-community-'))
 try{const store=createQuestCommunity(join(directory,'community.json'))
 await store.update('one',{action:'favorite',questId:'due-dau-an-50-nam',enabled:true})
 await store.update('one',{action:'follow',creatorId:'dana-quest-studio',enabled:true})
 await store.update('one',{action:'follow',creatorId:'dana-quest-studio',enabled:true})
 expect((await store.public('due-dau-an-50-nam')).followers).toBe(1)
 expect((await store.private('two')).favorites).toEqual([])
 await expect(store.update('one',{action:'review',questId:'due-dau-an-50-nam',rating:6,comment:'good'},'Public name')).rejects.toMatchObject({status:400})
 await store.update('one',{action:'review',questId:'due-dau-an-50-nam',rating:4,comment:'Một hành trình thú vị.'},'Public name')
 await store.update('two',{action:'review',questId:'due-dau-an-50-nam',rating:5,comment:'Tôi đã chơi thử.'},'Second')
 const data=await store.public('due-dau-an-50-nam');expect(data.rating).toBe(4.5);expect(data.reviews).toHaveLength(2);expect(JSON.stringify(data)).not.toContain('"one"')
 await store.removeOwner('one');expect((await store.public('due-dau-an-50-nam')).reviews).toHaveLength(1);expect((await store.public('due-dau-an-50-nam')).followers).toBe(0)
 }finally{await rm(directory,{recursive:true,force:true})}
})
