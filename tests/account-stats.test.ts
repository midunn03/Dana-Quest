// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { accountStats } from '../src/lib/accountStats'
import { newState, updateProgress } from '../src/lib/progress'
import { newQuestState, updateQuestProgress } from '../src/lib/questProgress'
import { clearQuestCache } from '../src/lib/accountFeatures'
it('keeps quest XP/coins separate from legacy coins and derives stamps only from completion',()=>{
 const questId='due-dau-an-50-nam'
 let state=updateQuestProgress(newQuestState(),{type:'start',questId})
 state=updateQuestProgress(state,{type:'complete-checkpoint',questId,checkpointId:'cong-71',answer:'71'})
 let legacy=updateProgress(newState(),{type:'assign',destinationId:'cau-rong',count:10})
 legacy=updateProgress(legacy,{type:'complete',destinationId:'cau-rong',missionId:'read'})
 expect(accountStats(legacy,state)).toMatchObject({xp:50,questCoins:10,missions:1,stamps:0})
 state=updateQuestProgress(state,{type:'complete-checkpoint',questId,checkpointId:'dau-moc-1975',answer:'1975'})
 expect(accountStats(legacy,state)).toMatchObject({xp:120,questCoins:20,completedQuests:0,stamps:0,cities:0})
})
it('clears only app shell caches, not other app caches or saved progress',async()=>{
 const remove=vi.fn(async()=>true)
 vi.stubGlobal('caches',{keys:async()=>['dana-quest-shell-v1','other-private-cache'],delete:remove})
 localStorage.setItem('dana-quest-progress-v2','keep')
 expect(await clearQuestCache()).toBe(1)
 expect(remove).toHaveBeenCalledExactlyOnceWith('dana-quest-shell-v1')
 expect(localStorage.getItem('dana-quest-progress-v2')).toBe('keep')
 vi.unstubAllGlobals();localStorage.clear()
})
