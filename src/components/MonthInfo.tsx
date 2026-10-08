import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { MEMO_LINES, STAGE_LABEL, type MonthNote, type Stage } from '../lib/types'

const STAGES: Stage[] = ['early', 'middle', 'late']

interface Props {
  note: MonthNote
  onChange?: (note: MonthNote) => void
  variant: 'app' | 'export'
}

/** 컨셉 달력 상단: 단계 체크, 이 달의 메모 */
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
      <MemoLines value={note.memo} isExport={isExport} onCommit={(v) => onChange?.({ ...note, memo: v })} />
    </div>
  )
}

/** 줄 노트 같은 세 줄 메모. 줄 수를 넘기는 줄바꿈은 받지 않는다 */
function MemoLines({ value, isExport, onCommit }: { value: string; isExport: boolean; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const lineH = isExport ? 46 : 30
  const lined: React.CSSProperties = {
    height: lineH * MEMO_LINES,
    lineHeight: `${lineH}px`,
    backgroundImage: 'linear-gradient(transparent calc(100% - 1px), var(--color-line-strong) 1px)',
    backgroundSize: `100% ${lineH}px`,
    backgroundAttachment: 'local',
  }
  return (
    <label className="flex flex-col">
      <span className={`text-ink-soft ${isExport ? 'text-[19px]' : 'text-[12px]'}`}>메모</span>
      {isExport ? (
        <p className="pen overflow-hidden text-[32px] whitespace-pre-wrap" style={lined}>
          {value}
        </p>
      ) : (
        <textarea
          className="pen w-full resize-none overflow-y-auto bg-transparent text-[19px] outline-none"
          style={lined}
          rows={MEMO_LINES}
          value={draft}
          placeholder="주의할 재료, 이 달의 목표…"
          onChange={(e) => setDraft(e.target.value.split('\n').slice(0, MEMO_LINES).join('\n'))}
          onBlur={() => draft.trim() !== value && onCommit(draft.trim())}
        />
      )}
    </label>
  )
}
