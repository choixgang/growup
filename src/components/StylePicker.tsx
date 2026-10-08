import type { FeedingStyle } from '../lib/types'

const OPTIONS: { value: FeedingStyle; title: string; desc: string }[] = [
  { value: 'topping', title: '토핑 이유식', desc: '재료를 따로 담아 g으로 적어요' },
  { value: 'porridge', title: '죽 이유식', desc: '죽 이름과 전체 용량만 적어요' },
]

/** 온보딩·설정에서 쓰는 죽/토핑 기본 방식 선택 */
export default function StylePicker({ value, onChange }: { value: FeedingStyle; onChange: (v: FeedingStyle) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-xl border px-3 py-2.5 text-left ${
            value === o.value ? 'border-ink bg-card' : 'border-line text-ink-soft'
          }`}
        >
          <span className="block text-[14px] font-bold">{o.title}</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-ink-soft">{o.desc}</span>
        </button>
      ))}
    </div>
  )
}
