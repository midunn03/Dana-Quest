import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createBadgeStore } from '../server/badges.mjs'
import { createWallet } from '../server/wallet.mjs'

describe('Badge collection system (server/badges.mjs)', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'badges-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {})
  })

  it('evaluates unlocked badges, theme completion, and awards coins into wallet', async () => {
    const badgesDir = join(tempDir, 'badges')
    const walletDir = join(tempDir, 'wallets')

    let visited: string[] = []

    const store = createBadgeStore(badgesDir, {
      readGame: async () => ({
        state: {
          destinations: Object.fromEntries(visited.map((id) => [id, { started: true, completed: ['arrival'] }])),
          redemptions: [],
        },
      }),
      readQuests: async () => ({ quests: {}, legacy: { destinations: {} } }),
    })

    // Initial check: 0 unlocked
    const initial = await store.read('player-1')
    expect(initial.totalUnlocked).toBe(0)
    expect(initial.claims.length).toBe(0)

    // Player visits Cầu Rồng
    visited.push('cau-rong')
    const step1 = await store.evaluate('player-1')
    expect(step1.totalUnlocked).toBe(1)
    expect(step1.newlyUnlocked.some((u) => u.id === 'cau-rong')).toBe(true)

    // Player visits all other 3 bridges in "cau-da-nang" theme
    visited.push('cau-song-han', 'cau-thuan-phuoc', 'cau-tran-thi-ly')
    const step2 = await store.evaluate('player-1')

    const bridgeTheme = step2.themes.find((t) => t.slug === 'cau-da-nang')
    expect(bridgeTheme).toBeDefined()
    expect(bridgeTheme?.completed).toBe(true)
    expect(bridgeTheme?.unlockedCount).toBe(4)
    expect(bridgeTheme?.totalCount).toBe(4)

    // Theme completion bonus should be awarded
    expect(step2.newlyUnlocked.some((u) => u.type === 'theme' && u.slug === 'cau-da-nang')).toBe(true)

    // Check wallet reconciliation
    const wallet = createWallet(walletDir, {
      readGame: async () => ({ state: { destinations: {}, redemptions: [] } }),
      readQuests: async () => ({ quests: {}, legacy: { destinations: {} } }),
      readBadgeClaims: async (owner) => store.read(owner),
    })

    const w = await wallet.read('player-1')
    // 15 + 15 + 25 + 25 = 80 (badges) + 50 (theme bonus) = 130
    expect(w.balance).toBe(130)

    // Repeated evaluate does not duplicate
    const step3 = await store.evaluate('player-1')
    expect(step3.newlyUnlocked.length).toBe(0)
    const w2 = await wallet.read('player-1')
    expect(w2.balance).toBe(130)
  })
})
