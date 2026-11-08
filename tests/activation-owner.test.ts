// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { loadActivatedQuests, redeemQuestCode } from '../src/lib/activation'
import { setSyncAccount } from '../src/lib/accountSync'

afterEach(() => { setSyncAccount(null); vi.unstubAllGlobals() })

it('binds activation reads and writes to the captured tab owner', async () => {
  setSyncAccount('alice')
  const fetcher=vi.fn(async (_url: string, init: RequestInit) => {
    expect(new Headers(init.headers).get('X-Dana-User')).toBe('alice')
    return {ok:true,json:async()=>init.method==='POST'?{questId:'quest',redeemedAt:1}:{items:[]}}
  })
  vi.stubGlobal('fetch',fetcher)
  await loadActivatedQuests()
  await redeemQuestCode('synthetic')
  expect(fetcher).toHaveBeenCalledTimes(2)
})

it.each(['read','redeem'])('rejects a stale activation %s response',async mode=>{
  setSyncAccount('alice')
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>{
    setSyncAccount('bob')
    return mode==='read'?{items:[]}:{questId:'quest',redeemedAt:1}
  }})))
  await expect(mode==='read'?loadActivatedQuests():redeemQuestCode('synthetic')).rejects.toThrow()
})
