export function notify(message: string) {
  window.dispatchEvent(new CustomEvent('dana-toast', { detail: message }))
}
