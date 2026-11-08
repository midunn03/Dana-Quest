// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import DueMap from '../src/DueMap'
import { walkingFixture } from './routing-fixture'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('shows a turn-by-turn instruction alongside the quest route map', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => ({ route: walkingFixture }),
  })))
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  })

  render(<DueMap questId="due-dau-an-50-nam" sample={{
    latitude: 16.08,
    longitude: 108.24,
    accuracy: 10,
    timestamp: Date.now(),
  }} />)

  expect(await screen.findByText(/Sau đó rẽ trái vào Đường B/)).toBeTruthy()
  expect(document.querySelector('.due-route-caption')?.textContent).toContain('Còn')
})
