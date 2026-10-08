import { parseISO } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { circled, DAY_LABELS_EN, monthWeeks, stripsForWeek, todayStr } from '../lib/dates'
import { dPlus, itemReaction, normalizeName, strongerReaction, tapeColor, type IngredientAnalysis } from '../lib/rules'
import { REACTION_EMOJI, type ItemReaction, type Meal } from '../lib/types'

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
                    <AppCellBody meals={dayMeals} entries={dayEntries(dayMeals, newKeys, analysis)} />
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
                  {(isExport || s.endCol > s.startCol) && (
                    <span
                      className={`pen truncate text-ink/80 ${isExport ? 'pl-3 text-[20px]' : 'pl-1.5 text-[10.5px] leading-none'}`}
                    >
                      {s.isStart ? s.test.name : `${s.test.name} ·`}
                    </span>
                  )}
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

/** 칸에 보여줄 재료: 새 재료, 반응을 고른 재료, 이상 반응이 있었던 재료. 눈여겨볼 순서로 */
function dayEntries(meals: Meal[], newKeys: string[], analysis: IngredientAnalysis): DayEntry[] {
  const byKey = new Map<string, DayEntry>()
  for (const m of meals) {
    for (const it of m.items) {
      const key = normalizeName(it.name)
      if (!key) continue
      const prev = byKey.get(key)
      byKey.set(key, {
        key,
        name: prev?.name ?? it.name.trim(),
        isNew: newKeys.includes(key),
        caution: analysis.cautionKeys.has(key),
        reaction: strongerReaction(prev?.reaction ?? null, itemReaction(m, key)),
      })
    }
  }
  const rank = (e: DayEntry) =>
    e.reaction === 'issue' ? 0 : e.isNew ? 1 : e.caution ? 2 : e.reaction === 'dislike' ? 3 : e.reaction === 'like' ? 4 : 5
  return [...byKey.values()].filter((e) => e.isNew || e.caution || e.reaction).sort((a, b) => rank(a) - rank(b))
}

function AppCellBody({ meals, entries }: { meals: Meal[]; entries: DayEntry[] }) {
  if (!meals.length) return null
  return (
    <div className="mt-0.5 flex min-w-0 flex-col gap-[1px]">
      {entries.slice(0, 2).map((e) => (
        <span key={e.key} className="flex min-w-0 items-center">
          <span
            className={`pen truncate text-[14px] leading-[1.05] ${
              e.caution || e.reaction === 'issue' ? 'text-alert' : e.isNew ? 'text-rose-deep' : ''
            }`}
          >
            {e.isNew ? '+' : ''}
            {e.name}
          </span>
          {e.reaction && <span className="shrink-0 text-[8.5px] leading-none">{REACTION_EMOJI[e.reaction]}</span>}
        </span>
      ))}
      {entries.length > 2 && <span className="pen text-[11px] leading-none text-ink-soft">+{entries.length - 2}</span>}
      <div className="mt-[2px] flex gap-[3px] pl-[1px]">
        {meals.map((m) => (
          <span
            key={m.id}
            className={`h-[5px] w-[5px] rounded-full ${
              m.log ? (m.log.reaction === 'issue' ? 'bg-alert' : 'bg-ink-soft') : 'border border-ink-faint'
            }`}
          />
        ))}
      </div>
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
      emoji: r ? REACTION_EMOJI[r] : '',
    }
  }
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {meals.map((m) => {
        if (m.style === 'porridge') {
          const flagged = m.items.filter((it) => {
            const x = mark(m, it.name)
            return x.red || x.emoji
          })
          return (
            <div key={m.id} className="pen text-[29px] leading-[1.08] break-all">
              {multi ? `${circled(m.slot)} ` : ''}
              {m.title || m.items.map((it) => it.name).join('·')}
              {m.totalMl != null ? ` ${m.totalMl}ml` : ''}
              {flagged.map((it, i) => {
                const x = mark(m, it.name)
                return (
                  <div key={i} className={`text-[24px] whitespace-nowrap ${x.red ? 'text-alert' : 'text-ink-soft'}`}>
                    {it.name}
                    {x.emoji && <span className="ml-0.5 text-[16px]">{x.emoji}</span>}
                  </div>
                )
              })}
            </div>
          )
        }
        return (
          <div key={m.id} className="pen text-[29px] leading-[1.08]">
            {m.items.map((it, i) => {
              const x = mark(m, it.name)
              return (
                <div key={i} className={`whitespace-nowrap ${x.red ? 'text-alert' : ''}`}>
                  {multi && i === 0 ? `${circled(m.slot)} ` : multi ? ' ' : ''}
                  {it.name}
                  {it.grams != null ? ` ${it.grams}g` : ''}
                  {x.emoji && <span className="ml-0.5 text-[16px]">{x.emoji}</span>}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
