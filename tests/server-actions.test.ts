import { expect, it } from 'vitest'
import { applyGameAction } from '../server/game-logic.mjs'

const fresh = () => ({ version: 1, destinations: {}, redemptions: [] })
const assigned = (count = 5) => applyGameAction(fresh(), { type: 'assign', destinationId: 'cau-rong', count }, [])
const nearDragonBridge = { latitude: 16.0611042, longitude: 108.2276926, accuracy: 10, timestamp: Date.now() }

it('assigns a random unique mission list within 5-10 and never reassigns', () => {
  const state = assigned(7)
  const progress = state.destinations['cau-rong']
  expect(progress.started).toBe(true)
  expect(progress.selected).toHaveLength(7)
  expect(new Set(progress.selected).size).toBe(7)
  expect(applyGameAction(state, { type: 'assign', destinationId: 'cau-rong', count: 7 }, [])).toBe(state)
  expect(() => applyGameAction(fresh(), { type: 'assign', destinationId: 'cau-rong', count: 4 }, [])).toThrow('5 đến 10')
  expect(() => applyGameAction(fresh(), { type: 'assign', destinationId: 'cau-rong', count: 11 }, [])).toThrow('5 đến 10')
  expect(() => applyGameAction(fresh(), { type: 'assign', destinationId: 'unknown-place', count: 5 }, [])).toThrow('Không tìm thấy địa điểm')
})

it('validates completion preconditions instead of trusting the client', () => {
  const state = assigned(10) // all missions selected, deterministic
  expect(() => applyGameAction(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'no-such-mission' }, [])).toThrow('không tồn tại')
  expect(() => applyGameAction(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'arrival' }, [])).toThrow('Vị trí')
  expect(() => applyGameAction(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'arrival', location: { ...nearDragonBridge, accuracy: 500 } }, [])).toThrow('Vị trí')
  expect(() => applyGameAction(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'arrival', location: { ...nearDragonBridge, timestamp: Date.now() - 120_000 } }, [])).toThrow('Vị trí')
  const arrived = applyGameAction(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'arrival', location: nearDragonBridge }, [])
  expect(arrived.destinations['cau-rong'].completed).toContain('arrival')
})

it('requires an uploaded photo before completing a photo mission', () => {
  const state = assigned(10)
  expect(() => applyGameAction(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'overview-photo' }, [])).toThrow('Hãy lưu ảnh')
  const photos = [{ id: 'cau-rong:overview-photo', destinationId: 'cau-rong', missionId: 'overview-photo', createdAt: Date.now() }]
  const done = applyGameAction(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'overview-photo' }, photos)
  expect(done.destinations['cau-rong'].completed).toContain('overview-photo')
})

it('completes self missions once and cancels only untouched journeys', () => {
  const state = assigned(10) // all missions selected, deterministic
  const done = applyGameAction(state, { type: 'complete', destinationId: 'cau-rong', missionId: 'read' }, [])
  expect(done.destinations['cau-rong'].completed).toEqual(['read'])
  expect(applyGameAction(done, { type: 'complete', destinationId: 'cau-rong', missionId: 'read' }, [])).toBe(done)
  expect(() => applyGameAction(done, { type: 'cancel', destinationId: 'cau-rong' }, [])).toThrow('Không thể hủy')
  const cancelled = applyGameAction(state, { type: 'cancel', destinationId: 'cau-rong' }, [])
  expect(cancelled.destinations['cau-rong']).toBeUndefined()
  expect(applyGameAction(fresh(), { type: 'cancel', destinationId: 'cau-rong' }, [])).toEqual(fresh())
})

it('redeems vouchers only with enough coins and only once', () => {
  const state = assigned(10)
  expect(() => applyGameAction(state, { type: 'redeem', rewardId: 'postcard' }, [])).toThrow('Chưa đủ')
  expect(() => applyGameAction(state, { type: 'redeem', rewardId: 'no-such-reward' }, [])).toThrow('Không tìm thấy voucher')
  for (const rewardId of ['constructor','toString','__proto__']) {
    expect(() => applyGameAction(state,{type:'redeem',rewardId},[])).toThrow('Không tìm thấy voucher')
  }
  let rich = state
  for (const missionId of state.destinations['cau-rong'].selected.slice(0, 8)) {
    const photos = missionId.endsWith('photo') ? [{ id: `cau-rong:${missionId}`, destinationId: 'cau-rong', missionId, createdAt: Date.now() }] : []
    rich = applyGameAction(rich, { type: 'complete', destinationId: 'cau-rong', missionId, location: missionId === 'arrival' ? nearDragonBridge : undefined }, photos)
  }
  const redeemed = applyGameAction(rich, { type: 'redeem', rewardId: 'postcard' }, [])
  expect(redeemed.redemptions).toHaveLength(1)
  expect(() => applyGameAction(redeemed, { type: 'redeem', rewardId: 'postcard' }, [])).toThrow('đã đổi')
  expect(() => applyGameAction(rich, { type: 'whatever' }, [])).toThrow('Thao tác không hợp lệ')
})
