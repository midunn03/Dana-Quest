// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { getAuthSession, logoutAccount, updateAccountAvatar, updateAccountProfile } from '../src/lib/auth'
import { setSyncAccount } from '../src/lib/accountSync'

afterEach(() => { setSyncAccount(null); vi.unstubAllGlobals() })

it('captures the tab owner for profile, avatar and logout requests', async () => {
  setSyncAccount('alice')
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ user: { id: 'alice', name: 'Alice' } }) }))
  vi.stubGlobal('fetch', fetcher)
  await updateAccountProfile({ name: 'Alice' })
  await updateAccountAvatar('explorer')
  await logoutAccount()
  for (const call of fetcher.mock.calls) {
    const init = (call as unknown as [string, RequestInit])[1]
    expect(new Headers(init.headers).get('X-Dana-User')).toBe('alice')
  }
})

it('rejects a delayed profile response after the tab switches account', async () => {
  setSyncAccount('alice')
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => {
    setSyncAccount('bob')
    return { user: { id: 'alice', name: 'Alice' } }
  } })))
  await expect(updateAccountProfile({ name: 'Alice' })).rejects.toThrow()
})

it('allows session bootstrap before the tab knows its owner', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ user: { id: 'alice', name: 'Alice' } }) })))
  expect((await getAuthSession())?.id).toBe('alice')
})
