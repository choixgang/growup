import { AlertTriangle, Heart, HeartCrack, Smile, type LucideIcon } from 'lucide-react'
import type { ItemReaction } from '../lib/types'

/** 반응 선 아이콘. 글자 크기(1em)를 따라가서 text-[..] 로 크기를 맞춘다 */
const ICONS: Record<ItemReaction, { Icon: LucideIcon; color: string }> = {
  like: { Icon: Heart, color: 'text-rose-deep' },
  normal: { Icon: Smile, color: 'text-sage' },
  dislike: { Icon: HeartCrack, color: 'text-ink-soft' },
  issue: { Icon: AlertTriangle, color: 'text-alert' },
}

export default function ReactionIcon({ reaction, className = '' }: { reaction: ItemReaction; className?: string }) {
  const { Icon, color } = ICONS[reaction]
  return (
    <span className={`inline-flex items-center align-[-0.12em] ${color} ${className}`}>
      <Icon size="1em" strokeWidth={2.2} />
    </span>
  )
}
