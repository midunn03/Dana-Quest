import { t } from '../i18n/locale'
import {getQuest,quests,type Quest} from '../data/quests'
import {getDestination,destinations} from '../data/destinations'
import {getMissions} from '../data/missions'
import type {AdminContent} from './placeContent'
export function presentQuest(id:string,custom?:AdminContent):Quest|undefined{
 const quest=getQuest(id);if(quest)return custom?{...quest,summary:custom.description,area:custom.address||quest.area,safetyNote:custom.tip||quest.safetyNote}:quest
 const place=getDestination(id);if(!place)return undefined
 const missions=getMissions(place)
 return {id,title:place.name,summary:custom?custom.description:place.description,city:'Đà Nẵng',area:custom?.address||place.location,startPosition:place.position,estimatedMinutes:0,safetyNote:custom?.tip||t("Đi bộ ở lối an toàn, mang nước và giữ gìn không gian chung."),checkpointOrder:missions.map(m=>m.id),checkpoints:missions.map(m=>({id:m.id,title:m.title,story:m.description,instruction:m.description,placeLabel:place.name,challenge:{type:'observation',prompt:m.description,confirmationLabel:t("Tôi đã thực hiện")},reward:{xp:0,coins:0},sourceUrls:[place.sourceUrl]}))}
}
export const publishedExperienceCount=()=>quests.length+destinations.filter(place=>!getQuest(place.id)).length
