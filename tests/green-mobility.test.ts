import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { evaluateGpsTrack, createGreenMobilityStore } from '../server/green-mobility.mjs'
import { createWallet } from '../server/wallet.mjs'

describe('Green Mobility & GPS track evaluation (server/green-mobility.mjs)', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mobility-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {})
  })

  it('rejects simulated tracks and filters inaccurate or jump points', () => {
    const p1 = { lat: 16.061, lng: 108.227, timestamp: 1000, accuracy: 10 }
    const p2 = { lat: 16.062, lng: 108.228, timestamp: 120000, accuracy: 10 }

    // Simulated rejection
    const simRes = evaluateGpsTrack([p1, p2], { isSimulated: true })
    expect(simRes.valid).toBe(false)
    expect(simRes.reason).toBe('SIMULATION_BLOCKED')

    // Inaccurate point (>40m) is dropped
    const pInaccurate = { lat: 16.065, lng: 108.235, timestamp: 60000, accuracy: 80 }
    const cleanRes = evaluateGpsTrack([p1, pInaccurate, p2], { isSimulated: false })
    expect(cleanRes.valid).toBe(true)
    expect(cleanRes.totalMeters).toBeGreaterThan(50)

    // Teleport jump (e.g. 10km in 2 seconds) is dropped
    const pJump = { lat: 16.150, lng: 108.350, timestamp: 3000, accuracy: 10 }
    const jumpRes = evaluateGpsTrack([p1, pJump], { isSimulated: false })
    expect(jumpRes.totalMeters).toBe(0)
  })

  it('calculates walking and cycling distance and awards coins respecting daily cap', async () => {
    const mobDir = join(tempDir, 'mobility')
    const walletDir = join(tempDir, 'wallets')
    const store = createGreenMobilityStore(mobDir, { dailyCap: 20 })

    // Build ~1 km walk path (lat: 16.060 -> 16.069, ~1000m, 800s => ~4.5 km/h)
    const points = []
    const start = 1700000000000
    for (let i = 0; i <= 10; i++) {
      points.push({
        lat: 16.060 + i * 0.0009,
        lng: 108.220,
        timestamp: start + i * 80000,
        accuracy: 10,
      })
    }

    const res = await store.recordTrackSession('walker-1', {
      points,
      isSimulated: false,
      destinationIds: ['cau-rong'],
    })

    expect(res.success).toBe(true)
    expect(res.evaluation.modes.walk).toBeGreaterThan(800)
    expect(res.coinsAwarded).toBeGreaterThan(0) // walk gives ~5 coins per km

    // Reconcile with wallet
    const wallet = createWallet(walletDir, {
      readGame: async () => ({ state: { destinations: {}, redemptions: [] } }),
      readQuests: async () => ({ quests: {}, legacy: { destinations: {} } }),
      readGreenMobilityClaims: async (owner) => store.read(owner),
    })

    const w = await wallet.read('walker-1')
    expect(w.balance).toBe(res.coinsAwarded)
  })
})
