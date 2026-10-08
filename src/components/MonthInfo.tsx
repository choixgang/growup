import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import LinedTextarea from './LinedTextarea'

const NL = String.fromCharCode(10)
import { MEMO_MIN_LINES, STAGE_LABEL, type MonthNote, type Stage } from '../lib/types'

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

/** 줄 노트 같은 메모. 기본 세 줄이고, 더 적으면 줄이 늘어난다 */
function MemoLines({ value, isExport, onCommit }: { value: string; isExport: boolean; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const lines = value.split(NL)
  return (
    <label className="flex flex-col">
      <span className={`text-ink-soft ${isExport ? 'text-[19px]' : 'text-[12px]'}`}>메모</span>
      {isExport ? (
        // 이미지에서는 배경 그라디언트 줄이 흐리게 나와서 줄마다 밑줄을 긋는다
        <div className="pen text-[32px]">
          {Array.from({ length: Math.max(MEMO_MIN_LINES, lines.length) }, (_, i) => (
            <p key={i} className="border-b border-line-strong break-all" style={{ minHeight: 46, lineHeight: '46px' }}>
              {lines[i] ?? ''}
            </p>
          ))}
        </div>
      ) : (
        <LinedTextarea
          className="pen text-[19px]"
          lineHeight={30}
          minLines={MEMO_MIN_LINES}
          value={draft}
          placeholder="주의할 재료, 이 달의 목표…"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft.trim() !== value && onCommit(draft.trim())}
        />
      )}
    </label>
  )
}
