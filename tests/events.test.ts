import { describe, expect, it } from 'vitest'
import { cityEvents, nextEventOccurrence } from '../src/data/events'

describe('Da Nang event schedule', () => {
  it('schedules the next Dragon Bridge show only on Friday, Saturday or Sunday at 21:00', () => {
    const event = cityEvents.find(item => item.id === 'cau-rong-phun-lua')!
    const next = nextEventOccurrence(event, new Date('2026-10-21T10:00:00+07:00'))!
    expect(next.getDay()).toBe(5)
    expect(next.getHours()).toBe(21)
    expect(next.getMinutes()).toBe(0)
  })
  it('keeps dated events attributable and does not invent reminder times', () => {
    expect(cityEvents.every(event => event.sourceUrl.startsWith('https://'))).toBe(true)
    expect(cityEvents.filter(event => event.startAt).every(event => event.reminderMinutes === undefined)).toBe(true)
  })
})
