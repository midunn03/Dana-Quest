import { describe, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BUS_GIFTCODES as SERVER_GIFTCODES, createTransitClaims, normalizeBusGiftcode } from '../server/transit.mjs'
import { createWallet } from '../server/wallet.mjs'

describe('Server DanaBus Giftcodes (6 codes/route = 48 codes, 1x per account) & Minigame Wallet Accounting', () => {
  it('defines 6 giftcodes per route (48 total) across all 8 Da Nang routes and parses plain & QR URL codes', () => {
    const keys = Object.keys(SERVER_GIFTCODES)
    expect(keys).toHaveLength(48)
    for (const routeCode of ['02', '03', '05', '06', '07', '08', '11', '12']) {
      const perRoute = keys.filter(code => SERVER_GIFTCODES[code].routeCode === routeCode)
      expect(perRoute).toHaveLength(6)
      expect(perRoute.sort()).toEqual([
        `DANABUS${routeCode}`,
        `DANABUS${routeCode}A`,
        `DANABUS${routeCode}B`,
        `DANABUS${routeCode}C`,
        `DANABUS${routeCode}D`,
        `DANABUS${routeCode}E`,
      ])
    }
    expect(normalizeBusGiftcode('  danabus06  ')).toBe('DANABUS06')
    expect(normalizeBusGiftcode('  danabus05b  ')).toBe('DANABUS05B')
    expect(normalizeBusGiftcode('https://dana-quest-demo.onrender.com/?buscode=danabus03c')).toBe('DANABUS03C')
  })

  it('allows redeeming multiple distinct giftcodes on the same route for testing while blocking duplicates per account', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dq-bus-gift-'))
    try {
      const transit = createTransitClaims(join(dir, 'transit'))
      const wallet = createWallet(join(dir, 'wallet'), {
        readGame: async () => ({ state: { destinations: {}, redemptions: [] } }),
        readQuests: async () => ({ legacy: { destinations: {}, redemptions: [] }, quests: {} }),
        readTransitClaims: transit.read,
      })

      // Account u1 redeems two distinct codes on Route 06 (DANABUS06 + DANABUS06A) and one on Route 03 (DANABUS03B)
      const c1 = await transit.redeemGiftcode('u1', { code: 'danabus06', now: 1_700_000_000_000 })
      expect(c1.amount).toBe(15)
      const c1b = await transit.redeemGiftcode('u1', { code: 'DANABUS06A', now: 1_700_000_000_500 })
      expect(c1b.amount).toBe(15)
      const c2 = await transit.redeemGiftcode('u1', { code: 'https://dana-quest.app/?buscode=DANABUS03B', now: 1_700_000_001_000 })
      expect(c2.amount).toBe(20)

      // Account u1 tries DANABUS06 or DANABUS06A again -> blocked with 409
      await expect(transit.redeemGiftcode('u1', { code: 'DANABUS06' })).rejects.toMatchObject({
        code: 'GIFTCODE_ALREADY_REDEEMED',
        status: 409,
      })
      await expect(transit.redeemGiftcode('u1', { code: 'DANABUS06A' })).rejects.toMatchObject({
        code: 'GIFTCODE_ALREADY_REDEEMED',
        status: 409,
      })

      // Account u2 can still redeem DANABUS06 once
      const cOther = await transit.redeemGiftcode('u2', { code: 'DANABUS06', now: 1_700_000_002_000 })
      expect(cOther.amount).toBe(15)

      // Invalid giftcode fails cleanly
      await expect(transit.redeemGiftcode('u1', { code: 'FAKECODE' })).rejects.toMatchObject({
        code: 'INVALID_GIFTCODE',
        status: 404,
      })

      // Minigame reward (+10) requires score >= 3 and only once per route per day
      await expect(transit.claimMinigame('u1', { routeCode: '06', score: 2, total: 5 })).rejects.toMatchObject({
        code: 'SCORE_TOO_LOW',
        status: 400,
      })
      const mg = await transit.claimMinigame('u1', { routeCode: '06', score: 4, total: 5, now: 1_700_000_003_000 })
      expect(mg.amount).toBe(10)
      await expect(transit.claimMinigame('u1', { routeCode: '06', score: 5, total: 5, now: 1_700_000_004_000 })).rejects.toMatchObject({
        code: 'MINIGAME_ALREADY_CLAIMED',
        status: 409,
      })

      // Server wallet reconciles all credits: 15 + 15 + 20 + 10 = 60 Xu for u1, 15 Xu for u2
      const w1 = await wallet.read('u1')
      const w2 = await wallet.read('u2')
      expect(w1.status).toBe('ready')
      expect(w1.balance).toBe(60)
      expect(w2.balance).toBe(15)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
