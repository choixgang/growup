import { useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X } from 'lucide-react'
import { ymd } from '../lib/dates'
import type { Meal } from '../lib/types'

interface Props {
  meal: Meal
  onCopy: (date: string) => Promise<unknown>
  onClose: () => void
}

/** 끼니를 다른 날짜로 복사. 식단(재료·g, 죽 이름·용량)만 옮기고 먹인 기록은 비워 둔다 */
export default function CopyMealSheet({ meal, onCopy, onClose }: Props) {
  const from = parseISO(meal.date)
  const [date, setDate] = useState(ymd(addDays(from, 1)))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const quick = [1, 2, 7].map((n) => ({ n, date: ymd(addDays(from, n)) }))
  const summary =
    meal.style === 'porridge' && meal.title
      ? `${meal.title}${meal.totalMl != null ? ` ${meal.totalMl}ml` : ''}`
      : meal.items.map((i) => (i.grams != null ? `${i.name} ${i.grams}g` : i.name)).join(', ')

  async function copy() {
    setBusy(true)
    setError(null)
    try {
      await onCopy(date)
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25" onClick={onClose}>
      <div
        className="paper-texture sheet-up safe-bottom w-full max-w-[520px] rounded-t-[26px] px-5 pt-4 pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[12px] text-ink-soft">{format(from, 'M월 d일', { locale: ko })} 식단 복사</p>
            <p className="pen truncate text-[24px] leading-tight">{summary}</p>
          </div>
          <button aria-label="닫기" className="p-1 text-ink-soft" onClick={onClose}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        <p className="mt-4 text-[12px] text-ink-soft">어느 날로 복사할까요?</p>
        <div className="mt-1.5 flex gap-2">
          {quick.map((q) => (
            <button
              key={q.n}
              className={`flex-1 rounded-xl border py-2 text-[13px] ${
                date === q.date ? 'border-ink bg-card' : 'border-line text-ink-soft'
              }`}
              onClick={() => setDate(q.date)}
            >
              {q.n === 1 ? '다음 날' : q.n === 2 ? '이틀 뒤' : '일주일 뒤'}
              <span className="date-serif ml-1 text-[13px]">{format(parseISO(q.date), 'M/d')}</span>
            </button>
          ))}
        </div>
        <input
          className="field pen mt-3 w-full text-[22px]"
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
        <p className="mt-2 text-[11px] text-ink-faint">식단만 복사돼요. 먹은 양·반응·사진은 비어 있어요.</p>

        {error && <p className="mt-3 text-[13px] text-warn">{error}</p>}
        <button className="btn btn-primary mt-4 w-full" onClick={copy} disabled={busy}>
          {busy ? '복사 중…' : `${format(parseISO(date), 'M월 d일 (EEE)', { locale: ko })}에 복사`}
        </button>
      </div>
    </div>
  )
}
