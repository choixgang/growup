import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCtx } from '../App'
import MealSheet from '../components/MealSheet'
import {
  useAnalysis,
  useDeleteMeal,
  useMeals,
  useSaveMeal,
  useSaveWeekNote,
  useWeekNote,
} from '../data/hooks'
import { circled, DAY_LABELS_EN, todayStr, weekDates, weekStartOf, ymd } from '../lib/dates'
import { dPlus, normalizeName, type IngredientAnalysis } from '../lib/rules'
import type { Meal, WeekNote } from '../lib/types'

const PREF_LABEL = { like: '♡ 좋아함', normal: '보통', refuse: '거부' } as const

export default function WeekPage() {
  const ctx = useCtx()
  const navigate = useNavigate()
  const { start: startParam } = useParams()
  const [params] = useSearchParams()
  const focusDate = params.get('d')
  const weekStart = startParam ?? weekStartOf(todayStr())
  const dates = weekDates(weekStart)

  const meals = useMeals(ctx.baby.id)
  const analysis = useAnalysis(meals.data, ctx)
  const saveMeal = useSaveMeal(ctx.baby.id)
  const deleteMeal = useDeleteMeal(ctx.baby.id)
  const [editing, setEditing] = useState<{ date: string; slot: number; meal: Meal | null } | null>(null)

  const ingredientNames = useMemo(
    () => [...new Set([...ctx.household.knownIngredients, ...analysis.tests.map((t) => t.name)])],
    [analysis, ctx.household.knownIngredients],
  )

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})
  useEffect(() => {
    const target = focusDate ?? (dates.includes(todayStr()) ? todayStr() : null)
    if (target) dayRefs.current[target]?.scrollIntoView({ block: 'center' })
  }, [weekStart, focusDate]) // 주나 선택 날짜가 바뀔 때만 스크롤

  const go = (delta: number) => navigate(`/week/${ymd(addDays(parseISO(weekStart), delta * 7))}`, { replace: true })

  return (
    <div className="px-3 pt-[max(14px,env(safe-area-inset-top))]">
      <header className="flex items-end justify-between px-1">
        <h1 className="title-serif text-[42px] leading-[0.95] italic">Weekly</h1>
        <div className="mb-1 flex items-center gap-1 text-ink-soft">
          <button aria-label="이전 주" className="p-1" onClick={() => go(-1)}>
            <ChevronLeft size={18} />
          </button>
          <span className="date-serif text-[17px] text-ink">
            {format(parseISO(dates[0]), 'M/d')} – {format(parseISO(dates[6]), 'M/d')}
          </span>
          <button aria-label="다음 주" className="p-1" onClick={() => go(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <section className="mt-3 flex flex-col gap-2">
        {dates.map((date, i) => {
          const dayMeals = (meals.data ?? []).filter((m) => m.date === date).sort((a, b) => a.slot - b.slot)
          const nextSlot = dayMeals.reduce((n, m) => Math.max(n, m.slot), 0) + 1
          const isToday = date === todayStr()
          const focused = date === focusDate
          return (
            <div
              key={date}
              ref={(el) => {
                dayRefs.current[date] = el
              }}
              className="flex gap-2"
            >
              {/* 요일 탭 (컨셉2의 세로 탭) */}
              <div
                className={`flex w-[46px] shrink-0 flex-col items-center justify-center rounded-l-[22px] rounded-r-md py-2 ${
                  isToday ? 'bg-rose' : 'bg-rose-soft'
                }`}
              >
                <span className="title-serif text-[14px] italic">{DAY_LABELS_EN[i]}</span>
                <span className="date-serif text-[21px] leading-none">{parseISO(date).getDate()}</span>
                <span className="date-serif mt-1 text-[11px] text-ink-soft">D+{dPlus(ctx.baby.birthDate, date)}</span>
              </div>

              <div
                className={`paper-texture min-h-[84px] min-w-0 flex-1 rounded-r-[18px] rounded-l-md px-3 py-2 ${
                  focused ? 'ring-1 ring-rose-deep/50' : ''
                }`}
              >
                {dayMeals.map((m) => (
                  <MealRow
                    key={m.id}
                    meal={m}
                    multi={dayMeals.length > 1}
                    analysis={analysis}
                    onClick={() => setEditing({ date, slot: m.slot, meal: m })}
                  />
                ))}
                <button
                  className="mt-0.5 flex items-center gap-1 py-1 text-[12px] text-ink-faint"
                  onClick={() => setEditing({ date, slot: nextSlot, meal: null })}
                >
                  <Plus size={13} /> {dayMeals.length ? '끼니 추가' : '식단 적기'}
                </button>
              </div>
            </div>
          )
        })}
      </section>

      <WeekNotes babyId={ctx.baby.id} weekStart={weekStart} />

      {editing && (
        <MealSheet
          babyId={ctx.baby.id}
          date={editing.date}
          slot={editing.slot}
          meal={editing.meal}
          allMeals={meals.data ?? []}
          intervalDays={ctx.household.testIntervalDays}
          knownIngredients={ctx.household.knownIngredients}
          ingredientNames={ingredientNames}
          defaultStyle={ctx.household.feedingStyle}
          onSave={(m) => saveMeal.mutateAsync(m)}
          onDelete={(id) => deleteMeal.mutate(id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function MealRow({
  meal,
  multi,
  analysis,
  onClick,
}: {
  meal: Meal
  multi: boolean
  analysis: IngredientAnalysis
  onClick: () => void
}) {
  const newKeys = new Set(analysis.newByDate.get(meal.date) ?? [])
  const log = meal.log
  const porridge = meal.style === 'porridge'
  return (
    <button onClick={onClick} className="block w-full border-b border-dashed border-line py-1 text-left last:border-0">
      {porridge && (
        <div className="pen flex flex-wrap items-baseline gap-x-2 text-[21px] leading-[1.2]">
          {multi && <span className="text-ink-soft">{circled(meal.slot)}</span>}
          <span>{meal.title || '죽'}</span>
          {meal.totalMl != null && <span className="text-ink-soft">{meal.totalMl}ml</span>}
        </div>
      )}
      <div
        className={`pen flex flex-wrap items-baseline ${
          porridge ? 'gap-x-1.5 text-[17px] leading-[1.15] text-ink-soft' : 'gap-x-2.5 text-[21px] leading-[1.2]'
        }`}
      >
        {multi && !porridge && <span className="text-ink-soft">{circled(meal.slot)}</span>}
        {meal.items.map((it, i) => {
          const key = normalizeName(it.name)
          return (
            <span key={i} className="inline-flex items-baseline gap-0.5">
              {analysis.cautionKeys.has(key) && <AlertTriangle size={12} className="self-center text-warn" />}
              <span className={newKeys.has(key) ? 'text-rose-deep' : ''}>{it.name}</span>
              {it.grams != null && <span className="text-ink-soft">{it.grams}g</span>}
              {newKeys.has(key) && (
                <span className="title-serif ml-0.5 rounded-sm bg-rose-soft px-1 text-[10px] tracking-wider not-italic">
                  NEW
                </span>
              )}
            </span>
          )
        })}
      </div>
      {log ? (
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-soft">
          {log.photoUrl && (
            <img
              src={log.photoThumbUrl ?? log.photoUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-7 w-7 rounded object-cover"
            />
          )}
          <span className="pen text-[17px]">
            {[
              log.eatenAmount && `먹은 양 ${log.eatenAmount}`,
              log.preference && PREF_LABEL[log.preference],
              log.reaction === 'issue' ? null : '반응 없음',
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {log.reaction === 'issue' && (
            <span className="pen text-[17px] text-warn">⚠ {log.reactionNote || '이상 반응'}</span>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-ink-faint">계획 · 먹인 뒤 눌러서 기록</p>
      )}
    </button>
  )
}

function WeekNotes({ babyId, weekStart }: { babyId: string; weekStart: string }) {
  const note = useWeekNote(babyId, weekStart)
  const save = useSaveWeekNote()
  const [memo, setMemo] = useState('')
  const [newItem, setNewItem] = useState('')
  useEffect(() => setMemo(note.data?.memo ?? ''), [note.data?.memo])

  if (!note.data) return null
  const n: WeekNote = note.data
  const update = (patch: Partial<WeekNote>) => save.mutate({ ...n, ...patch })

  return (
    <section className="mt-5 grid grid-cols-1 gap-3">
      <div className="rounded-[18px] bg-rose-soft px-4 pt-3 pb-4">
        <h2 className="title-serif text-right text-[20px] italic">Memo</h2>
        <textarea
          className="pen mt-1 min-h-[90px] w-full resize-none bg-transparent text-[20px] leading-[1.35]"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent 0 26px, rgba(150,120,100,0.22) 26px 27px)',
          }}
          placeholder="이번 주 메모"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onBlur={() => memo !== n.memo && update({ memo })}
        />
      </div>

      <div className="rounded-[18px] bg-rose-soft px-4 pt-3 pb-4">
        <h2 className="title-serif text-right text-[20px] italic">Checklist</h2>
        <ul className="mt-1 flex flex-col gap-1">
          {n.checklist.map((c) => (
            <li key={c.id} className="flex items-center gap-2.5">
              <button
                aria-label={c.done ? '체크 해제' : '체크'}
                className={`h-[16px] w-[16px] shrink-0 rounded-full border border-ink-soft ${c.done ? 'bg-ink-soft' : 'bg-card'}`}
                onClick={() =>
                  update({ checklist: n.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)) })
                }
              />
              <span className={`pen flex-1 text-[20px] ${c.done ? 'text-ink-faint line-through' : ''}`}>{c.text}</span>
              <button
                aria-label="항목 삭제"
                className="p-1 text-ink-faint"
                onClick={() => update({ checklist: n.checklist.filter((x) => x.id !== c.id) })}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-1 flex items-center gap-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            const text = newItem.trim()
            if (!text) return
            update({ checklist: [...n.checklist, { id: crypto.randomUUID(), text, done: false }] })
            setNewItem('')
          }}
        >
          <span className="h-[16px] w-[16px] shrink-0 rounded-full border border-dashed border-ink-faint" />
          <input
            className="pen min-w-0 flex-1 bg-transparent text-[20px]"
            placeholder="예: 소고기 큐브 만들기"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
        </form>
      </div>
    </section>
  )
}
