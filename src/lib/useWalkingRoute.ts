import { useEffect, useRef, useState } from 'react'
import { routeProgress, validRoute, type Point, type WalkingRoute } from './routing'
import { hasArrived, isFresh, type LocationSample } from './location'
import { getDestination } from '../data/destinations'
import { NAVIGATION_MAX_ACCURACY } from './usePlayerLocation'

/** Cách tuyến quá chừng này (mét) thì coi là đã đi lệch: GPS kém thì cho phép lệch nhiều hơn nhưng không quá 60 m. */
export const offRouteLimit = (accuracy: number) => Math.min(60, Math.max(35, accuracy * 1.5))
const REROUTE_GAP_MS = 8000
const RETRY_BASE_MS = 5000
const RETRY_MAX_MS = 30000

export function useWalkingRoute(id: string, sample: LocationSample | null, target?: [number, number]) {
  const [route, setRoute] = useState<WalkingRoute | null>(null)
  const [initialRoute, setInitialRoute] = useState<WalkingRoute | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reroutes, setReroutes] = useState(0)
  const current = useRef<WalkingRoute | null>(null)
  const originAccuracy = useRef(Infinity)
  const fails = useRef(0)
  const [tick, setTick] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setTick(value => value + 1), 5000); return () => window.clearInterval(timer) }, [])
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
    if (progress && !refined && progress.offRoute <= offRouteLimit(sample.accuracy)) return
    // Tính lại đường nhanh khi vừa đi lệch; nếu máy chủ lỗi thì thử lại thưa dần (5 s, 10 s, 20 s, tối đa 30 s).
    const gap = fails.current ? Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (fails.current - 1)) : REROUTE_GAP_MS
    if (state.controller || Date.now() - state.last < gap) return
    const controller = new AbortController()
    state.controller = controller; state.last = Date.now()
    const generation = ++state.generation
    originAccuracy.current = sample.accuracy
    setError(''); setBusy(true) // vẫn giữ tuyến cũ trên bản đồ (mờ) trong lúc tính lại, nhưng không dùng nó để chỉ rẽ
    const params = new URLSearchParams({ id, lat: String(sample.latitude), lng: String(sample.longitude), dlat: String(position[0]), dlng: String(position[1]) })
    fetch(`/api/navigation/route?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Chưa tính được đường đi.'); if (!validRoute(data.route)) throw new Error('Dữ liệu đường đi không hợp lệ.'); return data.route as WalkingRoute })
      .then(value => {
        if (generation !== state.generation) return
        fails.current = 0
        const replaced = !!current.current
        current.current = value; setRoute(value)
        setInitialRoute(first => first ?? value)
        if (replaced) setReroutes(count => count + 1)
      })
      .catch(cause => { if (generation === state.generation && !controller.signal.aborted) { fails.current++; setError(cause instanceof Error ? cause.message : 'Chưa tính được đường đi.') } })
      .finally(() => { if (generation === state.generation) { state.controller = null; setBusy(false) } })
  }, [id, sample, target, tick])
  const progress = route && sample ? routeProgress(route, sample) : null
  const onRoute = !!progress && !!sample && progress.offRoute <= offRouteLimit(sample.accuracy)
  const usable = !!sample && sample.accuracy <= NAVIGATION_MAX_ACCURACY
  // Đã có tuyến nhưng người chơi đang ở ngoài tuyến: giữ điểm gần nhất trên tuyến cũ để vẽ đường chấm chỉ lối quay về.
  const deviation = progress && !onRoute && usable ? { meters: progress.offRoute, snapped: progress.points[0] as Point } : null
  return {
    route, initialRoute, progress: onRoute ? progress : null, deviation, busy, error, reroutes,
    usable, precise: !!sample && sample.accuracy <= 50,
  }
}
