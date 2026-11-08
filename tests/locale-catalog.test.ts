import {afterEach,expect,it} from 'vitest'
import {getQuest,quests} from '../src/data/quests'
import viCatalog from '../src/data/questCatalog.json'
import enCatalog from '../src/i18n/questContent.en.json'
import {setLocale} from '../src/i18n/locale'
afterEach(()=>setLocale('vi'))
it('switches all sixteen authored journeys without changing IDs, answers, options or rewards',()=>{
 setLocale('vi');expect(quests).toHaveLength(16);expect(getQuest(viCatalog[0].id)?.title).toBe(viCatalog[0].title)
 setLocale('en');expect(getQuest(enCatalog[0].id)?.title).toBe(enCatalog[0].title)
 expect(quests.map(q=>q.id)).toEqual(viCatalog.map(q=>q.id))
 for(const source of viCatalog){const translated=getQuest(source.id)!;expect(translated.checkpointOrder).toEqual(source.checkpointOrder);expect(translated.checkpoints.map(c=>c.id)).toEqual(source.checkpoints.map(c=>c.id));expect(translated.ending).toBeTruthy();for(const cp of source.checkpoints){const en=translated.checkpoints.find(c=>c.id===cp.id)!;expect(en.reward).toEqual(cp.reward);for(const key of ['acceptedAnswers','correctOptionId','correctOptionIds','correctOrder'])expect((en.challenge as unknown as Record<string,unknown>)[key]).toEqual((cp.challenge as unknown as Record<string,unknown>)[key])}}
 setLocale('vi');expect(getQuest(viCatalog[0].id)?.title).toBe(viCatalog[0].title)
})
