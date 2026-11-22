/** Decorative, locally bundled sprite sheet generated for Dana Quest. */
export default function HomeAdventureElement({ kind, className = '' }: {
  kind: 'compass' | 'map' | 'backpack'
  className?: string
}) {
  return <span className={`home-adventure-element adventure-${kind} ${className}`} aria-hidden="true" />
}
