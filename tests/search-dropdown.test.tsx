// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import SearchDropdown from '../src/SearchDropdown'
afterEach(cleanup)
it('searches in place and retains destination links', () => {
  render(<SearchDropdown />)
  const hash = location.hash
  const input = screen.getByRole('searchbox')
  fireEvent.focus(input)
  expect(input.getAttribute('aria-expanded')).toBe('true')
  fireEvent.change(input, { target: { value: 'Mật thư của người giữ ký ức' } })
  expect(screen.getByRole('link', { name: /Mật thư của người giữ ký ức/ }).getAttribute('href')).toBe('#/quest/due-dau-an-50-nam')
  expect(location.hash).toBe(hash)
  fireEvent.keyDown(input, { key: 'Escape' })
  expect(screen.queryByRole('region')).toBeNull()
})
it('supports keyboard selection, empty results and outside dismissal', () => {
  render(<SearchDropdown />)
  const input = screen.getByRole('searchbox')
  fireEvent.focus(input)
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  expect(document.activeElement?.tagName).toBe('A')
  fireEvent.change(input, { target: { value: 'zzzz-no-such-place' } })
  expect(screen.getByRole('status')).toBeTruthy()
  fireEvent.pointerDown(document.body)
  expect(screen.queryByRole('region')).toBeNull()
})
