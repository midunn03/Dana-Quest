// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { getQuest } from '../src/data/quests'
import { getDestination } from '../src/data/destinations'
import { setLocale } from '../src/i18n/locale'
import type { QuestRunProgress } from '../src/lib/questProgress'
import PageTools from '../src/PageTools'
import ActiveMissionIndicator from '../src/ActiveMissionIndicator'

const progress = vi.hoisted(() => ({
  quests: {} as Record<string, QuestRunProgress>,
  destinations: {} as Record<string, { started: boolean; selected: string[]; completed: string[] }>,
}))
vi.mock('../src/lib/useQuestProgress', () => ({ useQuestProgress: () => ({ state: { quests: progress.quests }, loading: false }) }))
vi.mock('../src/lib/useProgress', () => ({ useProgress: () => ({ state: { destinations: progress.destinations }, loading: false }) }))
afterEach(() => { cleanup(); progress.quests = {}; progress.destinations = {}; setLocale('vi') })
const questId = 'due-dau-an-50-nam'
const run = (): QuestRunProgress => ({ startedAt: 1, completedCheckpointIds: [], completedAtByCheckpoint: {} })

it('offers search in the page header using the existing search route', () => {
  const { rerender } = render(<PageTools route="#/su-kien" />)
  const search = within(screen.getByRole('banner')).getByRole('link', { name: 'Tìm kiếm' })
  expect(search.getAttribute('href')).toBe('#/tim-kiem')
  expect(search.hasAttribute('aria-current')).toBe(false)
  rerender(<PageTools route="#/tim-kiem" />)
  expect(search.getAttribute('aria-current')).toBe('page')
})

it('shows an informative card and preserves directions/play links', () => {
  progress.quests[questId] = run()
  const { container, rerender } = render(<PageTools route="#/su-kien"><ActiveMissionIndicator /></PageTools>)
  const card = screen.getByRole('link', { name: `Quest đang chơi: ${getQuest(questId)!.title}` })
  expect(card.getAttribute('href')).toBe(`#/quest/${questId}/chi-duong`)
  expect(within(card).getByText(getQuest(questId)!.title)).toBeTruthy()
  expect(card.textContent).toContain(`0/${getQuest(questId)!.checkpoints.length}`)
  expect(container.querySelector('.page-tools > .active-mission-indicator')).toBe(card)
  progress.quests[questId].arrivalConfirmedAt = 2
  rerender(<PageTools route="#/su-kien"><ActiveMissionIndicator /></PageTools>)
  expect(card.getAttribute('href')).toBe(`#/quest/${questId}/choi`)
})

it('leaves no card for empty or completed quest progress', () => {
  const { container, rerender } = render(<PageTools route="#/tai-khoan"><ActiveMissionIndicator /></PageTools>)
  expect(container.querySelector('.active-mission-indicator')).toBeNull()
  progress.quests[questId] = { ...run(), completedAt: 2 }
  rerender(<PageTools route="#/tai-khoan"><ActiveMissionIndicator /></PageTools>)
  expect(container.querySelector('.active-mission-indicator')).toBeNull()
})

it('keeps the most recently started active quest as the resume target', () => {
  progress.quests['cau-rong'] = { ...run(), startedAt: 1 }
  progress.quests[questId] = { ...run(), startedAt: 2, arrivalConfirmedAt: 3 }
  render(<ActiveMissionIndicator />)
  expect(screen.getByRole('link').getAttribute('href')).toBe(`#/quest/${questId}/choi`)
})

it('preserves the legacy location resume route and displays its name', () => {
  const id = 'cho-han'
  progress.destinations[id] = { started: true, selected: ['arrival', 'photo'], completed: ['arrival'] }
  render(<ActiveMissionIndicator />)
  const card = screen.getByRole('link')
  expect(card.getAttribute('href')).toBe(`#/nhiem-vu/${id}`)
  expect(within(card).getByText(getDestination(id)!.name)).toBeTruthy()
  expect(card.textContent).toContain('1/2')
})
