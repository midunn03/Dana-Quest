import { useEffect, useRef, useState } from 'react'
import { routeProgress, validRoute, type WalkingRoute } from './routing'
import { hasArrived, isFresh, type LocationSample } from './location'
import { getDestination } from '../data/destinations'
import { NAVIGATION_MAX_ACCURACY } from './usePlayerLocation'
export function useWalkingRoute(id: string, sample: LocationSample | null, target?: [number, number]) {
  const [route, setRoute] = useState<WalkingRoute | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const current = useRef<WalkingRoute | null>(null)
  const originAccuracy = useRef(Infinity)
  const [tick, setTick] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setTick(value => value + 1), 15000); return () => window.clearInterval(timer) }, [])
  const request = useRef<{ controller: AbortController | null; last: number; generation: number }>({ controller: null, last: -Infinity, generation: 0 })
  useEffect(() => {
    const state = request.current
    return () => { state.controller?.abort(); state.controller = null; state.generation++ }
  }, [id])
  useEffect(() => {
    const state = request.current
    const position = target ?? getDestination(id)?.position
    if (!sample || !isFresh(sample) || sample.accuracy > NAVIGATION_MAX_ACCURACY || !position || hasArrived(sample, position)) return
    const progress = current.current ? routeProgress(current.current, sample) : null
    const refined = originAccuracy.current > 50 && sample.accuracy <= 50
    if (progress && !refined && progress.offRoute <= Math.max(35, sample.accuracy * 1.5)) return
    if (state.controller || Date.now() - state.last < 15000) return
    const controller = new AbortController()
    state.controller = controller; state.last = Date.now()
    const generation = ++state.generation
    originAccuracy.current = sample.accuracy
    // An old route must not keep giving turns once the player leaves it.
    current.current = null; setRoute(null); setError(''); setBusy(true)
    const params = new URLSearchParams({ id, lat: String(sample.latitude), lng: String(sample.longitude) })
    fetch(`/api/navigation/route?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Chưa tính được đường đi.'); if (!validRoute(data.route)) throw new Error('Dữ liệu đường đi không hợp lệ.'); return data.route as WalkingRoute })
      .then(value => { if (generation !== state.generation) return; current.current = value; setRoute(value) })
      .catch(cause => { if (generation === state.generation && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Chưa tính được đường đi.') })
      .finally(() => { if (generation === state.generation) { state.controller = null; setBusy(false) } })
  }, [id, sample, target, tick])
  const progress = route && sample ? routeProgress(route, sample) : null
  const onRoute = progress && sample && progress.offRoute <= Math.max(35, sample.accuracy * 1.5)
  return { route, progress: onRoute ? progress : null, busy, error, usable: !!sample && sample.accuracy <= NAVIGATION_MAX_ACCURACY, precise: !!sample && sample.accuracy <= 50 }
}
