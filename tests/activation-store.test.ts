import { afterEach, expect, it } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createActivationStore } from '../server/activation-store.mjs'
let directory = ''
afterEach(async () => { if (directory) await rm(directory, { recursive:true, force:true }) })
it('issues real codes, hashes them, redeems once per owner and persists entitlement', async () => {
  directory = await mkdtemp(join(tmpdir(),'dana-codes-'))
  const file = join(directory,'codes.json')
  const store = createActivationStore(file)
  const issued = await store.issue('due-dau-an-50-nam', Date.now()+60000)
  expect(await readFile(file,'utf8')).not.toContain(issued.code)
  const result = await store.redeem(issued.code.toLowerCase(), 'owner-a')
  expect(result.questId).toBe('due-dau-an-50-nam')
  expect(await store.redeem(issued.code,'owner-a')).toEqual(result)
  await expect(store.redeem(issued.code,'owner-b')).rejects.toThrow('đã được sử dụng')
  expect(await createActivationStore(file).list('owner-a')).toHaveLength(1)
  expect(await store.list('owner-b')).toHaveLength(0)
  await expect(store.issue('unknown',Date.now()+60000)).rejects.toThrow()
  const expired = await store.issue('cau-rong',Date.now()+10)
  await new Promise(resolve => setTimeout(resolve,20))
  await expect(store.redeem(expired.code,'owner-a')).rejects.toThrow('hết hạn')
  const concurrent = await store.issue('cau-rong',Date.now()+60000)
  const results = await Promise.allSettled([store.redeem(concurrent.code,'owner-a'),createActivationStore(file).redeem(concurrent.code,'owner-b')])
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1)
})
