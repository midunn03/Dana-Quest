export default function GameIcon({ kind }: { kind:'map'|'album'|'gift'|'person' }) {
  const paths={map:'M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12zm0-15a3 3 0 1 0 0 6 3 3 0 0 0 0-6',album:'M4 4h16v16H4zM6 17l4-5 3 3 3-4 3 6M8 8h1',gift:'M3 8h18v5H3zM5 13v8h14v-8M12 8v13M12 8C3 8 5 1 9 4l3 4zm0 0c9 0 7-7 3-4l-3 4z',person:'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M5 21v-3a7 7 0 0 1 14 0v3z'}
  return <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"><path d={paths[kind]}/></svg>
}
