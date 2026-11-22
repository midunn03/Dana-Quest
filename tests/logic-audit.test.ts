// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createGoldenHourStore } from '../server/golden-hour.mjs'
import { evaluateGpsTrack, createGreenMobilityStore } from '../server/green-mobility.mjs'
import { recordTrackPoint, getRecordedTrack, trimTrack } from '../src/lib/journeyTrack'
import { readState, CorruptStateError } from '../src/lib/progress'
import { createTransitClaims } from '../server/transit.mjs'
import { createBadgeStore } from '../server/badges.mjs'
import {validRoute, type WalkingRoute} from '../src/lib/routing'

const directories: string[] = []
afterEach(async () => { localStorage.clear(); await Promise.all(directories.splice(0).map(path => rm(path, {recursive: true, force: true}))) })
async function directory() { const path = await mkdtemp(join(tmpdir(), 'dana-logic-audit-')); directories.push(path); return path }

it('does not award golden-hour coins for missing coordinates or negative accuracy', async () => {
  const store = createGoldenHourStore(await directory())
  const now = Date.UTC(2026, 10, 21, 14)
  await expect(store.claim('a', {challengeId:'cau-rong-fire', accuracy:10}, now)).rejects.toMatchObject({status:400})
  await expect(store.claim('a', {challengeId:'cau-rong-fire', latitude:16.061, longitude:108.227, accuracy:-10}, now)).rejects.toMatchObject({status:400})
  expect((await store.read('a', now)).claims).toHaveLength(0)
})

it('does not count GPS points with missing, equal or reversed timestamps as walking', () => {
  const first = {lat:16.06, lng:108.22, timestamp:10000, accuracy:10}
  for (const timestamp of [undefined, 10000, 9000]) {
    expect(evaluateGpsTrack([first, {lat:16.069, lng:108.22, timestamp, accuracy:10}]).totalMeters).toBe(0)
  }
})

it('rejects malformed GPS coordinates without producing NaN distances', () => {
  const points = [{lat:16.06, lng:108.22, timestamp:1000, accuracy:10}, {lat:NaN, lng:108.22, timestamp:120000, accuracy:10}]
  expect(evaluateGpsTrack(points).totalMeters).toBe(0)
})

it('credits a submitted journey only once across retries and server restart', async () => {
  const path = await directory()
  const points = [{lat:16.06, lng:108.22, timestamp:1000, accuracy:10}, {lat:16.069, lng:108.22, timestamp:801000, accuracy:10}]
  const store = createGreenMobilityStore(path)
  const first = await store.recordTrackSession('a', {points})
  expect(first.coinsAwarded).toBeGreaterThan(0)
  await Promise.all([store.recordTrackSession('a', {points}), store.recordTrackSession('a', {points})])
  const restarted = createGreenMobilityStore(path)
  await restarted.recordTrackSession('a', {points})
  expect((await restarted.read('a')).claims).toHaveLength(1)
  const extended=await restarted.recordTrackSession('a',{points:[...points,{lat:16.078,lng:108.22,timestamp:1601000,accuracy:10}]})
  expect(extended.evaluation.totalMeters).toBeGreaterThan(900)
  expect(extended.coinsAwarded).toBe(first.coinsAwarded)
})

it('records only finite locations and increasing GPS timestamps on the device', () => {
  expect(recordTrackPoint({latitude:16.06, longitude:108.22, accuracy:10, timestamp:10000})).toBe(true)
  expect(recordTrackPoint({latitude:16.069, longitude:108.22, accuracy:10, timestamp:10000})).toBe(false)
  expect(recordTrackPoint({latitude:NaN, longitude:108.22, accuracy:10, timestamp:120000})).toBe(false)
  expect(getRecordedTrack()).toHaveLength(1)
})

it('hides all points when the journey fits inside its privacy zones', () => {
  const points = [0, 1, 2, 3].map(i => ({lat:16.06+i*0.0001, lng:108.22, timestamp:i*10000}))
  expect(trimTrack(points, 200)).toEqual([])
  expect(trimTrack(points.slice(0,2), 200)).toEqual([])
  expect(trimTrack(points, 0)).toEqual(points)
})

it('reports malformed saved progress as recoverable corruption', () => {
  expect(() => readState({version:1, destinations:[], redemptions:[]})).toThrow(CorruptStateError)
  expect(() => readState({version:1, destinations:{'cau-rong':{started:true,selected:[],completed:null,completedAt:{read:1}}},redemptions:[]})).toThrow(CorruptStateError)
})

it('rejects impossible GPS accuracy at transit stations', async () => {
  const store = createTransitClaims(await directory())
  await expect(store.claim('a', {stationId:'tngo-bao-tang-cham',coordinates:[16.0598,108.223],accuracy:-10,dwellSeconds:60})).rejects.toMatchObject({status:400})
})

it('does not award a visit badge just for assigning missions and recognizes the active beach id', async () => {
  const destinations:Record<string,{started:boolean;completed:string[]}>={'cau-rong':{started:true,completed:[]}}
  const store=createBadgeStore(await directory(),{readGame:async()=>({state:{destinations}}),readQuests:async()=>({quests:{}})})
  expect((await store.evaluate('a')).totalUnlocked).toBe(0)
  destinations['bai-bien-my-khe']={started:true,completed:['arrival']}
  const result=await store.evaluate('a')
  expect(result.themes.flatMap(theme=>theme.badges).find(badge=>badge.id==='my-khe')?.unlocked).toBe(true)
})

it('rejects malformed routing responses without crashing the navigation screen',()=>{
  const route={distance:10,duration:10,geometry:{coordinates:[null,[108.22,16.06]]},legs:[{steps:[{maneuver:{location:[108.22,16.06]}}]}]}
  expect(()=>validRoute(route as unknown as WalkingRoute)).not.toThrow()
  expect(validRoute(route as unknown as WalkingRoute)).toBe(false)
  route.geometry.coordinates=[[108.22,16.06],[108.23,16.06]]
  expect(validRoute(route as unknown as WalkingRoute)).toBe(false)
})
