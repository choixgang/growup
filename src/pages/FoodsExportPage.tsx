import { useMemo } from 'react'
import { format } from 'date-fns'
import { useCtx } from '../App'
import ExportShell, { PaperSheet } from '../components/ExportShell'
import FoodIcon from '../components/FoodIcon'
import { useMeals } from '../data/hooks'
import { todayStr } from '../lib/dates'
import { FOOD_CATEGORIES, FOODS, foodStatuses } from '../lib/foods'

/** 첫 맛 도감을 종이 한 장 이미지로 */
export default function FoodsExportPage() {
  const ctx = useCtx()
  const meals = useMeals(ctx.baby.id)
  const today = todayStr()
  const { eaten } = useMemo(
    () => foodStatuses(meals.data ?? [], ctx.baby.knownIngredients),
    [meals.data, ctx.baby.knownIngredients],
  )
  const count = FOODS.filter((x) => eaten.has(x.id)).length

  return (
    <ExportShell
      fileName={`첫맛도감-${today}.jpg`}
      shareTitle={`${ctx.baby.name}의 첫 맛 도감`}
      pages={[
        <PaperSheet key="foods" seed={count}>
          <div className="flex items-center gap-8">
            <div className="flex h-[150px] w-[150px] shrink-0 flex-col items-center justify-center rounded-full bg-[#e9e2da]">
              <span className="date-serif text-[58px] leading-none">{count}</span>
              <span className="date-serif mt-1 text-[22px] leading-none text-ink-soft">/ {FOODS.length}</span>
            </div>
            <div>
              <p className="font-batang text-[52px] leading-none font-bold whitespace-nowrap">첫 맛 도감</p>
              <p className="mt-3 text-[20px] text-ink-soft">
                {ctx.baby.name} · 먹어본 식재료 {count}가지 · {format(new Date(), 'yyyy.M.d')} 기준
              </p>
            </div>
          </div>

          <div className="mt-6">
            {FOOD_CATEGORIES.map((cat) => (
              <div key={cat.id} className="mt-7">
                <p className="flex items-baseline gap-3 border-b-2 border-dashed border-line-strong pb-2">
                  <span className="text-[24px] font-bold">{cat.label}</span>
                  <span className="title-serif text-[24px] text-ink-soft italic">{cat.en}</span>
                </p>
                <div className="mt-3 grid grid-cols-12 gap-y-3">
                  {FOODS.filter((x) => x.cat === cat.id).map((food) => {
                    const on = eaten.has(food.id)
                    return (
                      <div key={food.id} className="flex flex-col items-center">
                        <FoodIcon id={food.id} size={70} className={on ? 'sticker-lg' : 'food-blank'} />
                        <span className={`mt-1 text-[15px] whitespace-nowrap ${on ? 'text-ink' : 'text-ink-faint'}`}>{food.id}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </PaperSheet>,
      ]}
    />
  )
}
