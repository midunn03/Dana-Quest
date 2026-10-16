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
})
