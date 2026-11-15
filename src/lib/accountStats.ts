import { quests } from '../data/quests'
import { isDestinationComplete } from './rules'
import type { ProgressState } from './progress'
import type { QuestProgressState } from './questProgress'
export function accountStats(legacy:ProgressState,state:QuestProgressState){
 let xp=0,questCoins=0,completedQuests=0
 for(const quest of quests){const run=state.quests[quest.id];if(!run)continue
  for(const checkpoint of quest.checkpoints)if(run.completedCheckpointIds.includes(checkpoint.id)){xp+=checkpoint.reward.xp;questCoins+=checkpoint.reward.coins}
  if(run.completedAt)completedQuests++
 }
 const visited=new Set(Object.entries(legacy.destinations).filter(([,value])=>value.completed.includes('arrival')).map(([id])=>id))
 for(const [id,run] of Object.entries(state.quests))if(run.arrivalConfirmedAt)visited.add(id)
 const visits=visited.size
 const missions=Object.values(legacy.destinations).reduce((sum,value)=>sum+value.completed.length,0)
 const previousQuestStamps=Object.values(state.quests).filter(run=>run.previousCompletionAt&&!run.completedAt).length
 const stamps=completedQuests+previousQuestStamps+Object.values(legacy.destinations).filter(isDestinationComplete).length
 const tier=xp>=5000?'Explorer':xp>=2000?'Seeker':'Rookie'
 const next=xp>=5000?null:xp>=2000?5000:2000
 return {xp,questCoins,completedQuests,visits,missions,stamps,cities:stamps?1:0,tier,next}
}
