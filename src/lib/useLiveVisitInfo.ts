import { useEffect, useState } from 'react'
import type { Destination } from '../data/destinations'
import type { VisitInfo } from '../data/visitInfo'

export function useLiveVisitInfo(place: Destination, fallback?: VisitInfo, enabled = true) {
  const [info, setInfo] = useState<VisitInfo | undefined>(fallback)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    setInfo(fallback)
    if (!enabled) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/places/visit-info?id=${encodeURIComponent(place.id)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Unavailable')))
      .then((live: VisitInfo) => setInfo({ ...fallback, ...live }))
      .catch(() => undefined)
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [place.id, fallback, enabled])
  return { info, loading }
}
