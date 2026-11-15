import { afterEach, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createQuestRuns } from '../server/quest-runs.mjs'
let directory=''
afterEach(async()=>{if(directory)await rm(directory,{recursive:true,force:true})})
it('persists story/challenge/feedback, validates answers, pauses and grants rewards once per owner',async()=>{
 directory=await mkdtemp(join(tmpdir(),'dana-run-'))
 const runs=createQuestRuns(directory)
 const questId='due-dau-an-50-nam'
 const change=(type:string,extra={})=>runs.update('owner-a',{type,questId,...extra})
 await change('start')
 await expect(change('continue-story')).rejects.toThrow('xác nhận đã đến')
 await expect(change('complete-checkpoint',{checkpointId:'cong-71',answer:'71'})).rejects.toThrow('xác nhận đã đến')
 expect((await runs.read('owner-a')).quests[questId].completedCheckpointIds).toEqual([])
 await change('confirm-arrival')
 const confirmed=(await runs.read('owner-a')).quests[questId].arrivalConfirmedAt
 await change('confirm-arrival')
 expect((await runs.read('owner-a')).quests[questId].arrivalConfirmedAt).toBe(confirmed)
 expect((await runs.read('owner-a')).quests[questId].completedCheckpointIds).toEqual([])
 expect((await runs.read('owner-a')).quests[questId].phase).toBe('story')
 await change('continue-story')
 await expect(change('complete-checkpoint',{checkpointId:'cong-71',answer:'72'})).rejects.toThrow('chưa chính xác')
 await change('complete-checkpoint',{checkpointId:'cong-71',answer:'71'})
 expect((await createQuestRuns(directory).read('owner-a')).quests[questId].phase).toBe('feedback')
 await change('complete-checkpoint',{checkpointId:'cong-71',answer:'71'})
 expect((await runs.read('owner-a')).quests[questId].completedCheckpointIds).toEqual(['cong-71'])
 await expect(change('complete-checkpoint',{checkpointId:'dau-moc-1975',answer:'1975'})).rejects.toThrow()
 await change('advance');await change('pause')
 await expect(change('continue-story')).rejects.toThrow('tạm dừng')
 await change('resume');await change('continue-story')
 await change('complete-checkpoint',{checkpointId:'dau-moc-1975',answer:'1975'})
 await change('advance')
 for(const [checkpointId,answer] of [['sap-xep-ky-uc',JSON.stringify(['1975','2000','2015','2025'])],['ghep-dau-moc',JSON.stringify([['2000','25'],['2025','50'],['1975','0'],['2015','40']])],['mat-thu-tong-ket',JSON.stringify(['address','start','25','40','50'])]]){await change('continue-story');await change('complete-checkpoint',{checkpointId,answer});await change('advance')}
 const completed=(await runs.read('owner-a')).quests[questId]
 expect(completed.phase).toBe('results');expect(completed.completedCheckpointIds).toHaveLength(5)
 expect((await runs.read('owner-b')).quests).toEqual({})
 await change('start');expect((await runs.read('owner-a')).quests[questId]).toEqual(completed)
})
