// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { setSyncAccount, loadAccountProgress, saveAccountAction, loadAccountPhotos } from '../src/lib/accountSync'
import { newState } from '../src/lib/progress'

afterEach(() => { setSyncAccount(null); vi.unstubAllGlobals() })
it('sends progress actions to the server and retries a revision conflict without reassigning missions', async () => {
  setSyncAccount('alice')
  const selected = ['read', 'observe', 'walk', 'respect', 'green']
  let state = newState()
  let writes = 0
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => {
    expect(init.headers['X-Dana-User']).toBe('alice')
    if (init.method === 'POST') {
      writes++
      const body = JSON.parse(init.body)
      expect(body.kind).toBe('action')
      expect(body.action).toEqual({ type: 'assign', destinationId: 'cau-rong', count: 5 })
      // The server applies the action exactly once; the first response is lost
      // as a 409 conflict, and the retry must not assign a second time.
      if (writes === 1) {
        state = { ...state, destinations: { 'cau-rong': { started: true, selected, completed: [] } } }
        return { ok: false, status: 409, json: async () => ({ message: 'conflict' }) }
      }
    }
    return { ok: true, json: async () => ({ revision: writes, state, photos: [] }) }
  }))
  const result = await saveAccountAction({ type: 'assign', destinationId: 'cau-rong', count: 5 })
  expect(result.destinations['cau-rong'].started).toBe(true)
  expect(result.destinations['cau-rong'].selected).toEqual(selected)
  expect(writes).toBe(2)
  expect(await loadAccountProgress()).toEqual(state)
})
it('does not use local data or show another account data after a session error', async () => {
  setSyncAccount('bob')
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ message: 'Phiên đã hết hạn.' }) })))
  await expect(loadAccountProgress()).rejects.toThrow('Phiên đã hết hạn')
  await expect(loadAccountPhotos()).rejects.toThrow('Phiên đã hết hạn')
})
it('rejects a response still in flight when the account changes', async () => {
  setSyncAccount('alice')
  vi.stubGlobal('fetch', vi.fn(async () => {
    setSyncAccount('bob')
    return { ok: true, json: async () => ({ revision: 0, state: newState(), photos: [] }) }
  }))
  await expect(loadAccountProgress()).rejects.toThrow('Tài khoản đã thay đổi')
})
