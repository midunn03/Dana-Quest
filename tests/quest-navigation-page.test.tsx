// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import QuestNavigationPage from '../src/QuestNavigationPage'

vi.mock('../src/NavigationPage', () => ({
  default: ({ target }: { target: { name: string; requireArrival?: boolean; continueHref: string } }) => (
    <main
      aria-label="Hướng dẫn đường đi"
      data-continue-href={target.continueHref}
    >
      <span>{target.name}</span>
      {target.requireArrival && <span>Chỉ mở nhiệm vụ khi đến nơi</span>}
    </main>
  ),
}))

vi.mock('../src/DueStartPage', () => ({
  default: () => <main aria-label="Tìm điểm bắt đầu" />,
}))

it('opens turn-by-turn navigation for the DUE quest live-route screen', () => {
  render(<QuestNavigationPage id="due-dau-an-50-nam" />)

  expect(screen.getByRole('main', { name: 'Hướng dẫn đường đi' })).toBeTruthy()
  expect(screen.getByText('Trường Đại học Kinh tế – Đại học Đà Nẵng')).toBeTruthy()
  expect(screen.getByText('Chỉ mở nhiệm vụ khi đến nơi')).toBeTruthy()
  expect(screen.getByRole('main', { name: 'Hướng dẫn đường đi' }).getAttribute('data-continue-href'))
    .toBe('#/quest/due-dau-an-50-nam/chi-duong')
})
