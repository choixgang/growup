import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarPlus, Check, ImageDown, Sparkles, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCtx } from '../App'
import BabySwitcher from '../components/BabySwitcher'
import FoodIcon from '../components/FoodIcon'
import MealSheet from '../components/MealSheet'
import { repo } from '../data'
import { useAnalysis, useDeleteMeal, useMeals, useSaveMeal } from '../data/hooks'
import type { StoredContext } from '../data/repo'
import { todayStr, weekStartOf, ymd } from '../lib/dates'
import { FOOD_BY_ID, FOOD_CATEGORIES, FOODS, foodStatuses, matchFoods, type Food, type FoodStatus } from '../lib/foods'
import { pairingSuggestions } from '../lib/pairings'
import { dPlus, type IngredientAnalysis } from '../lib/rules'
import { nextMealSlot } from '../lib/types'

type Anim = 'on' | 'off'

const seenKey = (babyId: string) => `growup-foods-seen:${babyId}`

function readSeen(babyId: string): string[] | null {
  try {
    const raw = localStorage.getItem(seenKey(babyId))
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}

function writeSeen(babyId: string, ids: string[]) {
  try {
    localStorage.setItem(seenKey(babyId), JSON.stringify(ids))
  } catch {
    // 못 저장하면 다음에 팝업이 한 번 더 뜰 뿐
  }
}

export default function FoodsPage() {
  const ctx = useCtx()
  const qc = useQueryClient()
  const meals = useMeals(ctx.baby.id)
  const analysis = useAnalysis(meals.data, ctx)
  const saveMeal = useSaveMeal(ctx.baby.id)
  const deleteMeal = useDeleteMeal(ctx.baby.id)
  const today = todayStr()
  const { eaten, planned } = useMemo(
    () => foodStatuses(meals.data ?? [], ctx.baby.knownIngredients, today),
    [meals.data, ctx.baby.knownIngredients, today],
  )

  // 캘린더에서 새로 들어온 재료는 팝업을 닫을 때 하나씩 붙인다. 그 전까지는 빈칸으로 둔다
  const [fresh, setFresh] = useState<{ ids: string[]; first: boolean } | null>(null)
  const [held, setHeld] = useState<Set<string>>(new Set())
  const [anim, setAnim] = useState<Map<string, Anim>>(new Map())
  const [selected, setSelected] = useState<string | null>(null)
  const [planning, setPlanning] = useState<{ food: string; date: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!meals.data) return
    const fromMeals = [...eaten.entries()].filter(([, s]) => s.source === 'meal').map(([id]) => id)
    const seen = readSeen(ctx.baby.id)
    const seenSet = new Set(seen ?? [])
    const added = fromMeals.filter((id) => !seenSet.has(id))
    writeSeen(ctx.baby.id, [...new Set([...seenSet, ...fromMeals])])
    if (!added.length) return
    // FOODS 순서대로 보여주고 붙인다
    const order = FOODS.map((x) => x.id).filter((id) => added.includes(id))
    setFresh({ ids: order, first: seen === null })
    setHeld(new Set(order))
  }, [meals.data, ctx.baby.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function setOne(id: string, a: Anim | null) {
    setAnim((prev) => {
      const next = new Map(prev)
      if (a) next.set(id, a)
      else next.delete(id)
      return next
    })
  }

  function closePopup() {
    if (!fresh) return
    const ids = fresh.ids
    setFresh(null)
    cellRefs.current[ids[0]]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    ids.forEach((id, i) => {
      setTimeout(() => {
        setHeld((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        setOne(id, 'on')
      }, 350 + i * 110)
    })
  }

  /** 먹어본 재료 목록을 바로 바꿔 화면에 반영하고, 저장은 뒤에서 한다 */
  async function saveKnown(next: string[]) {
    const prev = ctx.baby.knownIngredients
    const patch = (list: string[]) =>
      qc.setQueryData<StoredContext | null>(['context'], (old) =>
        old ? { ...old, babies: old.babies.map((b) => (b.id === ctx.baby.id ? { ...b, knownIngredients: list } : b)) } : old,
      )
    patch(next)
    try {
      await repo.updateBaby(ctx.baby.id, { knownIngredients: next })
    } catch (e) {
      patch(prev)
      setToast((e as Error).message || '저장하지 못했어요')
    }
    qc.invalidateQueries({ queryKey: ['context'] })
  }

  // 시트가 내려간 뒤에 붙이고 떼야 칸에서 애니메이션이 보인다
  function markEaten(food: Food) {
    setSelected(null)
    if (eaten.has(food.id)) return
    const next = [...ctx.baby.knownIngredients, food.id]
    setTimeout(() => {
      setOne(food.id, 'on')
      saveKnown(next)
    }, 200)
  }

  function markNotEaten(food: Food) {
    const st = eaten.get(food.id)
    if (!st || st.source !== 'known') return
    setSelected(null)
    const next = ctx.baby.knownIngredients.filter((n) => !matchFoods(n).includes(food.id))
    setTimeout(() => {
      setOne(food.id, 'off')
      saveKnown(next)
    }, 200)
  }

  const count = FOODS.filter((x) => eaten.has(x.id)).length
  const shown = count - [...held].filter((id) => eaten.has(id)).length

  return (
    <div className="px-3 pt-[max(14px,env(safe-area-inset-top))]">
      <header className="flex items-end justify-between px-1">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-ink-soft">
            {ctx.babies.length > 1 ? <BabySwitcher /> : <span>{ctx.baby.name} ·</span>}
            <span>오늘 D+{dPlus(ctx.baby.birthDate, today)}</span>
          </div>
          <h1 className="title-serif text-[42px] leading-[0.95] italic">Foods</h1>
        </div>
        <Link to="/export/foods" className="btn btn-soft mb-1 px-3.5 py-2 text-[13px]">
          <ImageDown size={16} strokeWidth={1.6} />
          이미지로
        </Link>
      </header>

      <section className="paper-texture mt-3 rounded-[22px] px-3 pt-4 pb-4 shadow-[0_6px_24px_rgba(90,60,40,0.08)]">
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="font-batang text-[19px] font-bold">첫 맛 도감</p>
            <p className="mt-0.5 text-[12px] text-ink-soft">돌 전까지 먹어보면 좋은 식재료 {FOODS.length}가지</p>
          </div>
          <p className="date-serif text-[30px] leading-none">
            {shown}
            <span className="text-[18px] text-ink-faint"> / {FOODS.length}</span>
          </p>
        </div>
        <div className="mx-1 mt-2.5 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-rose transition-[width] duration-500" style={{ width: `${(shown / FOODS.length) * 100}%` }} />
        </div>
        <p className="mt-2 px-1 text-[11px] text-ink-faint">
          캘린더에 먹인 재료는 자동으로 붙어요. 칸을 눌러 직접 붙이거나 식단을 짤 수 있어요.
          <span className="ml-1 inline-flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-alert/70" /> 흔한 알레르기 식품
          </span>
        </p>

        {FOOD_CATEGORIES.map((cat) => (
          <div key={cat.id} className="mt-5">
            <p className="flex items-baseline gap-2 border-b border-dashed border-line-strong px-1 pb-1">
              <span className="text-[14px] font-bold">{cat.label}</span>
              <span className="title-serif text-[14px] text-ink-soft italic">{cat.en}</span>
            </p>
            <div className="mt-2 grid grid-cols-5 gap-y-2">
              {FOODS.filter((x) => x.cat === cat.id).map((food) => {
                const a = anim.get(food.id)
                const on = eaten.has(food.id) && !held.has(food.id)
                return (
                  <button
                    key={food.id}
                    ref={(el) => {
                      cellRefs.current[food.id] = el
                    }}
                    className="relative flex flex-col items-center rounded-xl py-1 active:bg-rose-soft/60"
                    onClick={() => setSelected(food.id)}
                  >
                    <span className="relative h-[44px] w-[44px]">
                      <FoodIcon id={food.id} size={44} className="food-blank absolute inset-0" />
                      {(on || a === 'off') && (
                        <span
                          className={`absolute inset-0 ${a === 'on' ? 'sticker-on' : a === 'off' ? 'sticker-off' : ''}`}
                          onAnimationEnd={() => setOne(food.id, null)}
                        >
                          <FoodIcon id={food.id} size={44} className="sticker" />
                        </span>
                      )}
                      {a === 'on' && <span className="sticker-burst pointer-events-none absolute -inset-1 rounded-full border-2 border-rose" />}
                      {food.allergen && <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-alert/70" />}
                    </span>
                    <span className={`mt-1 text-[11px] leading-tight ${on ? 'text-ink' : 'text-ink-faint'}`}>{food.id}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[96px] z-40 flex justify-center">
          <p className="rounded-full bg-ink/85 px-4 py-2 text-[13px] text-paper shadow-lg">{toast}</p>
        </div>
      )}

      {fresh && <FreshPopup ids={fresh.ids} first={fresh.first} onClose={closePopup} />}

      {selected && (
        <FoodSheet
          food={FOOD_BY_ID.get(selected)!}
          status={eaten.get(selected) ?? null}
          plannedDate={planned.get(selected) ?? null}
          analysis={analysis}
          eatenNames={FOODS.filter((x) => eaten.has(x.id)).map((x) => x.id)}
          onEaten={markEaten}
          onNotEaten={markNotEaten}
          onPlan={(date) => {
            setPlanning({ food: selected, date })
            setSelected(null)
          }}
          onClose={() => setSelected(null)}
        />
      )}

      {planning && (
        <MealSheet
          babyId={ctx.baby.id}
          date={planning.date}
          slot={nextMealSlot((meals.data ?? []).filter((m) => m.date === planning.date))}
          meal={null}
          initialItems={[{ name: planning.food, grams: null }]}
          allMeals={meals.data ?? []}
          intervalDays={ctx.baby.testIntervalDays}
          knownIngredients={ctx.baby.knownIngredients}
          ingredientNames={[...new Set([...ctx.baby.knownIngredients, ...analysis.tests.map((t) => t.name)])]}
          defaultStyle={ctx.baby.feedingStyle}
          onSave={async (m) => {
            await saveMeal.mutateAsync(m)
            setToast(`${format(parseISO(m.date), 'M월 d일')} 식단에 넣었어요`)
          }}
          onDelete={(id) => deleteMeal.mutate(id)}
          onClose={() => setPlanning(null)}
        />
      )}
    </div>
  )
}

/** 캘린더에서 새로 먹은 재료를 알려주는 팝업 */
function FreshPopup({ ids, first, onClose }: { ids: string[]; first: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-6" onClick={onClose}>
      <div className="paper-texture pop-in w-full max-w-[360px] rounded-[26px] px-5 pt-6 pb-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Sparkles size={26} strokeWidth={1.4} className="mx-auto text-rose-deep" />
        <p className="mt-2 font-batang text-[19px] font-bold">
          {first ? `지금까지 ${ids.length}개 재료를 도전했어요!` : `${ids.length}개의 재료를 추가로 도전했어요!`}
        </p>
        <p className="mt-1 text-[12px] text-ink-soft">캘린더 기록에서 찾았어요. 스티커를 붙여 볼까요?</p>
        <div className="mt-4 flex max-h-[42vh] flex-wrap justify-center gap-x-1 gap-y-2 overflow-y-auto">
          {ids.map((id) => (
            <span key={id} className="flex w-[60px] flex-col items-center">
              <FoodIcon id={id} size={38} className="sticker" />
              <span className="mt-0.5 text-[11px]">{id}</span>
            </span>
          ))}
        </div>
        <button className="btn btn-primary mt-5 w-full" onClick={onClose}>
          스티커 붙이기
        </button>
      </div>
    </div>
  )
}

/** 재료 하나: 먹었어요/안 먹었어요 표시와 식단 계획 */
function FoodSheet({
  food,
  status,
  plannedDate,
  analysis,
  eatenNames,
  onEaten,
  onNotEaten,
  onPlan,
  onClose,
}: {
  food: Food
  status: FoodStatus | null
  plannedDate: string | null
  analysis: IngredientAnalysis
  eatenNames: string[]
  onEaten: (f: Food) => void
  onNotEaten: (f: Food) => void
  onPlan: (date: string) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const tried = !!status
  const today = todayStr()

  // 앞으로 2주. 다른 새 재료를 테스트 중인 날은 새 재료를 넣기 좋지 않다
  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const date = ymd(addDays(parseISO(today), i))
        const testing = analysis.tests.find((t) => date >= t.start && date <= t.end && !matchFoods(t.name).includes(food.id))
        return { date, testing: testing?.name ?? null }
      }),
    [analysis, food.id, today],
  )
  const recommended = tried ? null : (days.find((d) => !d.testing)?.date ?? null)
  const [date, setDate] = useState(recommended ?? today)
  const picked = days.find((d) => d.date === date)
  const pairs = pairingSuggestions([food.id], eatenNames, 5)[0]?.names ?? []

  function goToMeal(mealDate: string) {
    navigate(`/week/${weekStartOf(mealDate)}?d=${mealDate}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25" onClick={onClose}>
      <div
        className="paper-texture sheet-up safe-bottom max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[26px] px-5 pt-4 pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <div className="flex items-start gap-4">
          <FoodIcon id={food.id} size={68} className={tried ? 'sticker' : 'food-blank'} />
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[12px] text-ink-soft">{FOOD_CATEGORIES.find((c) => c.id === food.cat)?.label}</p>
            <p className="pen text-[30px] leading-tight">{food.id}</p>
            {food.allergen && <p className="text-[11px] text-alert/80">흔한 알레르기 식품이에요. 처음엔 소량으로, 오전에 주세요.</p>}
          </div>
          <button aria-label="닫기" className="p-1 text-ink-soft" onClick={onClose}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        <p className="mt-3 rounded-xl bg-card px-3 py-2 text-[13px] text-ink-soft">
          {status?.source === 'meal' && status.date ? (
            <>
              <button className="underline decoration-dotted underline-offset-2" onClick={() => goToMeal(status.date!)}>
                {format(parseISO(status.date), 'M월 d일 (EEE)', { locale: ko })}
              </button>{' '}
              캘린더에 처음 먹은 기록이 있어요.
            </>
          ) : status?.source === 'known' ? (
            '먹어봤어요로 직접 표시한 재료예요.'
          ) : plannedDate ? (
            <>
              <button className="underline decoration-dotted underline-offset-2" onClick={() => goToMeal(plannedDate)}>
                {format(parseISO(plannedDate), 'M월 d일 (EEE)', { locale: ko })}
              </button>{' '}
              식단에 계획돼 있어요.
            </>
          ) : (
            '아직 안 먹어봤어요.'
          )}
        </p>

        <div className="mt-3 flex gap-2">
          <button
            className={`btn flex-1 border ${tried ? 'border-ink bg-ink text-paper' : 'border-line text-ink-soft'}`}
            onClick={() => onEaten(food)}
          >
            <Check size={16} /> 먹었어요
          </button>
          <button
            className={`btn flex-1 border ${!tried ? 'border-ink bg-card text-ink' : 'border-line text-ink-soft'}`}
            onClick={() => onNotEaten(food)}
            disabled={status?.source === 'meal'}
          >
            안 먹었어요
          </button>
        </div>
        {status?.source === 'meal' && (
          <p className="mt-1.5 text-[11px] text-ink-faint">캘린더 기록에서 붙은 스티커예요. 캘린더에서 이 재료를 빼면 떼져요.</p>
        )}

        <div className="mt-5 border-t border-dashed border-line-strong pt-4">
          <p className="flex items-center gap-1.5 text-[14px] font-bold">
            <CalendarPlus size={16} strokeWidth={1.6} /> 식단 계획하기
          </p>
          <p className="mt-0.5 text-[11px] text-ink-faint">
            {tried ? '날짜를 고르면 이 재료를 넣은 식단을 짤 수 있어요.' : '다른 새 재료를 테스트하지 않는 날이 좋아요.'}
          </p>
          <div className="no-scrollbar -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {days.map((d) => {
              const busy = !tried && !!d.testing
              const sel = d.date === date
              return (
                <button
                  key={d.date}
                  onClick={() => setDate(d.date)}
                  className={`relative flex w-[46px] shrink-0 flex-col items-center rounded-xl border py-1.5 ${
                    sel ? 'border-ink bg-card' : 'border-line'
                  } ${busy ? 'text-ink-faint' : ''}`}
                >
                  <span className="text-[10px]">{format(parseISO(d.date), 'EEE', { locale: ko })}</span>
                  <span className="date-serif text-[18px] leading-none">{parseISO(d.date).getDate()}</span>
                  {d.date === recommended && <span className="mt-0.5 text-[9px] text-rose-deep">추천</span>}
                  {busy && <span className="mt-0.5 h-1 w-1 rounded-full bg-warn/70" />}
                </button>
              )
            })}
          </div>
          {!tried && picked?.testing && (
            <p className="mt-1.5 text-[12px] text-warn">이날은 {picked.testing} 테스트 기간이에요.</p>
          )}
          {pairs.length > 0 && (
            <p className="mt-2 text-[12px] text-ink-soft">
              함께 주면 좋은 먹어본 재료 · <span className="pen text-[17px] text-ink">{pairs.join(', ')}</span>
            </p>
          )}
          <button className="btn btn-primary mt-3 w-full" onClick={() => onPlan(date)}>
            {format(parseISO(date), 'M월 d일 (EEE)', { locale: ko })} 식단 짜기
          </button>
        </div>
      </div>
    </div>
  )
}
