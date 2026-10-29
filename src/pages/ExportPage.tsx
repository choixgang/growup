import { format, parseISO } from 'date-fns'
import { Heart, HeartCrack, Sprout } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useCtx } from '../App'
import ExportShell, { PaperSheet } from '../components/ExportShell'
import MonthGrid from '../components/MonthGrid'
import MonthInfo from '../components/MonthInfo'
import { useAnalysis, useMeals, useMonthNote } from '../data/hooks'
import { summarizeMonth } from '../lib/rules'

export default function ExportPage() {
  const ctx = useCtx()
  const { month = format(new Date(), 'yyyy-MM') } = useParams()
  const meals = useMeals(ctx.baby.id)
  const analysis = useAnalysis(meals.data, ctx)
  const note = useMonthNote(ctx.baby.id, month)

  return (
    <ExportShell fileName={`이유식-${month}.jpg`} shareTitle={`${format(parseISO(`${month}-01`), 'M월')} 이유식`}>
      <PaperSheet seed={parseInt(month.slice(5), 10)}>
        {note.data && (
          <>
            <SheetHeader month={month} babyName={ctx.baby.name}>
              <MonthInfo variant="export" note={note.data} />
            </SheetHeader>
            <div className="mt-8">
              <MonthGrid
                variant="export"
                month={month}
                meals={meals.data ?? []}
                analysis={analysis}
                birthDate={ctx.baby.birthDate}
              />
            </div>
            <SummaryBoxes summary={summarizeMonth(meals.data ?? [], analysis, month)} />
          </>
        )}
      </PaperSheet>
    </ExportShell>
  )
}

function SheetHeader({ month, babyName, children }: { month: string; babyName: string; children: React.ReactNode }) {
  const d = parseISO(`${month}-01`)
  return (
    <div className="flex items-start justify-between gap-10">
      <div className="flex items-center gap-8">
        <div className="flex h-[150px] w-[150px] shrink-0 flex-col items-center justify-center rounded-full bg-[#e9e2da]">
          <span className="date-serif mb-2 text-[22px] leading-none text-ink-soft">{format(d, 'yyyy')}</span>
          <span className="date-serif text-[52px] leading-none">{format(d, 'M')}월</span>
        </div>
        <div>
          <p className="font-batang text-[52px] leading-none font-bold whitespace-nowrap">이유식 식단표</p>
          <p className="mt-3 text-[20px] text-ink-soft">{babyName} · 우리가 함께 기록한 한 달</p>
        </div>
      </div>
      <div className="w-[560px] pt-2">{children}</div>
    </div>
  )
}

/** 달력 아래: 이 달에 새로 먹어본 재료 · 좋아한 재료 · 싫어한 재료 */
function SummaryBoxes({ summary }: { summary: ReturnType<typeof summarizeMonth> }) {
  const boxes = [
    { title: '새로 먹어본 재료', Icon: Sprout, names: summary.newNames },
    { title: '좋아한 재료', Icon: Heart, names: summary.liked },
    { title: '싫어한 재료', Icon: HeartCrack, names: summary.disliked },
  ]
  return (
    <div className="mt-10 grid grid-cols-3 gap-6">
      {boxes.map((b) => (
        <div key={b.title} className="rounded-[28px] bg-[#efe7dc] px-7 pt-5 pb-6">
          <p className="flex items-center gap-2 text-[22px] font-bold text-ink-soft">
            <b.Icon size={24} strokeWidth={1.8} />
            {b.title}
            <span className="date-serif ml-auto text-[24px] font-normal">{b.names.length || ''}</span>
          </p>
          <p className="pen mt-3 text-[30px] leading-[1.25] break-keep">
            {b.names.length ? b.names.join(', ') : <span className="text-ink-faint">—</span>}
          </p>
        </div>
      ))}
    </div>
  )
}
