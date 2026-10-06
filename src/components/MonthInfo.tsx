import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { STAGE_LABEL, type MonthNote, type Stage } from '../lib/types'

const STAGES: Stage[] = ['early', 'middle', 'late']

interface Props {
  note: MonthNote
  onChange?: (note: MonthNote) => void
  variant: 'app' | 'export'
}

/** 컨셉 달력 상단: 단계 체크, 주의해야 할 식재료, 이 달의 목표 */
export default function MonthInfo({ note, onChange, variant }: Props) {
  const isExport = variant === 'export'
  return (
    <div className={`flex flex-col ${isExport ? 'gap-3' : 'gap-2.5'}`}>
      <div className={`flex justify-end ${isExport ? 'gap-7' : 'gap-4'}`}>
        {STAGES.map((s) => {
          const on = note.stage === s
          return (
            <button
              key={s}
              type="button"
              disabled={isExport}
              onClick={() => onChange?.({ ...note, stage: s })}
              className={`flex items-center gap-1 ${isExport ? 'text-[23px]' : 'text-[13px]'} ${on ? '' : 'text-ink-soft'}`}
            >
              <span
                className={`relative inline-flex items-center justify-center border border-ink-soft/70 ${
                  isExport ? 'h-[22px] w-[22px]' : 'h-[14px] w-[14px]'
                }`}
              >
                {on && (
                  <Check
                    className="absolute -top-[40%] -left-[10%] text-ink"
                    size={isExport ? 28 : 19}
                    strokeWidth={2.2}
                  />
                )}
              </span>
              {STAGE_LABEL[s]}
            </button>
          )
        })}
      </div>
      <InfoLine
        label="주의해야 할 식재료"
        value={note.caution}
        isExport={isExport}
        onCommit={(v) => onChange?.({ ...note, caution: v })}
      />
      <InfoLine
        label="이 달의 목표"
        value={note.goal}
        isExport={isExport}
        onCommit={(v) => onChange?.({ ...note, goal: v })}
      />
    </div>
  )
}

function InfoLine({
  label,
  value,
  isExport,
  onCommit,
}: {
  label: string
  value: string
  isExport: boolean
  onCommit: (v: string) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <label className={`flex items-end border-b border-line-strong ${isExport ? 'gap-4 pb-1' : 'gap-3 pb-0.5'}`}>
      <span className={`shrink-0 text-ink-soft ${isExport ? 'w-[200px] text-[19px]' : 'w-[104px] text-[12px]'}`}>
        {label}
      </span>
      {isExport ? (
        <span className="pen min-h-[34px] flex-1 text-[32px] leading-none">{value}</span>
      ) : (
        <input
          className="pen min-w-0 flex-1 bg-transparent text-[19px]"
          value={draft}
          placeholder="…"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== value && onCommit(draft.trim())}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      )}
    </label>
  )
}
