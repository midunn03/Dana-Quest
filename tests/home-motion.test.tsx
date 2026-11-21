// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import HomeMotionIllustration from '../src/HomeMotionIllustration'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('keeps the illustration static when reduced motion is requested', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  const observe = vi.fn()
  vi.stubGlobal('IntersectionObserver', class { observe = observe; disconnect = vi.fn() })
  const { container } = render(<HomeMotionIllustration kind="search-filters" />)
  expect(observe).not.toHaveBeenCalled()
  expect(container.firstElementChild?.getAttribute('data-motion')).toBe('static')
})

it('pauses outside the viewport and disconnects observers on unmount', () => {
  let notify: (entries: { isIntersecting: boolean }[]) => void = () => {}
  const disconnect = vi.fn()
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof notify) { notify = callback }
    observe = vi.fn()
    disconnect = disconnect
  })
  const view = render(<HomeMotionIllustration kind="task-board" />)
  const host = view.container.firstElementChild as HTMLElement
  notify([{ isIntersecting: true }])
  expect(host.style.getPropertyValue('--illos-play')).toBe('running')
  notify([{ isIntersecting: false }])
  expect(host.style.getPropertyValue('--illos-play')).toBe('paused')
  view.unmount()
  expect(disconnect).toHaveBeenCalledOnce()
})
