import { useEffect, useState } from 'react'
import { accountRequest } from './accountFeatures'

export type DeviceMode = 'desktop' | 'mobile'

export const DEVICE_STORAGE_KEY = 'dana-device-mode-v1'

export function getRecommendedDeviceMode(): DeviceMode {
  if (typeof window === 'undefined') return 'desktop'
  const isCoarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
  const hasTouch = (navigator?.maxTouchPoints ?? 0) > 0
  const isNarrow = typeof window.innerWidth === 'number' && window.innerWidth <= 768
  return (isCoarse || hasTouch || isNarrow) ? 'mobile' : 'desktop'
}

export function getStoredDeviceMode(): DeviceMode | null {
  if (typeof window === 'undefined') return null
  try {
    const val = localStorage.getItem(DEVICE_STORAGE_KEY)
    if (val === 'desktop' || val === 'mobile') return val
  } catch {}
  return null
}

export function saveDeviceModePreference(mode: DeviceMode, owner?: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, mode)
    } catch {}
    window.dispatchEvent(new CustomEvent('dana-device-mode-changed', { detail: mode }))
  }
  if (owner) {
    accountRequest(owner, '/account', { kind: 'preferences', deviceMode: mode }).catch(() => {})
  }
}

export function useDeviceMode(owner?: string) {
  const [stored, setStored] = useState<DeviceMode | null>(() => getStoredDeviceMode())
  const [recommended, setRecommended] = useState<DeviceMode>(() => getRecommendedDeviceMode())

  useEffect(() => {
    const onResize = () => setRecommended(getRecommendedDeviceMode())
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<DeviceMode>).detail
      if (detail === 'desktop' || detail === 'mobile') setStored(detail)
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('dana-device-mode-changed', onChange)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('dana-device-mode-changed', onChange)
    }
  }, [])

  const mode: DeviceMode = stored ?? recommended
  const isExplicit = stored !== null

  const setMode = (newMode: DeviceMode) => {
    setStored(newMode)
    saveDeviceModePreference(newMode, owner)
  }

  return {
    mode,
    isExplicit,
    recommended,
    setMode,
  }
}
