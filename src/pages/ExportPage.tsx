import { useLayoutEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Heart, HeartCrack, Sprout } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useCtx } from '../App'
import ExportShell, { PaperSheet, SCENE_PAD_Y, SCENE_W } from '../components/ExportShell'
import MonthGrid from '../components/MonthGrid'
import MonthInfo from '../components/MonthInfo'
import { useAnalysis, useMeals, useMonthNote } from '../data/hooks'
import { monthWeeks } from '../lib/dates'
import { summarizeMonth } from '../lib/rules'

/** 장면이 이보다 길면 주 단위로 나눠 여러 장으로 만든다 (가로:세로 ≈ 1:1.8, 휴대폰 한 화면) */
const MAX_SCENE_H = SCENE_W * 1.8

export default function ExportPage() {
  const ctx = useCtx()
  const { month = format(new Date(), 'yyyy-MM') } = useParams()
  const meals = useMeals(ctx.baby.id)
  const analysis = useAnalysis(meals.data, ctx)
  const note = useMonthNote(ctx.baby.id, month)
  const weekCount = monthWeeks(month).length

  // 한 장으로 그린 모습을 화면 밖에서 재서 몇 주씩 나눌지 정한다
  const measureRef = useRef<HTMLDivElement>(null)
  const [groups, setGroups] = useState<[number, number][]>([[0, weekCount]])
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const update = () => {
      const next = splitWeeks(el)
      setGroups((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [note.data, weekCount])

  const sheet = (range: [number, number], page: number, total: number) => (
    <PaperSheet key={page} seed={parseInt(month.slice(5), 10) + page}>
      {note.data && (
        <>
          <SheetHeader month={month} babyName={ctx.baby.name} page={total > 1 ? `${page + 1}/${total}` : null}>
            <MonthInfo variant="export" note={note.data} />
          </SheetHeader>
          <div className="mt-8">
            <MonthGrid
              variant="export"
              month={month}
              meals={meals.data ?? []}
              analysis={analysis}
              birthDate={ctx.baby.birthDate}
              weekRange={range}
            />
          </div>
          {page === total - 1 && <SummaryBoxes summary={summarizeMonth(meals.data ?? [], analysis, month)} />}
        </>
      )}
    </PaperSheet>
  )

  return (
    <>
      <ExportShell
        fileName={`이유식-${month}.jpg`}
        shareTitle={`${format(parseISO(`${month}-01`), 'M월')} 이유식`}
        pages={groups.map((g, i) => sheet(g, i, groups.length))}
      />
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible fixed top-0 left-[-100000px] px-[110px] text-ink"
        style={{ width: SCENE_W, paddingTop: SCENE_PAD_Y, paddingBottom: SCENE_PAD_Y }}
      >
        {sheet([0, weekCount], 0, 1)}
      </div>
    </>
  )
}

/**
 * 한 장짜리 장면의 높이로 나눌 주를 정한다. 가장 적은 장 수로, 장마다 길이가 고르게 되도록
 * (가장 긴 장이 가장 짧아지게) 이어진 주들을 묶는다. 요약 칸은 마지막 장에만 들어간다.
 */
function splitWeeks(el: HTMLElement): [number, number][] {
  const rows = [...el.querySelectorAll<HTMLElement>('[data-week]')].map((r) => r.offsetHeight)
  const n = rows.length
  const total = el.offsetHeight
  if (!n || total <= MAX_SCENE_H) return [[0, n]]
  const summary = el.querySelector<HTMLElement>('[data-summary]')
  const summaryH = summary ? summary.offsetHeight + 40 : 0 // mt-10
  const fixed = total - rows.reduce((a, b) => a + b, 0) - summaryH // 장마다 들어가는 머리말·여백
  const pageH = (from: number, to: number, last: boolean) =>
    fixed + rows.slice(from, to).reduce((a, b) => a + b, 0) + (last ? summaryH : 0)

  let best: [number, number][] = rows.map((_, i) => [i, i + 1])
  for (let k = 2; k <= n; k++) {
    let bestMax = Infinity
    let bestCuts: number[] = []
    // n-1 개의 경계 중 k-1 개를 고른다 (주가 많아야 6주라 다 해 봐도 된다)
    const choose = (startAt: number, cuts: number[]) => {
      if (cuts.length === k - 1) {
        const bounds = [0, ...cuts, n]
        let max = 0
        for (let i = 0; i < k; i++) max = Math.max(max, pageH(bounds[i], bounds[i + 1], i === k - 1))
        if (max < bestMax) {
          bestMax = max
          bestCuts = cuts
        }
        return
      }
      for (let c = startAt; c < n; c++) choose(c + 1, [...cuts, c])
    }
    choose(1, [])
    if (bestMax <= MAX_SCENE_H || k === n) {
      const bounds = [0, ...bestCuts, n]
      best = bounds.slice(0, -1).map((b, i) => [b, bounds[i + 1]])
      break
    }
  }
  return best
}

function SheetHeader({
  month,
  babyName,
  page,
  children,
}: {
  month: string
  babyName: string
  /** 여러 장으로 나눴을 때 '1/3' */
  page: string | null
  children: React.ReactNode
}) {
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
          <p className="mt-3 text-[20px] text-ink-soft">
            {babyName} · 우리가 함께 기록한 한 달{page && <span className="date-serif ml-2 text-[22px]">{page}</span>}
          </p>
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
    <div data-summary className="mt-10 grid grid-cols-3 gap-6">
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
