// Keep the current screen mounted while a journey asks for confirmation.
export function canNavigateFrom(currentHash: string) {
  const nextHash = window.location.hash
  if (nextHash === currentHash) return true
  const request = new CustomEvent('dana-before-navigation', { cancelable: true, detail: { hash: nextHash } })
  if (window.dispatchEvent(request)) return true
  window.history.replaceState(window.history.state, '', currentHash || '#/')
  return false
}
