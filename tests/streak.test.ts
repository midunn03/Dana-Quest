import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStreakStore, getVietnamDateKey, getPreviousDayKey } from '../server/streak.mjs'
import { createWallet } from '../server/wallet.mjs'

describe('Streak system (server/streak.mjs)', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'streak-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {})
  })

  it('computes Vietnam date keys correctly', () => {
    const key = getVietnamDateKey(Date.UTC(2026, 10, 15, 12, 0, 0))
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(getPreviousDayKey('2026-11-15')).toBe('2026-11-14')
    expect(getPreviousDayKey('2026-03-01')).toBe('2026-02-28')
  })

  it('increments streak across consecutive days and awards milestone coins to wallet', async () => {
    const streakDir = join(tempDir, 'streaks')
    const walletDir = join(tempDir, 'wallets')
    const store = createStreakStore(streakDir)

    const baseTime = Date.UTC(2026, 10, 10, 10, 0, 0) // Day 1
    const oneDay = 24 * 60 * 60 * 1000

    // Day 1
    const r1 = await store.recordActivity('user-1', baseTime)
    expect(r1.currentStreak).toBe(1)
    expect(r1.longestStreak).toBe(1)
    expect(r1.newlyClaimed.length).toBe(0)

    // Repeat on Day 1 does nothing
    const r1Repeat = await store.recordActivity('user-1', baseTime + 1000)
    expect(r1Repeat.currentStreak).toBe(1)

    // Day 2
    const r2 = await store.recordActivity('user-1', baseTime + oneDay)
    expect(r2.currentStreak).toBe(2)
    expect(r2.longestStreak).toBe(2)

    // Day 3 -> Hits 3-day milestone (+15 coins)
    const r3 = await store.recordActivity('user-1', baseTime + 2 * oneDay)
    expect(r3.currentStreak).toBe(3)
    expect(r3.newlyClaimed.length).toBe(1)
    expect(r3.newlyClaimed[0].days).toBe(3)
    expect(r3.newlyClaimed[0].bonusCoins).toBe(15)

    // Check wallet reconciliation
    const wallet = createWallet(walletDir, {
      readGame: async () => ({ state: { destinations: {}, redemptions: [] } }),
      readQuests: async () => ({ quests: {}, legacy: { destinations: {} } }),
      readStreakClaims: async (owner) => store.read(owner),
    })

    const w = await wallet.read('user-1')
    expect(w.balance).toBe(15)
    expect(w.entries.some((e: any) => e.source === 'streak:3:cycle-1' && e.amount === 15)).toBe(true)

    // Skip a day (Day 5 instead of Day 4) -> streak resets to 1
    const r5 = await store.recordActivity('user-1', baseTime + 4 * oneDay)
    expect(r5.currentStreak).toBe(1)
    expect(r5.longestStreak).toBe(3) // longest retained
  })
})
