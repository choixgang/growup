import { addMonths, format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, ImageDown } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCtx } from '../App'
import MonthGrid from '../components/MonthGrid'
import MonthInfo from '../components/MonthInfo'
import BabySwitcher from '../components/BabySwitcher'
import { useAnalysis, useMeals, useMonthNote, useSaveMonthNote } from '../data/hooks'
import { todayStr, weekStartOf, ym } from '../lib/dates'
import { dPlus } from '../lib/rules'

export default function MonthPage() {
  const ctx = useCtx()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const month = params.get('m') ?? ym(new Date())
  const monthDate = parseISO(`${month}-01`)

  const meals = useMeals(ctx.baby.id)
  const analysis = useAnalysis(meals.data, ctx)
  const note = useMonthNote(ctx.baby.id, month)
  const saveNote = useSaveMonthNote()

  const go = (delta: number) => setParams({ m: ym(addMonths(monthDate, delta)) }, { replace: true })
  const monthWarnings = analysis.warnings.filter((w) => w.date.startsWith(month))

  return (
    <div className="px-3 pt-[max(14px,env(safe-area-inset-top))]">
      <header className="flex items-end justify-between px-1">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-ink-soft">
            {ctx.babies.length > 1 ? <BabySwitcher /> : <span>{ctx.baby.name} ·</span>}
            <span>오늘 D+{dPlus(ctx.baby.birthDate, todayStr())}</span>
          </div>
          <h1 className="title-serif text-[42px] leading-[0.95] italic">Monthly</h1>
        </div>
        <Link to={`/export/${month}`} className="btn btn-soft mb-1 px-3.5 py-2 text-[13px]">
          <ImageDown size={16} strokeWidth={1.6} />
          이미지로
        </Link>
      </header>

      <section className="paper-texture mt-3 rounded-[22px] px-3 pt-4 pb-3 shadow-[0_6px_24px_rgba(90,60,40,0.08)]">
        <div className="flex items-center justify-between px-1">
          <div className="flex shrink-0 items-center gap-1">
            <button aria-label="이전 달" className="p-1 text-ink-soft" onClick={() => go(-1)}>
              <ChevronLeft size={18} />
            </button>
            <div className="flex h-[58px] w-[58px] flex-col items-center justify-center rounded-full bg-rose-soft">
              <span className="date-serif mb-1 text-[11px] leading-none text-ink-soft">{format(monthDate, 'yyyy')}</span>
              <span className="date-serif text-[24px] leading-none">{format(monthDate, 'M')}월</span>
            </div>
            <button aria-label="다음 달" className="p-1 text-ink-soft" onClick={() => go(1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {note.data && (
          <div className="mt-3 px-1">
            <MonthInfo variant="app" note={note.data} onChange={(n) => saveNote.mutate(n)} />
          </div>
        )}

        <div className="mt-4">
          <MonthGrid
            variant="app"
            month={month}
            meals={meals.data ?? []}
            analysis={analysis}
            birthDate={ctx.baby.birthDate}
            onSelectDate={(d) => navigate(`/week/${weekStartOf(d)}?d=${d}`)}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-ink-soft">
          <span className="flex items-center gap-1">
            <span className="tape inline-block h-[8px] w-[22px] bg-[#e9b8b0]" /> 새 재료 테스트 기간
          </span>
          <span className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] rounded-full border border-ink-faint" /> 계획
          </span>
          <span className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] rounded-full bg-ink-soft" /> 먹임
          </span>
          <span className="flex items-center gap-1">
            <span className="h-[5px] w-[5px] rounded-full bg-warn" /> 이상 반응
          </span>
        </div>
      </section>

      {monthWarnings.length > 0 && (
        <section className="mt-4 rounded-2xl border border-warn/30 bg-card px-4 py-3">
          <p className="text-[13px] font-bold text-warn">새 재료 간격 확인</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {monthWarnings.map((w) => (
              <li key={w.date + w.name}>
                <button
                  className="pen text-left text-[18px]"
                  onClick={() => navigate(`/week/${weekStartOf(w.date)}?d=${w.date}`)}
                >
                  <span className="date-serif text-[15px] text-ink-soft">{format(parseISO(w.date), 'M/d')}</span> · {w.message}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {meals.data && meals.data.length === 0 && (
        <p className="mt-6 text-center text-[13px] leading-relaxed text-ink-soft">
          날짜를 눌러 첫 이유식 식단을 적어보세요.
          <br />
          처음 넣는 재료는 자동으로 테이프가 붙어요.
        </p>
      )}
    </div>
  )
}
