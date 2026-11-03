import { parseISO } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { DAY_LABELS_EN, monthWeeks, stripsForWeek, todayStr } from '../lib/dates'
import { dPlus, itemReaction, mealReactions, normalizeName, strongerReaction, tapeColor, type IngredientAnalysis } from '../lib/rules'
import { mealTypeLabel, type ItemReaction, type Meal } from '../lib/types'
import ReactionIcon from './ReactionIcon'

interface Props {
  month: string
  meals: Meal[]
  analysis: IngredientAnalysis
  birthDate: string
  variant: 'app' | 'export'
  onSelectDate?: (date: string) => void
}

/**
 * 먼슬리 달력. 앱에서는 요약(새 재료·끼니 점)만, 내보내기에서는 재료+g 전부를 손글씨로 보여준다.
 * 새 재료 테스트 기간은 주마다 마스킹테이프 띠로 이어 그린다.
 */
export default function MonthGrid({ month, meals, analysis, birthDate, variant, onSelectDate }: Props) {
  const weeks = monthWeeks(month)
  const isExport = variant === 'export'
  const today = todayStr()
  const byDate = new Map<string, Meal[]>()
  for (const m of meals) {
    const list = byDate.get(m.date) ?? []
    list.push(m)
    byDate.set(m.date, list)
  }
  for (const list of byDate.values()) list.sort((a, b) => a.slot - b.slot)

  const laneH = isExport ? 22 : 12
  const laneGap = isExport ? 4 : 3

  return (
    <div className={isExport ? 'text-ink' : 'text-ink select-none'}>
      <div className={`grid grid-cols-7 ${isExport ? 'border-b-2 border-ink/70' : 'rounded-t-xl bg-rose-soft'}`}>
        {DAY_LABELS_EN.map((d, i) => (
          <div
            key={d}
            className={`title-serif text-center ${
              isExport ? 'py-2 text-[17px] tracking-[0.12em] uppercase' : 'py-1.5 text-[13px]'
            } ${i === 0 ? 'text-rose-deep' : ''}`}
          >
            {isExport ? ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][i] : d}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => {
        const dates = week.map((c) => c.date)
        const strips = stripsForWeek(dates, analysis.tests)
        const lanes = strips.reduce((n, s) => Math.max(n, s.lane + 1), 0)
        const stripSpace = lanes ? lanes * (laneH + laneGap) + 4 : 0
        return (
          <div key={wi} className="relative grid grid-cols-7 border-b border-line">
            {week.map((cell, ci) => {
              const dayMeals = byDate.get(cell.date) ?? []
              const newKeys = analysis.newByDate.get(cell.date) ?? []
              const hasCaution = dayMeals.some((m) =>
                m.items.some((it) => analysis.cautionKeys.has(normalizeName(it.name))),
              )
              const day = parseISO(cell.date).getDate()
              const d = dPlus(birthDate, cell.date)
              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={isExport || !onSelectDate}
                  onClick={() => onSelectDate?.(cell.date)}
                  className={`relative flex flex-col items-stretch text-left ${ci > 0 ? 'border-l border-line' : ''} ${
                    isExport ? 'min-h-[236px] px-2.5 pt-2.5' : 'min-h-[92px] px-[3px] pt-1'
                  } ${!cell.inMonth ? 'opacity-35' : ''} ${
                    !isExport && cell.date === today ? 'bg-rose-soft/60' : ''
                  }`}
                  style={{ paddingBottom: stripSpace + (isExport ? 6 : 3) }}
                >
                  <div className={isExport ? 'flex items-center gap-1' : 'flex flex-col items-start'}>
                    <span
                      className={`hand-circle date-serif inline-flex shrink-0 items-center justify-center ${
                        isExport ? 'h-[36px] min-w-[36px] px-1 text-[21px]' : 'h-[21px] min-w-[21px] px-[2px] text-[13px]'
                      }`}
                    >
                      {day}
                    </span>
                    {d > 0 && (
                      <span
                        className={`date-serif whitespace-nowrap text-ink-soft ${
                          isExport ? 'text-[17px]' : 'mt-[2px] text-[10px] leading-none'
                        }`}
                      >
                        D+{d}
                      </span>
                    )}
                  </div>

                  {isExport ? (
                    <ExportCellBody meals={dayMeals} analysis={analysis} />
                  ) : (
                    <AppCellBody meals={dayMeals} newKeys={newKeys} analysis={analysis} />
                  )}

                  {hasCaution && (
                    <AlertTriangle
                      className={`absolute text-alert ${isExport ? 'top-2 right-2' : 'top-1 right-[3px]'}`}
                      size={isExport ? 16 : 10}
                      strokeWidth={2}
                    />
                  )}
                </button>
              )
            })}

            {/* 새 재료 테스트 기간 마스킹테이프 */}
            <div className="pointer-events-none absolute inset-x-0" style={{ bottom: isExport ? 8 : 4 }}>
              {strips.map((s) => (
                <div
                  key={s.test.key}
                  className="tape absolute flex items-center overflow-hidden"
                  style={{
                    left: `calc(${(s.startCol / 7) * 100}% + ${isExport ? 6 : 2}px)`,
                    width: `calc(${((s.endCol - s.startCol + 1) / 7) * 100}% - ${isExport ? 12 : 4}px)`,
                    bottom: s.lane * (laneH + laneGap),
                    height: laneH,
                    backgroundColor: tapeColor(s.test.colorIndex),
                    transform: `rotate(${((s.test.colorIndex * 37) % 5) * 0.18 - 0.36}deg)`,
                  }}
                >
                  {/* 하루짜리 띠도 이름을 보여준다 (좁으면 잘림) */}
                  <span
                    className={`pen truncate text-ink/80 ${isExport ? 'pl-3 text-[20px]' : 'pl-1 text-[10.5px] leading-none'}`}
                  >
                    {s.isStart ? s.test.name : `${s.test.name} ·`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface DayEntry {
  key: string
  name: string
  isNew: boolean
  caution: boolean
  reaction: ItemReaction | null
}

/** 한 끼니의 재료. 같은 재료는 한 번만. 새 재료 표시(+)는 그날 처음 나온 끼니에만 */
function mealEntries(m: Meal, newKeys: string[], analysis: IngredientAnalysis, shown: Set<string>): DayEntry[] {
  const byKey = new Map<string, DayEntry>()
  for (const it of m.items) {
    const key = normalizeName(it.name)
    if (!key) continue
    const prev = byKey.get(key)
    byKey.set(key, {
      key,
      name: prev?.name ?? it.name.trim(),
      isNew: newKeys.includes(key) && !shown.has(key),
      caution: analysis.cautionKeys.has(key),
      reaction: strongerReaction(prev?.reaction ?? null, itemReaction(m, key)),
    })
  }
  for (const k of byKey.keys()) shown.add(k)
  return [...byKey.values()]
}

/** 끼니마다 재료를 묶고 끼니 사이에 점선을 긋는다 */
function AppCellBody({ meals, newKeys, analysis }: { meals: Meal[]; newKeys: string[]; analysis: IngredientAnalysis }) {
  if (!meals.length) return null
  const shown = new Set<string>()
  return (
    <div className="mt-0.5 flex min-w-0 flex-col">
      {meals.map((m, mi) => (
        <div
          key={m.id}
          className={`flex min-w-0 flex-col gap-[1px] ${mi > 0 ? 'mt-[2px] border-t border-dashed border-line-strong pt-[2px]' : ''}`}
        >
          {/* 끼니 태그 오른쪽에 먹임 점과 끼니 전체 반응 */}
          <span className="flex min-w-0 items-center gap-[2px]">
            <span className="shrink-0 rounded-full bg-rose-soft px-[3px] text-[8.5px] leading-[1.35] text-ink-soft">
              {mealTypeLabel(m.slot)}
            </span>
            <span
              className={`h-[5px] w-[5px] shrink-0 rounded-full ${
                m.log ? (m.log.reaction === 'issue' ? 'bg-alert' : 'bg-ink-soft') : 'border border-ink-faint'
              }`}
            />
            {/* 이상 반응은 빨간 점으로 보인다 */}
            {mealReactions(m)
              .filter((r) => r !== 'issue')
              .map((r) => (
                <ReactionIcon key={r} reaction={r} className="shrink-0 text-[9px] leading-none" />
              ))}
          </span>
          {mealEntries(m, newKeys, analysis, shown).map((e) => (
            <span key={e.key} className="flex min-w-0 items-center">
              <span
                className={`pen truncate text-[14px] leading-[1.05] ${
                  e.caution || e.reaction === 'issue' ? 'text-alert' : e.isNew ? 'text-rose-deep' : ''
                }`}
              >
                {e.isNew ? '+' : ''}
                {e.name}
              </span>
              {e.reaction && <ReactionIcon reaction={e.reaction} className="ml-px shrink-0 text-[9px] leading-none" />}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

function ExportCellBody({ meals, analysis }: { meals: Meal[]; analysis: IngredientAnalysis }) {
  const multi = meals.length > 1
  const mark = (m: Meal, name: string) => {
    const key = normalizeName(name)
    const r = itemReaction(m, key)
    return {
      red: analysis.cautionKeys.has(key) || r === 'issue',
      reaction: r,
    }
  }
  return (
    <div className="mt-1.5 flex flex-col">
      {meals.map((m, mi) => {
        const sep = mi > 0 ? 'mt-1.5 border-t-[1.5px] border-dashed border-line-strong pt-1.5' : ''
        if (m.style === 'porridge') {
          const flagged = m.items.filter((it) => {
            const x = mark(m, it.name)
            return x.red || x.reaction
          })
          return (
            <div key={m.id} className={`pen text-[29px] leading-[1.08] break-all ${sep}`}>
              {multi && <ExportTag slot={m.slot} />}
              {m.title || m.items.map((it) => it.name).join('·')}
              {m.totalMl != null ? ` ${m.totalMl}ml` : ''}
              {mealReactions(m).map((r) => (
                <ReactionIcon key={r} reaction={r} className="ml-1 text-[20px]" />
              ))}
              {flagged.map((it, i) => {
                const x = mark(m, it.name)
                return (
                  <div key={i} className={`text-[24px] whitespace-nowrap ${x.red ? 'text-alert' : 'text-ink-soft'}`}>
                    {it.name}
                    {x.reaction && <ReactionIcon reaction={x.reaction} className="ml-1 text-[20px]" />}
                  </div>
                )
              })}
            </div>
          )
        }
        return (
          <div key={m.id} className={`pen text-[29px] leading-[1.08] ${sep}`}>
            {multi && <ExportTag slot={m.slot} />}
            {m.items.map((it, i) => {
              const x = mark(m, it.name)
              return (
                <div key={i} className={`whitespace-nowrap ${x.red ? 'text-alert' : ''}`}>
                  {it.name}
                  {it.grams != null ? ` ${it.grams}g` : ''}
                  {x.reaction && <ReactionIcon reaction={x.reaction} className="ml-1 text-[20px]" />}
                  {i === m.items.length - 1 &&
                    mealReactions(m).map((r) => <ReactionIcon key={r} reaction={r} className="ml-1 text-[20px]" />)}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function ExportTag({ slot }: { slot: number }) {
  return (
    <div
      className="mb-0.5 w-fit rounded-full bg-rose-soft px-2 text-[15px] leading-[1.5] text-ink-soft"
      style={{ fontFamily: 'var(--font-batang)' }}
    >
      {mealTypeLabel(slot)}
    </div>
  )
}
