// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { expect, it } from 'vitest'
import { saveAction, loadProgress } from '../src/lib/storage'
it('does not reroll assignments or repeat notifications for concurrent actions and reloads', async () => {
  const messages: string[] = []
  const receive = (event: Event) => messages.push((event as CustomEvent<string>).detail)
  window.addEventListener('dana-toast', receive)
  try {
    await Promise.all([saveAction({ type: 'assign', destinationId: 'cau-rong', count: 10 }), saveAction({ type: 'assign', destinationId: 'cau-rong', count: 5 })])
    const first = await loadProgress()
    expect(first.destinations['cau-rong'].selected).toHaveLength(10)
    expect(messages).toHaveLength(1)
    await Promise.all(Array.from({length: 4}, () => saveAction({ type: 'complete', destinationId: 'cau-rong', missionId: 'read' })))
    expect(messages).toHaveLength(2)
    await loadProgress()
    expect(messages).toHaveLength(2)
    expect((await loadProgress()).destinations['cau-rong'].selected).toEqual(first.destinations['cau-rong'].selected)
  } finally { window.removeEventListener('dana-toast', receive) }
})
