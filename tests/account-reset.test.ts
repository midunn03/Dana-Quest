import { afterEach, expect, it } from 'vitest'
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAccountData } from '../server/account-data.mjs'

let directory = ''
afterEach(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })

it('refuses to reset healthy data, but backs up and restarts corrupted data', async () => {
  directory = await mkdtemp(join(tmpdir(), 'dana-reset-test-'))
  const game = createAccountData(directory)
  await game.update('user1', { kind: 'action', revision: 0, action: { type: 'assign', destinationId: 'cau-rong', count: 5 } })
  await expect(game.update('user1', { kind: 'reset' })).rejects.toMatchObject({ status: 400 })

  await writeFile(join(directory, 'user1.json'), '{not valid json')
  await expect(game.read('user1')).rejects.toMatchObject({ status: 422 })
  const result = await game.update('user1', { kind: 'reset' })
  expect(result.revision).toBe(0)
  expect(result.state.destinations).toEqual({})
  const files = await readdir(directory)
  expect(files.some(name => name.startsWith('user1.json.corrupt-'))).toBe(true)
  // A fresh journey can start again after the reset.
  const again = await game.update('user1', { kind: 'action', revision: 0, action: { type: 'assign', destinationId: 'cau-rong', count: 6 } })
  expect(again.state.destinations['cau-rong'].selected).toHaveLength(6)
})

it('returns photo metadata by default and full blobs only on request', async () => {
  directory = await mkdtemp(join(tmpdir(), 'dana-photos-test-'))
  const game = createAccountData(directory)
  await game.update('user1', { kind: 'action', revision: 0, action: { type: 'assign', destinationId: 'cau-rong', count: 10 } })
  const data = Buffer.from([255, 216, 255, 224, 0, 0, 255, 217]).toString('base64')
  await game.update('user1', { kind: 'photo', revision: 1, photo: { id: 'cau-rong:overview-photo', destinationId: 'cau-rong', missionId: 'overview-photo', data } })
  const meta = await game.read('user1')
  expect(meta.photos).toHaveLength(1)
  expect(meta.photos[0].data).toBeUndefined()
  expect(meta.photos[0].id).toBe('cau-rong:overview-photo')
  const full = await game.read('user1', 'full')
  expect(full.photos[0].data).toBe(data)
  // Completing another mission must not rewrite the album from its metadata projection.
  await game.update('user1', {kind:'action',revision:2,action:{type:'complete',destinationId:'cau-rong',missionId:'read'}})
  expect((await game.read('user1','full')).photos[0].data).toBe(data)
  await game.update('user1', {kind:'photo',revision:3,photo:{id:'cau-rong:detail-photo',destinationId:'cau-rong',missionId:'detail-photo',data}})
  expect((await game.read('user1','full')).photos.map(photo=>photo.data)).toEqual([data,data])
})

it('keeps full photos when resetting a structurally corrupt progress record',async()=>{
 directory=await mkdtemp(join(tmpdir(),'dana-reset-photos-'))
 const data=Buffer.from([255,216,255,224,0,0,255,217]).toString('base64')
 await writeFile(join(directory,'user1.json'),JSON.stringify({revision:3,state:{version:99},photos:[{id:'cau-rong:overview-photo',destinationId:'cau-rong',missionId:'overview-photo',data}]}))
 const game=createAccountData(directory)
 await game.update('user1',{kind:'reset'})
 expect((await game.read('user1','full')).photos[0].data).toBe(data)
})
it('rejects corrupt nested mission records and allows backed-up recovery',async()=>{
 directory=await mkdtemp(join(tmpdir(),'dana-reset-nested-'))
 const game=createAccountData(directory)
 await writeFile(join(directory,'user1.json'),JSON.stringify({revision:0,state:{version:1,destinations:{'cau-rong':{started:true,selected:['invalid'],completed:[]}},redemptions:[]},photos:[]}))
 await expect(game.read('user1')).rejects.toMatchObject({status:422})
 const restored=await game.update('user1',{kind:'reset'})
 expect(restored.state.destinations).toEqual({})
 expect((await readdir(directory)).some(name=>name.startsWith('user1.json.corrupt-'))).toBe(true)
})
