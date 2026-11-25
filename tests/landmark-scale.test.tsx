// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import L from 'leaflet'
import Explore from '../src/Explore'
import {
  LANDMARK_DOT_MIN_ZOOM,
  LANDMARK_SPRITE_MIN_ZOOM,
  computeLandmarkLayout,
  getPixelLandmarkSpec,
} from '../src/lib/pixelLandmarkSamples'
import { metersPerPixel } from '../src/lib/markerScale'
import { quests } from '../src/data/quests'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Zoom-dependent geographic landmark sprites', () => {
  it('scales Dragon Bridge and Han River Bridge strictly with map zoom to match bridge start-to-end span', () => {
    const dragonSpec = getPixelLandmarkSpec('cau-rong')!
    const hanSpec = getPixelLandmarkSpec('cau-song-han')!
    expect(dragonSpec.span).toBeTruthy()
    expect(hanSpec.span).toBeTruthy()

    const z14 = computeLandmarkLayout('cau-rong', [16.0611, 108.2277], 14)
    const z15 = computeLandmarkLayout('cau-rong', [16.0611, 108.2277], 15)
    const z16 = computeLandmarkLayout('cau-rong', [16.0611, 108.2277], 16)

    expect(z14.mode).toBe('sprite')
    expect(z15.mode).toBe('sprite')
    expect(z16.mode).toBe('sprite')

    // Every +1 zoom doubles exact geographic pixel size
    expect(z15.widthPx / z14.widthPx).toBeCloseTo(2, 2)
    expect(z16.widthPx / z15.widthPx).toBeCloseTo(2, 2)

    // Matches exact real-world span in meters at zoom 15
    const expectedDragonPx15 = dragonSpec.widthMeters / metersPerPixel(z15.position[0], 15)
    expect(z15.widthPx).toBeCloseTo(expectedDragonPx15, 1)

    // Bridge midpoint aligns with exact OSM span center
    expect(z15.position[0]).toBeCloseTo((dragonSpec.span![0][0] + dragonSpec.span![1][0]) / 2, 5)
    expect(z15.position[1]).toBeCloseTo((dragonSpec.span![0][1] + dragonSpec.span![1][1]) / 2, 5)

    // Han River Bridge rotates slightly (~ -7.8 deg) to align with the real roadway
    const han15 = computeLandmarkLayout('cau-song-han', [16.0721, 108.2268], 15)
    expect(han15.rotationDeg).toBeLessThan(-5)
    expect(han15.rotationDeg).toBeGreaterThan(-10)
    expect(han15.widthPx).toBeCloseTo(hanSpec.widthMeters / metersPerPixel(han15.position[0], 15), 1)
  })

  it('hides 3D landmark sprites when zoomed out below zoom 14 and hides dots below zoom 11', () => {
    const dotLayout = computeLandmarkLayout('cau-rong', [16.0611, 108.2277], LANDMARK_SPRITE_MIN_ZOOM - 1)
    expect(dotLayout.mode).toBe('dot')
    expect(dotLayout.widthPx).toBe(12)

    const hiddenLayout = computeLandmarkLayout('cau-rong', [16.0611, 108.2277], LANDMARK_DOT_MIN_ZOOM - 1)
    expect(hiddenLayout.mode).toBe('hidden')
  })

  it('updates Explore map markers dynamically across zoom levels without overlapping sprites when zoomed out', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(600)
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(390)
    const setViewSpy = vi.spyOn(L.Map.prototype, 'setView')

    render(<Explore />)
    await screen.findByRole('region', { name: 'Bản đồ Đà Nẵng' })
    await waitFor(() => expect(document.querySelectorAll('.atlas-pin')).toHaveLength(quests.length))

    const map = setViewSpy.mock.instances.at(-1)! as L.Map

    // At zoom 15, pixel landmark sprites render with dynamic --landmark-w
    act(() => { map.setZoom(15, { animate: false }) })
    await waitFor(() => expect(document.querySelectorAll('.atlas-landmark-sample img').length).toBeGreaterThan(0))
    const sample15 = document.querySelector('.atlas-landmark-sample') as HTMLElement
    const width15 = parseFloat(sample15.style.getPropertyValue('--landmark-w'))
    expect(width15).toBeGreaterThan(15)

    // Zoom in to 16 -> pixel landmark width doubles
    act(() => { map.setZoom(16, { animate: false }) })
    await waitFor(() => {
      const s16 = document.querySelector('.atlas-landmark-sample') as HTMLElement
      expect(parseFloat(s16.style.getPropertyValue('--landmark-w'))).toBeCloseTo(width15 * 2, 0)
    })

    // Zoom out to 12 -> 3D landmark sprites disappear and become compact non-overlapping dots
    act(() => { map.setZoom(12, { animate: false }) })
    await waitFor(() => {
      expect(document.querySelectorAll('.atlas-landmark-sample img')).toHaveLength(0)
      expect(document.querySelectorAll('.atlas-pin-dot')).toHaveLength(quests.length)
    })
  })
})
