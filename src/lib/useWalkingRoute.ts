import { t } from '../i18n/locale'
import { useEffect, useRef, useState } from 'react'
import { routeProgress, validRoute, type WalkingRoute } from './routing'
import { hasArrived, isFresh, type LocationSample } from './location'
import { getDestination } from '../data/destinations'
import { NAVIGATION_MAX_ACCURACY } from './usePlayerLocation'

export const offRouteLimit = (accuracy: number) => Math.min(60, Math.max(35, accuracy * 1.5))
const REROUTE_GAP_MS = 8000
const RETRY_BASE_MS = 8000
const RETRY_MAX_MS = 30000

export function useWalkingRoute(id: string, sample: LocationSample | null, target?: [number, number]) {
  const position = target ?? getDestination(id)?.position
  const targetKey = `${id}:${position?.[0] ?? ''}:${position?.[1] ?? ''}`
  const [routeState, setRouteState] = useState<{ key: string; route: WalkingRoute } | null>(null)
  const [busyState, setBusyState] = useState<{ key: string; value: boolean } | null>(null)
  const [errorState, setErrorState] = useState<{ key: string; value: string } | null>(null)
  const current = useRef<{ key: string; route: WalkingRoute } | null>(null)
  const originAccuracy = useRef(Infinity)
  const failures = useRef(0)
  const [tick, setTick] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setTick(value => value + 1), 5000); return () => window.clearInterval(timer) }, [])
  const request = useRef<{ controller: AbortController | null; last: number; generation: number }>({ controller: null, last: -Infinity, generation: 0 })
  useEffect(() => {
    const state = request.current
    state.controller?.abort()
    state.controller = null
    state.generation++
    state.last = -Infinity
    failures.current = 0
    originAccuracy.current = Infinity
    current.current = null
    return () => { state.controller?.abort(); state.controller = null; state.generation++ }
  }, [targetKey])
  useEffect(() => {
    const state = request.current
    if (!sample || !isFresh(sample) || sample.accuracy > NAVIGATION_MAX_ACCURACY || !position || hasArrived(sample, position)) return
    const active = current.current?.key === targetKey ? current.current.route : null
    const progress = active ? routeProgress(active, sample) : null
    const refined = originAccuracy.current > 50 && sample.accuracy <= 50
    if (progress && !refined && progress.offRoute <= offRouteLimit(sample.accuracy)) return
    const gap = failures.current
      ? Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (failures.current - 1))
      : REROUTE_GAP_MS
    if (state.controller || Date.now() - state.last < gap) return
    const controller = new AbortController()
    state.controller = controller; state.last = Date.now()
    const generation = ++state.generation
    originAccuracy.current = sample.accuracy
    setErrorState({ key: targetKey, value: '' }); setBusyState({ key: targetKey, value: true })
    const params = new URLSearchParams({ id, lat: String(sample.latitude), lng: String(sample.longitude) })
    fetch(`/api/navigation/route?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || t("Chưa tính được đường đi.")); if (!validRoute(data.route)) throw new Error(t("Dữ liệu đường đi không hợp lệ.")); return data.route as WalkingRoute })
      .then(value => {
        if (generation !== state.generation) return
        failures.current = 0
        current.current = { key: targetKey, route: value }
        setRouteState({ key: targetKey, route: value })
      })
      .catch(cause => {
        if (generation === state.generation && !controller.signal.aborted) {
          failures.current++
          setErrorState({ key: targetKey, value: cause instanceof Error ? cause.message : t("Chưa tính được đường đi.") })
        }
      })
      .finally(() => { if (generation === state.generation) { state.controller = null; setBusyState({ key: targetKey, value: false }) } })
  }, [id, position, sample, targetKey, tick])
  const route = routeState?.key === targetKey ? routeState.route : null
  const progress = route && sample ? routeProgress(route, sample) : null
  const onRoute = progress && sample && progress.offRoute <= offRouteLimit(sample.accuracy)
  const busy = busyState?.key === targetKey && busyState.value
  const error = errorState?.key === targetKey ? errorState.value : ''
  return { route, progress: onRoute ? progress : null, busy, error, usable: !!sample && sample.accuracy <= NAVIGATION_MAX_ACCURACY, precise: !!sample && sample.accuracy <= 50 }
}
