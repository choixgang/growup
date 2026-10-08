import { REACTION_EMOJI, type ItemReaction } from '../lib/types'

/** 반응 이모지. 싫어함은 빨간 💔 대신 짙은 회색으로 (이상 반응의 붉은색과 헷갈리지 않게) */
export default function ReactionEmoji({ reaction, className = '' }: { reaction: ItemReaction; className?: string }) {
  return (
    <span className={`${className} ${reaction === 'dislike' ? 'brightness-[0.6] grayscale' : ''}`}>
      {REACTION_EMOJI[reaction]}
    </span>
  )
}
