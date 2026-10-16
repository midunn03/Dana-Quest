// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import DestinationSheet from '../src/DestinationSheet'
import { destinations } from '../src/data/destinations'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

async function setup(place = destinations[0]) {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
  const onClose = vi.fn()
  const view = render(<div className="app-shell"><DestinationSheet place={place} onClose={onClose}/></div>)
  const panel = view.container.querySelector('.gesture-sheet') as HTMLDivElement
  vi.spyOn(panel, 'getBoundingClientRect').mockImplementation(() => {
    const height = panel.style.height ? parseFloat(panel.style.height) : panel.classList.contains('expanded') ? 600 : 264
    return { x:0, y:600-height, left:0, top:600-height, right:390, bottom:600, width:390, height, toJSON: () => ({}) }
  })
  await waitFor(() => expect(panel.classList.contains('open')).toBe(true))
  const zone = panel.querySelector('.sheet-drag-zone')!
  return { panel, zone, onClose }
}

it('opens a preview, follows the pointer continuously, expands, collapses, and dismisses at the bottom', async () => {
  const { panel, zone, onClose } = await setup()
  expect(panel.classList.contains('expanded')).toBe(false)
  fireEvent.pointerDown(zone, { pointerId:1, button:0, clientY:400 })
  fireEvent.pointerMove(zone, { pointerId:1, clientY:340 })
  expect(panel.style.height).toBe('324px')
  fireEvent.pointerMove(zone, { pointerId:1, clientY:240 })
  expect(panel.style.height).toBe('424px')
  fireEvent.pointerUp(zone, { pointerId:1, clientY:240 })
  expect(panel.classList.contains('expanded')).toBe(true)
  expect(panel.style.height).toBe('')
  fireEvent.click(zone)
  expect(panel.classList.contains('expanded')).toBe(true)
  fireEvent.pointerDown(zone, { pointerId:2, button:0, clientY:100 })
  fireEvent.pointerUp(zone, { pointerId:2, clientY:350 })
  expect(panel.classList.contains('expanded')).toBe(false)
  expect(onClose).not.toHaveBeenCalled()
  fireEvent.pointerDown(zone, { pointerId:3, button:0, clientY:350 })
  fireEvent.pointerMove(zone, { pointerId:3, clientY:605 })
  expect(panel.style.height).toBe('9px')
  fireEvent.pointerUp(zone, { pointerId:3, clientY:605 })
  expect(panel.classList.contains('open')).toBe(false)
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
})

it.each(destinations)('opens the shared sheet and journey action for $name', async place => {
  const { panel } = await setup(place)
  expect(panel.getAttribute('aria-label')).toBe(`Thông tin ${place.name}`)
  expect(panel.querySelector('.sheet-place-tags')).toBeNull()
  expect(panel.querySelector('.eyebrow')).toBeNull()
  expect(panel.querySelector('.sheet-handle')).not.toBeNull()
  expect(panel.querySelector('.sheet-thumbnail')).not.toBeNull()
  expect(panel.querySelectorAll('.gallery-slide')).toHaveLength(3)
  expect(panel.querySelectorAll('.visit-section')[0].textContent).toContain(place.description)
  expect(panel.querySelectorAll('.visit-section')[1].textContent).toContain(place.suggestedActivities[0])
  expect(panel.querySelector('.destination-sources')).toBeNull()
  expect(panel.querySelector('.sheet-actions a')?.getAttribute('href')).toBe(`#/dia-diem/${place.id}`)
})

it('ignores a second pointer and restores the previous position after an interrupted drag', async () => {
  const { panel, zone, onClose } = await setup()
  fireEvent.pointerDown(zone, { pointerId:1, button:0, clientY:400 })
  fireEvent.pointerMove(zone, { pointerId:2, clientY:0 })
  expect(panel.style.height).toBe('264px')
  fireEvent.pointerMove(zone, { pointerId:1, clientY:250 })
  expect(panel.style.height).toBe('414px')
  fireEvent.pointerCancel(zone, { pointerId:1 })
  expect(panel.style.height).toBe('')
  expect(panel.classList.contains('expanded')).toBe(false)
  expect(panel.classList.contains('dragging')).toBe(false)
  expect(onClose).not.toHaveBeenCalled()
})

it('opens full height after a short upward swipe on the illustration and keeps full content scrollable', async () => {
  const { panel } = await setup()
  const picture = panel.querySelector('.gallery-track')!
  fireEvent.pointerDown(picture, { pointerId:1, button:0, clientY:400 })
  fireEvent.pointerMove(picture, { pointerId:1, clientY:368 })
  expect(panel.style.height).toBe('296px')
  fireEvent.pointerUp(picture, { pointerId:1, clientY:368 })
  expect(panel.classList.contains('expanded')).toBe(true)
  expect(panel.style.height).toBe('')
  fireEvent.click(panel)
  expect(panel.classList.contains('expanded')).toBe(true)
  // Once expanded, swiping content belongs to native scrolling, not sheet resizing.
  fireEvent.pointerDown(picture, { pointerId:2, button:0, clientY:400 })
  fireEvent.pointerMove(picture, { pointerId:2, clientY:200 })
  expect(panel.classList.contains('dragging')).toBe(false)
  expect(panel.classList.contains('expanded')).toBe(true)
})


it('keeps horizontal gallery swipes separate from sheet expansion and shows three illustrations', async () => {
  const { panel } = await setup()
  const track = panel.querySelector('.gallery-track') as HTMLDivElement
  expect(track.querySelectorAll('.gallery-slide')).toHaveLength(3)
  fireEvent.pointerDown(track, { pointerId:1, button:0, clientX:300, clientY:400 })
  fireEvent.pointerMove(track, { pointerId:1, clientX:100, clientY:395 })
  fireEvent.pointerUp(track, { pointerId:1, clientX:100, clientY:395 })
  expect(panel.classList.contains('expanded')).toBe(false)
  expect(panel.style.height).toBe('')
  Object.defineProperty(track, 'clientWidth', { configurable:true, value:360 })
  fireEvent.scroll(track, { target: { scrollLeft:360 } })
  expect(panel.querySelector('.gallery-counter')?.textContent).toBe('2/3')
  fireEvent.scroll(track, { target: { scrollLeft:720 } })
  expect(panel.querySelector('.gallery-counter')?.textContent).toBe('3/3')
  expect(panel.querySelector('.gallery-arrow.next')?.hasAttribute('disabled')).toBe(true)
  expect(panel.querySelector('.secondary-button')).toBeNull()
  expect(panel.querySelector('.crowd-status')?.textContent).toBe('Chưa có dữ liệu thời gian thực')
  expect(panel.querySelectorAll('.crowd-bar')).toHaveLength(12)
  expect(Array.from(panel.querySelectorAll('.visit-section h3')).map(item=>item.textContent)).toEqual(['Tổng quan','Gợi ý hoạt động','Giờ mở cửa','Thời gian đông đúc'])
})
