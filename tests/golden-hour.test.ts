import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createGoldenHourStore } from '../server/golden-hour.mjs'
import { createWallet } from '../server/wallet.mjs'

describe('Golden Hour challenge system (server/golden-hour.mjs)', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'golden-hour-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {})
  })

  it('rejects simulated locations and inaccurate GPS', async () => {
    const store = createGoldenHourStore(join(tempDir, 'golden-hours'))

    // Simulated rejection
    await expect(
      store.claim('user-1', {
        challengeId: 'cau-rong-fire',
        latitude: 16.061,
        longitude: 108.227,
        accuracy: 10,
        isSimulated: true,
      })
    ).rejects.toMatchObject({ code: 'SIMULATION_BLOCKED' })

    // Accuracy > 50m rejection
    await expect(
      store.claim('user-1', {
        challengeId: 'cau-rong-fire',
        latitude: 16.061,
        longitude: 108.227,
        accuracy: 80,
        isSimulated: false,
      })
    ).rejects.toMatchObject({ code: 'ACCURACY_INSUFFICIENT' })
  })

  it('verifies time window and awards bonus coins into wallet', async () => {
    const ghDir = join(tempDir, 'golden-hours')
    const walletDir = join(tempDir, 'wallets')
    const store = createGoldenHourStore(ghDir)

    // Saturday night 21:00 Vietnam time (UTC 14:00) on 2026-11-21
    const saturday2100 = Date.UTC(2026, 10, 21, 14, 0, 0)
    // Wednesday 14:00 Vietnam time on 2026-11-18
    const wednesday1400 = Date.UTC(2026, 10, 18, 7, 0, 0)

    // Outside time window -> NOT_IN_GOLDEN_HOUR
    await expect(
      store.claim(
        'user-1',
        {
          challengeId: 'cau-rong-fire',
          latitude: 16.061,
          longitude: 108.227,
          accuracy: 15,
          isSimulated: false,
        },
        wednesday1400
      )
    ).rejects.toMatchObject({ code: 'NOT_IN_GOLDEN_HOUR' })

    // Inside time window, valid coords -> Success (+20 coins)
    const claim = await store.claim(
      'user-1',
      {
        challengeId: 'cau-rong-fire',
        latitude: 16.061,
        longitude: 108.227,
        accuracy: 15,
        isSimulated: false,
      },
      saturday2100
    )

    expect(claim.amount).toBe(20)
    expect(claim.challengeId).toBe('cau-rong-fire')

    // Check wallet reconciliation
    const wallet = createWallet(walletDir, {
      readGame: async () => ({ state: { destinations: {}, redemptions: [] } }),
      readQuests: async () => ({ quests: {}, legacy: { destinations: {} } }),
      readGoldenHourClaims: async (owner) => store.read(owner, saturday2100),
    })

    const w = await wallet.read('user-1')
    expect(w.balance).toBe(20)

    // Cannot claim twice on same day
    await expect(
      store.claim(
        'user-1',
        {
          challengeId: 'cau-rong-fire',
          latitude: 16.061,
          longitude: 108.227,
          accuracy: 15,
          isSimulated: false,
        },
        saturday2100
      )
    ).rejects.toMatchObject({ code: 'ALREADY_CLAIMED' })
  })
})
