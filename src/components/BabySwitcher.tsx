import { useCtx } from '../App'

/** 아기가 둘 이상일 때만 보이는 아기 전환 버튼 */
export default function BabySwitcher() {
  const ctx = useCtx()
  if (ctx.babies.length < 2) return null
  return (
    <div className="flex w-fit rounded-full bg-rose-soft p-0.5 text-[13px]">
      {ctx.babies.map((b) => (
        <button
          key={b.id}
          className={`max-w-[96px] truncate rounded-full px-3 py-1 ${
            b.id === ctx.baby.id ? 'bg-ink text-paper' : 'text-ink-soft'
          }`}
          onClick={() => ctx.selectBaby(b.id)}
        >
          {b.name}
        </button>
      ))}
    </div>
  )
}
