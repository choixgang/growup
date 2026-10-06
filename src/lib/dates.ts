import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { IngredientTest } from './rules'

export const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_LABELS_KO = ['일', '월', '화', '수', '목', '금', '토']

export const ymd = (d: Date) => format(d, 'yyyy-MM-dd')
export const ym = (d: Date) => format(d, 'yyyy-MM')
export const todayStr = () => ymd(new Date())

export function weekStartOf(date: string): string {
  return ymd(startOfWeek(parseISO(date), { weekStartsOn: 0 }))
}

export function weekDates(weekStart: string): string[] {
  const s = parseISO(weekStart)
  return Array.from({ length: 7 }, (_, i) => ymd(addDays(s, i)))
}

export interface MonthCell {
  date: string
  inMonth: boolean
}

/** 일요일 시작 달력 칸. 한 주씩 묶어서 돌려준다 */
export function monthWeeks(month: string): MonthCell[][] {
  const first = parseISO(`${month}-01`)
  const start = startOfWeek(startOfMonth(first), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(first), { weekStartsOn: 0 })
  const weeks: MonthCell[][] = []
  let cur = start
  while (cur <= end) {
    const week: MonthCell[] = []
    for (let i = 0; i < 7; i++) {
      week.push({ date: ymd(cur), inMonth: isSameMonth(cur, first) })
      cur = addDays(cur, 1)
    }
    weeks.push(week)
  }
  return weeks
}

export interface StripSegment {
  test: IngredientTest
  startCol: number
  endCol: number
  lane: number
  /** 이 주에서 테스트가 시작되는지 (이름 표시용) */
  isStart: boolean
}

/** 한 주에 걸치는 새 재료 테스트 기간을 띠 조각으로 나누고, 겹치지 않게 줄(lane)을 배정한다 */
export function stripsForWeek(week: string[], tests: IngredientTest[]): StripSegment[] {
  const first = week[0]
  const last = week[6]
  const segs: StripSegment[] = []
  const laneEnds: number[] = []
  for (const test of tests) {
    if (test.end < first || test.start > last) continue
    const startCol = test.start < first ? 0 : week.indexOf(test.start)
    const endCol = test.end > last ? 6 : week.indexOf(test.end)
    let lane = laneEnds.findIndex((end) => end < startCol)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(endCol)
    } else {
      laneEnds[lane] = endCol
    }
    segs.push({ test, startCol, endCol, lane, isStart: test.start >= first })
  }
  return segs
}

export function circled(n: number): string {
  const chars = '①②③④⑤⑥⑦⑧⑨'
  return chars[n - 1] ?? `(${n})`
}
