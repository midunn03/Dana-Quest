import { useEffect, useRef, type CSSProperties } from 'react'
import search from './assets/illos/search-filters.svg?raw'
import tasks from './assets/illos/task-board.svg?raw'
import progress from './assets/illos/usage-meter.svg?raw'
import inbox from './assets/illos/notification-inbox.svg?raw'

const illustrations = { 'search-filters': search, 'task-board': tasks, 'usage-meter': progress, 'notification-inbox': inbox }

/** Decorative, locally bundled illustrations. Play once; never loop in the background. */
export default function HomeMotionIllustration({ kind }: { kind: keyof typeof illustrations }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = ref.current
    if (!host) return
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let inView = false
    let observer: IntersectionObserver | undefined
    const update = () => {
      const reduced = preference?.matches ?? false
      host.dataset.motion = reduced ? 'static' : 'animated'
      host.style.setProperty('--illos-play', !reduced && inView && document.visibilityState !== 'hidden' ? 'running' : 'paused')
    }
    const observe = () => {
      observer?.disconnect()
      inView = false
      if (!preference?.matches) {
        if (typeof IntersectionObserver !== 'undefined') {
          observer = new IntersectionObserver(entries => { inView = entries.some(entry => entry.isIntersecting); update() }, { threshold: 0.25 })
          observer.observe(host)
        } else inView = true
      }
      update()
    }
    observe()
    preference?.addEventListener('change', observe)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer?.disconnect()
      preference?.removeEventListener('change', observe)
      document.removeEventListener('visibilitychange', update)
    }
  }, [kind])
  return <div ref={ref} className={`home-motion home-motion-${kind}`} aria-hidden="true" style={{ '--illos-play': 'paused' } as CSSProperties} dangerouslySetInnerHTML={{ __html: illustrations[kind] }} />
}
