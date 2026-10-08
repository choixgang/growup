import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCtx } from '../App'
import { repo } from '../data'
import { useMeals } from '../data/hooks'
import { normalizeName } from '../lib/rules'
import type { Meal } from '../lib/types'

type Range = 'week' | 'month' | 'all'

interface Props {
  weekDates: string[]
  targetMeals: Meal[]
  onClose: () => void
  onDone: (count: number) => void
}

/** 같은 식단인지 비교할 때 쓰는 값: 방식·죽 이름·재료 이름 */
function signature(m: Meal): string {
  const names = m.items.map((i) => normalizeName(i.name)).sort()
  return [m.style ?? 'topping', normalizeName(m.title ?? ''), ...names].join('|')
}

/**
 * 다른 아이의 식단을 지금 아이에게 불러온다. 식단(재료·g, 죽 이름·용량)만 옮기고
 * 먹인 기록은 비워 둔다. 같은 날 같은 식단이 이미 있으면 건너뛴다.
 */
export default function ImportMealsSheet({ weekDates, targetMeals, onClose, onDone }: Props) {
  const ctx = useCtx()
  const qc = useQueryClient()
  const others = ctx.babies.filter((b) => b.id !== ctx.baby.id)
  const [sourceId, setSourceId] = useState(others[0]?.id ?? '')
  const source = useMeals(sourceId)
  const month = weekDates[3].slice(0, 7) // 주 가운데(수요일)가 속한 달
  const [range, setRange] = useState<Range>('week')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toImport = useMemo(() => {
    const inRange = (d: string) =>
      range === 'week' ? weekDates.includes(d) : range === 'month' ? d.startsWith(month) : true
    const have = new Set(targetMeals.map((m) => `${m.date}#${signature(m)}`))
    return (source.data ?? [])
      .filter((m) => inRange(m.date) && !have.has(`${m.date}#${signature(m)}`))
      .sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot)
  }, [source.data, targetMeals, range, weekDates, month])

  const sourceName = others.find((b) => b.id === sourceId)?.name ?? ''

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const nextSlot = new Map<string, number>()
      for (const m of targetMeals) nextSlot.set(m.date, Math.max(nextSlot.get(m.date) ?? 0, m.slot))
      for (const m of toImport) {
        const slot = (nextSlot.get(m.date) ?? 0) + 1
        nextSlot.set(m.date, slot)
        await repo.saveMeal({
          babyId: ctx.baby.id,
          date: m.date,
          slot,
          style: m.style ?? 'topping',
          title: m.title ?? '',
          totalMl: m.totalMl ?? null,
          items: m.items.map((i) => ({ ...i })),
          log: null,
        })
      }
      await qc.invalidateQueries({ queryKey: ['meals', ctx.baby.id] })
      onDone(toImport.length)
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
      await qc.invalidateQueries({ queryKey: ['meals', ctx.baby.id] })
    }
  }

  const RANGES: { value: Range; label: string }[] = [
    { value: 'week', label: `이번 주 ${format(parseISO(weekDates[0]), 'M/d')}~` },
    { value: 'month', label: `${Number(month.slice(5))}월 전체` },
    { value: 'all', label: '전체 기간' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25" onClick={onClose}>
      <div
        className="paper-texture sheet-up safe-bottom w-full max-w-[520px] rounded-t-[26px] px-5 pt-4 pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] text-ink-soft">{ctx.baby.name}에게</p>
            <h2 className="text-[19px] font-bold">다른 아이 식단 불러오기</h2>
          </div>
          <button aria-label="닫기" className="p-1 text-ink-soft" onClick={onClose}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {others.length > 1 && (
          <>
            <p className="mt-4 text-[12px] text-ink-soft">누구의 식단을 불러올까요?</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {others.map((b) => (
                <button
                  key={b.id}
                  className={`rounded-xl border px-4 py-2 text-[13px] ${
                    sourceId === b.id ? 'border-ink bg-card' : 'border-line text-ink-soft'
                  }`}
                  onClick={() => setSourceId(b.id)}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="mt-4 text-[12px] text-ink-soft">어느 기간을 불러올까요?</p>
        <div className="mt-1.5 flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              className={`flex-1 rounded-xl border py-2 text-[13px] ${
                range === r.value ? 'border-ink bg-card' : 'border-line text-ink-soft'
              }`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
          식단만 불러와요. 먹은 양·반응·사진은 비어 있어요. 같은 날 똑같은 식단이 이미 있으면 건너뛰어요.
        </p>

        {error && <p className="mt-3 text-[13px] text-warn">{error}</p>}
        <button
          className="btn btn-primary mt-4 w-full"
          onClick={run}
          disabled={busy || source.isLoading || toImport.length === 0}
        >
          {busy
            ? '불러오는 중…'
            : source.isLoading
              ? '확인 중…'
              : toImport.length
                ? `${sourceName} 식단 ${toImport.length}끼 불러오기`
                : '불러올 새 식단이 없어요'}
        </button>
      </div>
    </div>
  )
}
