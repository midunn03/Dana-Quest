import {expect,it} from 'vitest'
import {quests,getQuest} from '../src/data/quests'
import {destinations} from '../src/data/destinations'
import {isChallengeCorrect,migrateCatalogRun} from '../shared/quest-challenges.mjs'
it('has two playable checkpoints per destination and five distinct DUE challenge types',()=>{
 expect(quests).toHaveLength(destinations.length+1)
 expect(quests.filter(q=>q.id!=='due-dau-an-50-nam').every(q=>q.checkpoints.length===2)).toBe(true)
 expect(getQuest('due-dau-an-50-nam')!.checkpoints).toHaveLength(5)
 expect(new Set(getQuest('due-dau-an-50-nam')!.checkpoints.map(c=>c.challenge.type)).size).toBe(5)
})
it('validates order, matching and multiple choice without accepting partial or duplicate answers',()=>{
 for(const cp of getQuest('due-dau-an-50-nam')!.checkpoints.slice(2)){
  const c=cp.challenge as any,answer=c.type==='ordering'?JSON.stringify(c.correctOrder):c.type==='matching'?JSON.stringify(c.pairs.map((p:any)=>[p.id,p.correctOptionId])):JSON.stringify(c.correctOptionIds)
  expect(isChallengeCorrect(c,answer)).toBe(true);expect(isChallengeCorrect(c,'[]')).toBe(false);expect(isChallengeCorrect(c,'{broken')).toBe(false)
  if(c.type==='multi-select')expect(isChallengeCorrect(c,JSON.stringify([...c.correctOptionIds,c.correctOptionIds[0]]))).toBe(false)
 }
})
it('upgrades completed two-checkpoint DUE saves without resetting checkpoints or awarding them twice',()=>{
 const old={startedAt:1,completedCheckpointIds:['cong-71','dau-moc-1975'],completedAtByCheckpoint:{'cong-71':2,'dau-moc-1975':3},completedAt:3,phase:'results'}
 const migrated=migrateCatalogRun('due-dau-an-50-nam',old)
 expect(migrated.completedCheckpointIds).toEqual(old.completedCheckpointIds);expect(migrated.completedAtByCheckpoint).toEqual(old.completedAtByCheckpoint);expect(migrated.completedAt).toBeUndefined();expect(migrated.phase).toBe('story');expect(migrateCatalogRun('due-dau-an-50-nam',migrated)).toEqual(migrated)
})
it('migrates a stored server save from the old completed DUE version and keeps its earned checkpoints',async()=>{
 const {createQuestRuns}=await import('../server/quest-runs.mjs'),{mkdtemp,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path')
 const dir=await mkdtemp(join(tmpdir(),'dana-catalog-upgrade-'));try{
 const state={version:2,legacy:{version:1,destinations:{},redemptions:[]},quests:{'due-dau-an-50-nam':{startedAt:1,phase:'results',completedCheckpointIds:['cong-71','dau-moc-1975'],completedAtByCheckpoint:{'cong-71':2,'dau-moc-1975':3},completedAt:3}}}
 await writeFile(join(dir,'fixture.json'),JSON.stringify(state))
 const read=await createQuestRuns(dir).read('fixture');expect(read.quests['due-dau-an-50-nam'].completedCheckpointIds).toEqual(['cong-71','dau-moc-1975']);expect(read.quests['due-dau-an-50-nam'].previousCompletionAt).toBe(3);expect(read.quests['due-dau-an-50-nam'].completedAt).toBeUndefined()
 }finally{await rm(dir,{recursive:true,force:true})}
})
