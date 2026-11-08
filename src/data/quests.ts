import englishQuestRecords from '../i18n/questContent.en.json'
import {getLocale} from '../i18n/locale'
import questRecords from './questCatalog.json'

export type QuestChallenge =
  | { type: 'text'; prompt: string; acceptedAnswers: string[]; placeholder?: string }
  | { type: 'single-choice'; prompt: string; options: { id: string; label: string }[]; correctOptionId: string }
  | { type: 'photo'; prompt: string }
  | { type: 'observation'; prompt: string; confirmationLabel: string }
  | { type:'ordering';prompt:string;items:{id:string;label:string}[];correctOrder:string[] }
  | { type:'matching';prompt:string;pairs:{id:string;label:string;correctOptionId:string}[];options:{id:string;label:string}[] }
  | { type:'multi-select';prompt:string;options:{id:string;label:string}[];correctOptionIds:string[] }

export interface QuestCheckpoint {
  id: string
  title: string
  story: string
  instruction: string
  placeLabel: string
  position?: [number, number]
  challenge: QuestChallenge
  reward: { xp: number; coins: number }
  sourceUrls: string[]
  hint?:string
  feedback?:string
}

export interface Quest {
  id: string
  title: string
  summary: string
  city: 'Đà Nẵng'
  area: string
  startPosition: [number, number]
  estimatedMinutes: number
  catalogVersion?:number
  ending?:string
  nextQuestId?:string
  safetyNote: string
  checkpointOrder: string[]
  checkpoints: QuestCheckpoint[]
}

// Resolve by the stable catalog ID on every read; gameplay IDs and answer contracts stay untouched.
const englishById=new Map((englishQuestRecords as Quest[]).map(quest=>[quest.id,quest]))
export const quests:Quest[]=new Proxy(questRecords as Quest[],{get(target,key,receiver){
 if(typeof key==='string'&&/^\d+$/.test(key)){const quest=target[Number(key)];return getLocale()==='en'&&quest?englishById.get(quest.id)??quest:quest}
 return Reflect.get(target,key,receiver)
}})

export const getQuest = (id: string) => quests.find(quest => quest.id === id)

