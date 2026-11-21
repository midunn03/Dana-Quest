// @vitest-environment jsdom
import {afterEach, expect, it} from 'vitest'
import {setSyncAccount} from '../src/lib/accountSync'
import {getCachedStreak, saveCachedStreak} from '../src/lib/streak'
import {getRecordedTrack, saveRecordedTrack} from '../src/lib/journeyTrack'
import {hasClaimedTransitToday, claimTransitReward} from '../src/lib/ecoTransit'
import {vi} from 'vitest'
afterEach(()=>{setSyncAccount(null);localStorage.clear();vi.unstubAllGlobals()})
it('does not show another account streak or recorded journey',()=>{
  setSyncAccount('a')
  saveCachedStreak({currentStreak:7,longestStreak:7,lastActiveDate:'2026-11-20',todayActive:true,claimedMilestones:[],milestones:[]})
  saveRecordedTrack([{lat:16.06,lng:108.22,timestamp:1000}])
  setSyncAccount('b')
  expect(getCachedStreak()).toBeNull()
  expect(getRecordedTrack()).toEqual([])
  setSyncAccount('a')
  expect(getCachedStreak()?.currentStreak).toBe(7)
  expect(getRecordedTrack()).toHaveLength(1)
})
it('does not block account B from claiming a transit reward claimed by account A',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({success:true,balance:5})}))
  setSyncAccount('a')
  const station={id:'tngo-bao-tang-cham',name:'Trạm',type:'bike' as const,position:[16.0598,108.223] as [number,number],address:'Đà Nẵng',bonusCoins:5,verified:true}
  expect((await claimTransitReward({station,sample:{latitude:16.0598,longitude:108.223,accuracy:10},dwellSeconds:60})).success).toBe(true)
  setSyncAccount('b')
  expect(hasClaimedTransitToday(station.id)).toBe(false)
})
