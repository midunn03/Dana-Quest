import { useEffect, useRef, useState } from 'react'

export default function Notifications() {
  const [items, setItems] = useState<{ id: number; message: string }[]>([])
  const next = useRef(0)
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const receive = (event: Event) => {
      const message = (event as CustomEvent<string>).detail
      const id = ++next.current
      setItems(old => [...old, { id, message }].slice(-4))
      const timer = setTimeout(() => { setItems(old => old.filter(item => item.id !== id)); timers.delete(timer) }, 7000)
      timers.add(timer)
    }
    window.addEventListener('dana-toast', receive)
    return () => { window.removeEventListener('dana-toast', receive); timers.forEach(clearTimeout) }
  }, [])
  return <aside className="notifications" aria-label="Thông báo" aria-live="polite">{items.map(item => <div className="toast" key={item.id}><span>{item.message}</span><button aria-label="Đóng thông báo" onClick={() => setItems(old => old.filter(value => value.id !== item.id))}>×</button></div>)}</aside>
}
