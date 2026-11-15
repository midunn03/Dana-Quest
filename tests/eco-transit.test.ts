// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  claimTransitReward,
  hasClaimedTransitToday,
  getNearbyGreenTransit,
  getTodayDateKey,
} from '../src/lib/ecoTransit'
import type { GreenTransitStation } from '../src/data/greenTransit'

const mockStation: GreenTransitStation = {
  id: 'tngo-test-station',
  name: 'Trạm TNGo Test',
  type: 'bike',
  position: [16.0600, 108.2200],
  address: 'Bạch Đằng, Đà Nẵng',
  bonusCoins: 5,
  verified: true,
}

describe('ecoTransit client logic', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects claim when simulating', async () => {
    const res = await claimTransitReward({
      station: mockStation,
      sample: { latitude: 16.0600, longitude: 108.2200, accuracy: 10 },
      dwellSeconds: 65,
      simulating: true,
    })
    expect(res.success).toBe(false)
    expect(res.code).toBe('SIMULATION_BLOCKED')
  })

  it('rejects claim when GPS sample is missing', async () => {
    const res = await claimTransitReward({
      station: mockStation,
      sample: null,
      dwellSeconds: 65,
      simulating: false,
    })
    expect(res.success).toBe(false)
    expect(res.code).toBe('NO_GPS')
  })

  it('rejects claim when accuracy > 50m', async () => {
    const res = await claimTransitReward({
      station: mockStation,
      sample: { latitude: 16.0600, longitude: 108.2200, accuracy: 75 },
      dwellSeconds: 65,
      simulating: false,
    })
    expect(res.success).toBe(false)
    expect(res.code).toBe('ACCURACY_TOO_LOW')
  })

  it('rejects claim when distance > 80m', async () => {
    const res = await claimTransitReward({
      station: mockStation,
      sample: { latitude: 16.0700, longitude: 108.2200, accuracy: 10 }, // ~1.1km away
      dwellSeconds: 65,
      simulating: false,
    })
    expect(res.success).toBe(false)
    expect(res.code).toBe('TOO_FAR')
  })

  it('rejects claim when dwellSeconds < 60', async () => {
    const res = await claimTransitReward({
      station: mockStation,
      sample: { latitude: 16.0600, longitude: 108.2200, accuracy: 10 },
      dwellSeconds: 45,
      simulating: false,
    })
    expect(res.success).toBe(false)
    expect(res.code).toBe('DWELL_TOO_SHORT')
  })

  it('successful claim calls API, updates local cache and dispatches dana-wallet-updated', async () => {
    const walletListener = vi.fn()
    window.addEventListener('dana-wallet-updated', walletListener)

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, bonusCoins: 5, balance: 15 }),
      })
    )

    const res = await claimTransitReward({
      station: mockStation,
      sample: { latitude: 16.0600, longitude: 108.2200, accuracy: 10 },
      dwellSeconds: 65,
      simulating: false,
    })

    expect(res.success).toBe(true)
    expect(walletListener).toHaveBeenCalledTimes(1)
    expect(hasClaimedTransitToday(mockStation.id)).toBe(true)

    // Nhận lại cùng ngày sẽ bị chặn bởi client cache
    const res2 = await claimTransitReward({
      station: mockStation,
      sample: { latitude: 16.0600, longitude: 108.2200, accuracy: 10 },
      dwellSeconds: 70,
      simulating: false,
    })
    expect(res2.success).toBe(false)
    expect(res2.code).toBe('ALREADY_CLAIMED_TODAY')

    window.removeEventListener('dana-wallet-updated', walletListener)
  })

  it('getNearbyGreenTransit filters unverified stations', () => {
    const testStations: GreenTransitStation[] = [
      { id: 'v1', name: 'Trạm 1', type: 'bike', position: [16.06, 108.22], address: '', bonusCoins: 5, verified: true },
      { id: 'unv', name: 'Trạm Chưa Xác Minh', type: 'bike', position: [16.06, 108.22], address: '', bonusCoins: 5, verified: false },
    ]
    const nearby = getNearbyGreenTransit([16.06, 108.22], 100, testStations)
    expect(nearby).toHaveLength(1)
    expect(nearby[0].station.id).toBe('v1')
  })
})
