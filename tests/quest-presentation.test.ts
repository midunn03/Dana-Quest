import {expect,it} from 'vitest'
import {presentQuest,publishedExperienceCount} from '../src/lib/questPresentation'
import {destinations} from '../src/data/destinations'
import {getQuest} from '../src/data/quests'
it('presents every destination with its two configured story checkpoints',()=>{
 for(const place of destinations){const view=presentQuest(place.id)!;expect(view.checkpoints.map(cp=>cp.id)).toEqual(getQuest(place.id)!.checkpoints.map(cp=>cp.id));expect(view.startPosition).toEqual(place.position);expect(view.checkpoints).toHaveLength(2)}
 expect(publishedExperienceCount()).toBe(destinations.length+1)
})
it('honors admin description overrides including intentionally empty text',()=>{
 const custom={description:'',detail:'Chi tiết từ quản trị',highlight:'',activities:[],hours:'09:00',hoursNote:'',tip:'',address:'Địa chỉ quản trị',photos:[]}
 const view=presentQuest('cau-rong',custom)!
 expect(view.summary).toBe('');expect(view.area).toBe('Địa chỉ quản trị')
})
