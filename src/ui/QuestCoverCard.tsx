import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import './QuestCoverCard.css'

type QuestCoverCardProps = ComponentPropsWithoutRef<'a'> & {
  cover: ReactNode
  coverClassName?: string
  bodyClassName?: string
  variant?: 'compact'
}

export default function QuestCoverCard({ cover, children, className = '', coverClassName = '', bodyClassName = '', variant, ...anchorProps }: QuestCoverCardProps) {
  return <a {...anchorProps} className={['quest-cover-card', variant && 'quest-cover-card--compact', className].filter(Boolean).join(' ')}>
    <div className={['quest-cover-card__cover', coverClassName].join(' ')}>{cover}</div>
    <div className={['quest-cover-card__body', bodyClassName].join(' ')}>{children}</div>
  </a>
}
