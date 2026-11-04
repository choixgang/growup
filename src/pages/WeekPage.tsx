import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { AlertTriangle, ChevronLeft, ChevronRight, Copy, Download, Plus, Trash2, X } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCtx } from '../App'
import CopyMealSheet from '../components/CopyMealSheet'
import MealSheet from '../components/MealSheet'
import BabySwitcher from '../components/BabySwitcher'
import ImportMealsSheet from '../components/ImportMealsSheet'
import {
  useAnalysis,
  useDeleteMeal,
  useMeals,
  useSaveMeal,
  useSaveWeekNote,
  useWeekNote,
} from '../data/hooks'
import { DAY_LABELS_EN, todayStr, weekDates, weekStartOf, ymd } from '../lib/dates'
import { dPlus, itemReaction, mealReactions, normalizeName, type IngredientAnalysis } from '../lib/rules'
import { mealTypeLabel, nextMealSlot, type ChecklistItem, type ItemReaction, type Meal, type WeekNote } from '../lib/types'
import ReactionIcon from '../components/ReactionIcon'
import LinedTextarea from '../components/LinedTextarea'

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
  const [copying, setCopying] = useState<Meal | null>(null)
  const [importing, setImporting] = useState(false)
  const [openRow, setOpenRow] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; undo?: Meal } | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.undo ? 5000 : 2500)
    return () => clearTimeout(t)
  }, [toast])

  function removeMeal(m: Meal) {
    setOpenRow(null)
    deleteMeal.mutate(m.id)
    setToast({ text: '끼니를 삭제했어요', undo: m })
  }

  function undoDelete(m: Meal) {
    setToast(null)
    const { updatedAt: _, ...rest } = m
    saveMeal.mutate(rest)
  }

  async function copyMeal(src: Meal, date: string, slot: number) {
    await saveMeal.mutateAsync({
      babyId: src.babyId,
      date,
      slot,
      style: src.style ?? 'topping',
      title: src.title ?? '',
      totalMl: src.totalMl ?? null,
      items: src.items.map((i) => ({ ...i })),
      log: null,
    })
    setToast({ text: `${format(parseISO(date), 'M월 d일')} ${mealTypeLabel(slot)}으로 복사했어요` })
  }

  const ingredientNames = useMemo(
    () => [...new Set([...ctx.baby.knownIngredients, ...analysis.tests.map((t) => t.name)])],
    [analysis, ctx.baby.knownIngredients],
  )

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})
  useEffect(() => {
    const target = focusDate ?? (dates.includes(todayStr()) ? todayStr() : null)
    if (target) dayRefs.current[target]?.scrollIntoView({ block: 'center' })
  }, [weekStart, focusDate]) // 주나 선택 날짜가 바뀔 때만 스크롤

  const go = (delta: number) => navigate(`/week/${ymd(addDays(parseISO(weekStart), delta * 7))}`, { replace: true })

  return (
    <div className="px-3 pt-[max(14px,env(safe-area-inset-top))]">
      {ctx.babies.length > 1 && (
        <div className="flex items-center justify-between px-1 pb-1">
          <BabySwitcher />
          <button className="flex items-center gap-1 text-[12px] text-rose-deep" onClick={() => setImporting(true)}>
            <Download size={14} /> 다른 아이 식단 불러오기
          </button>
        </div>
      )}
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
          const nextSlot = nextMealSlot(dayMeals)
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
                    analysis={analysis}
                    open={openRow === m.id}
                    onOpenChange={(o) => setOpenRow(o ? m.id : null)}
                    onClick={() => (openRow ? setOpenRow(null) : setEditing({ date, slot: m.slot, meal: m }))}
                    onCopy={() => {
                      setOpenRow(null)
                      setCopying(m)
                    }}
                    onDelete={() => removeMeal(m)}
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

      {importing && (
        <ImportMealsSheet
          weekDates={dates}
          targetMeals={meals.data ?? []}
          onClose={() => setImporting(false)}
          onDone={(n) => setToast({ text: `식단 ${n}끼를 불러왔어요` })}
        />
      )}

      {copying && (
        <CopyMealSheet meal={copying} onCopy={(d, slot) => copyMeal(copying, d, slot)} onClose={() => setCopying(null)} />
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[96px] z-40 flex justify-center">
          <p className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink/85 px-4 py-2 text-[13px] text-paper shadow-lg">
            {toast.text}
            {toast.undo && (
              <button className="font-bold text-rose" onClick={() => undoDelete(toast.undo!)}>
                되돌리기
              </button>
            )}
          </p>
        </div>
      )}

      {editing && (
        <MealSheet
          babyId={ctx.baby.id}
          date={editing.date}
          slot={editing.slot}
          meal={editing.meal}
          allMeals={meals.data ?? []}
          intervalDays={ctx.baby.testIntervalDays}
          knownIngredients={ctx.baby.knownIngredients}
          ingredientNames={ingredientNames}
          defaultStyle={ctx.baby.feedingStyle}
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
  analysis,
  open,
  onOpenChange,
  onClick,
  onCopy,
  onDelete,
}: {
  meal: Meal
  analysis: IngredientAnalysis
  open: boolean
  onOpenChange: (open: boolean) => void
  onClick: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  const gesture = useRowGesture(open, onOpenChange, onCopy)
  const newKeys = new Set(analysis.newByDate.get(meal.date) ?? [])
  const log = meal.log
  const porridge = meal.style === 'porridge'
  const hasItemReactions = meal.items.some((it) => itemReaction(meal, normalizeName(it.name)))
  const whole = mealReactions(meal)
  return (
    <div className="relative overflow-hidden border-b border-dashed border-line last:border-0">
      {gesture.dx < 0 && (
        <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTIONS_W }}>
          <button
            className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-rose-soft text-[11px] text-ink"
            onClick={onCopy}
          >
            <Copy size={15} strokeWidth={1.6} /> 복사
          </button>
          <button
            className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-r-md bg-alert text-[11px] text-paper"
            onClick={onDelete}
          >
            <Trash2 size={15} strokeWidth={1.6} /> 삭제
          </button>
        </div>
      )}
      <button
        {...gesture.handlers}
        onClick={() => !gesture.consumeClick() && onClick()}
        className={`relative block w-full py-1 text-left select-none [-webkit-touch-callout:none] ${gesture.dx ? 'bg-paper' : ''} ${
          gesture.dragging ? '' : 'transition-transform'
        }`}
        style={{ transform: `translateX(${gesture.dx}px)`, touchAction: 'pan-y' }}
      >
        {porridge && (
          <div className="pen flex flex-wrap items-baseline gap-x-2 text-[21px] leading-[1.2]">
            <MealTag slot={meal.slot} reactions={whole} />
            <span>{meal.title || '죽'}</span>
            {meal.totalMl != null && <span className="text-ink-soft">{meal.totalMl}ml</span>}
          </div>
        )}
        <div
          className={`pen flex flex-wrap items-baseline ${
            porridge ? 'gap-x-1.5 text-[17px] leading-[1.15] text-ink-soft' : 'gap-x-2.5 text-[21px] leading-[1.2]'
          }`}
        >
          {!porridge && <MealTag slot={meal.slot} reactions={whole} />}
          {meal.items.map((it, i) => {
            const key = normalizeName(it.name)
            const caution = analysis.cautionKeys.has(key)
            const r = itemReaction(meal, key)
            return (
              <span key={i} className="inline-flex items-baseline gap-0.5">
                {caution && r !== 'issue' && <AlertTriangle size={12} className="self-center text-alert" />}
                <span className={caution ? 'text-alert' : newKeys.has(key) ? 'text-rose-deep' : ''}>{it.name}</span>
                {it.grams != null && <span className="text-ink-soft">{it.grams}g</span>}
                {r && <ReactionIcon reaction={r} className="self-center text-[11px] not-italic" />}
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
                log.reaction === 'issue' || hasItemReactions || whole.length ? null : '반응 없음',
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            {log.reaction === 'issue' && log.reactionNote && (
              <span className="pen text-[17px] text-alert">⚠ {log.reactionNote}</span>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-ink-faint">계획 · 먹인 뒤 눌러서 기록</p>
        )}
      </button>
    </div>
  )
}

/** 끼니 태그. 끼니 전체로 적은 반응은 태그 바로 오른쪽에 붙여 재료 반응과 구분한다 */
function MealTag({ slot, reactions }: { slot: number; reactions: ItemReaction[] }) {
  return (
    <span className="inline-flex items-center gap-0.5 self-center">
      <span
        className="rounded-full bg-rose-soft px-1.5 py-px text-[11px] leading-[1.4] text-ink-soft"
        style={{ fontFamily: 'var(--font-batang)' }}
      >
        {mealTypeLabel(slot)}
      </span>
      {reactions.map((r) => (
        <ReactionIcon key={r} reaction={r} className="text-[14px]" />
      ))}
    </span>
  )
}

const ACTIONS_W = 128

/**
 * 끼니 줄 제스처. 꾹 누르면 복사 창, 왼쪽으로 밀면 복사·삭제 버튼이 열린다.
 * 세로로 움직이면 스크롤로 보고 아무것도 하지 않는다.
 */
function useRowGesture(open: boolean, onOpenChange: (open: boolean) => void, onLongPress: () => void) {
  const [drag, setDrag] = useState<number | null>(null) // 끌고 있는 동안의 위치
  const g = useRef<{ x: number; y: number; timer: number | null; mode: 'idle' | 'swipe' | 'scroll' } | null>(null)
  const fired = useRef(false)
  const base = open ? -ACTIONS_W : 0
  const dx = drag ?? base

  const clearTimer = () => {
    if (g.current?.timer) clearTimeout(g.current.timer)
    if (g.current) g.current.timer = null
  }
  const reset = () => {
    clearTimer()
    g.current = null
    setDrag(null)
  }

  return {
    dx,
    dragging: drag !== null,
    /** 제스처 뒤에 따라오는 click 은 끼니 편집으로 넘기지 않는다 */
    consumeClick: () => {
      const f = fired.current
      fired.current = false
      return f
    },
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        fired.current = false
        const timer = open
          ? null
          : window.setTimeout(() => {
              fired.current = true
              navigator.vibrate?.(12)
              onLongPress()
            }, 500)
        g.current = { x: e.clientX, y: e.clientY, mode: 'idle', timer }
      },
      onPointerMove: (e: React.PointerEvent) => {
        const s = g.current
        if (!s) return
        const mx = e.clientX - s.x
        const my = e.clientY - s.y
        if (s.mode === 'idle') {
          if (Math.abs(my) > 8 && Math.abs(my) > Math.abs(mx)) {
            s.mode = 'scroll'
            clearTimer()
          } else if (mx < -8 || (open && mx > 8)) {
            s.mode = 'swipe'
            clearTimer()
          } else if (Math.abs(mx) > 8) clearTimer()
        }
        if (s.mode === 'swipe') setDrag(Math.max(-ACTIONS_W - 20, Math.min(0, base + mx)))
      },
      onPointerUp: () => {
        if (g.current?.mode === 'swipe') {
          fired.current = true // 밀기만 하고 놓아도 편집이 열리지 않게
          onOpenChange(dx < -ACTIONS_W / 2)
        }
        reset()
      },
      onPointerCancel: reset,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  }
}

/** 항목을 누르면 그 자리에서 고치고, 필드를 벗어나면(또는 엔터) 저장한다. 내용을 다 지우면 항목도 지운다. */
function ChecklistRow({
  item,
  onToggle,
  onRename,
  onRemove,
}: {
  item: ChecklistItem
  onToggle: () => void
  onRename: (text: string) => void
  onRemove: () => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textStyle = `pen min-w-0 flex-1 text-[20px] ${item.done ? 'text-ink-faint line-through' : ''}`

  return (
    <li className="flex items-center gap-2.5">
      <button
        aria-label={item.done ? '체크 해제' : '체크'}
        className={`h-[16px] w-[16px] shrink-0 rounded-full border border-ink-soft ${item.done ? 'bg-ink-soft' : 'bg-card'}`}
        onClick={onToggle}
      />
      {draft === null ? (
        <button
          aria-label={`${item.text} 수정`}
          className={`${textStyle} cursor-text break-words text-left`}
          onClick={() => setDraft(item.text)}
        >
          {item.text}
        </button>
      ) : (
        <form
          className="flex min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            inputRef.current?.blur()
          }}
        >
          <input
            ref={inputRef}
            autoFocus
            aria-label="항목 수정"
            className={`${textStyle} bg-transparent`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.setSelectionRange(draft.length, draft.length)}
            onBlur={(e) => {
              // 한글 조합 중에 벗어나도 마지막 글자가 빠지지 않게 입력칸의 실제 값을 읽는다
              const text = e.currentTarget.value.trim()
              setDraft(null)
              if (!text) onRemove()
              else if (text !== item.text) onRename(text)
            }}
          />
        </form>
      )}
      <button aria-label="항목 삭제" className="p-1 text-ink-faint" onClick={onRemove}>
        <X size={14} />
      </button>
    </li>
  )
}

function WeekNotes({ babyId, weekStart }: { babyId: string; weekStart: string }) {
  const note = useWeekNote(babyId, weekStart)
  const save = useSaveWeekNote()
  const [memo, setMemo] = useState('')
  const [newItem, setNewItem] = useState('')
  // 칸을 벗어나며 저장한 직후 바로 체크를 눌러도 방금 저장한 내용 위에 이어서 저장되도록, 화면 갱신을 기다리지 않는 최신 노트
  const latest = useRef<WeekNote | null>(null)
  useEffect(() => setMemo(note.data?.memo ?? ''), [note.data?.memo])

  if (!note.data) return null
  const n: WeekNote = note.data
  latest.current = n
  const update = (patch: Partial<WeekNote>) => {
    const next = { ...(latest.current ?? n), ...patch }
    latest.current = next
    save.mutate(next)
  }
  const updateChecklist = (change: (list: ChecklistItem[]) => ChecklistItem[]) =>
    update({ checklist: change((latest.current ?? n).checklist) })
  const addItem = (raw: string) => {
    const text = raw.trim()
    if (!text) return
    updateChecklist((list) => [...list, { id: crypto.randomUUID(), text, done: false }])
    setNewItem('')
  }

  return (
    <section className="mt-5 grid grid-cols-1 gap-3">
      <div className="rounded-[18px] bg-rose-soft px-4 pt-3 pb-4">
        <h2 className="title-serif text-right text-[20px] italic">Memo</h2>
        <LinedTextarea
          className="pen mt-1 text-[20px]"
          lineHeight={27}
          minLines={3}
          lineColor="rgba(150,120,100,0.22)"
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
            <ChecklistRow
              key={c.id}
              item={c}
              onToggle={() => updateChecklist((list) => list.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)))}
              onRename={(text) => updateChecklist((list) => list.map((x) => (x.id === c.id ? { ...x, text } : x)))}
              onRemove={() => updateChecklist((list) => list.filter((x) => x.id !== c.id))}
            />
          ))}
        </ul>
        <form
          className="mt-1 flex items-center gap-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            addItem(newItem)
          }}
        >
          <span className="h-[16px] w-[16px] shrink-0 rounded-full border border-dashed border-ink-faint" />
          <input
            className="pen min-w-0 flex-1 bg-transparent text-[20px]"
            placeholder="예: 소고기 큐브 만들기"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onBlur={(e) => addItem(e.currentTarget.value)}
          />
        </form>
      </div>
    </section>
  )
}
