import { useEffect, useState } from 'react'
import type { Destination } from '../data/destinations'
import type { VisitInfo } from '../data/visitInfo'

export function useLiveVisitInfo(place: Destination, fallback?: VisitInfo) {
  const [result, setResult] = useState<{ id: string; fallback?: VisitInfo; info?: VisitInfo } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/places/visit-info?id=${encodeURIComponent(place.id)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unavailable')))
      .then((live: VisitInfo) => { if (!controller.signal.aborted) setResult({ id: place.id, fallback, info: { ...fallback, ...live } }) })
      .catch(() => { if (!controller.signal.aborted) setResult({ id: place.id, fallback, info: fallback }) })
    return () => controller.abort()
  }, [place.id, fallback])
  const current = result?.id === place.id && result.fallback === fallback
  return { info: current ? result.info : fallback, loading: !current }
}
