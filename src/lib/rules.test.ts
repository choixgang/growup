import { describe, expect, it } from 'vitest'
import { analyzeIngredients, checkDraft, dPlus } from './rules'
import type { Meal } from './types'

let n = 0
function meal(date: string, names: string[], issue = false): Meal {
  return {
    id: `m${n++}`,
    babyId: 'b',
    date,
    slot: 1,
    items: names.map((name) => ({ name, grams: 10 })),
    log: issue
      ? { eatenAmount: '', reaction: 'issue', reactionNote: '', preference: null, photoUrl: null, loggedAt: '' }
      : null,
    updatedAt: '',
  }
}

describe('analyzeIngredients', () => {
  it('재료가 처음 나온 날부터 간격만큼을 테스트 기간으로 본다', () => {
    const a = analyzeIngredients([meal('2026-10-01', ['쌀']), meal('2026-10-04', ['쌀', '감자'])], 3)
    expect(a.tests.map((t) => [t.name, t.start, t.end])).toEqual([
      ['쌀', '2026-10-01', '2026-10-03'],
      ['감자', '2026-10-04', '2026-10-06'],
    ])
    expect(a.warnings).toEqual([])
    expect(a.newByDate.get('2026-10-04')).toEqual(['감자'])
  })

  it('테스트 기간 중에 새 재료가 들어가면 경고한다', () => {
    const a = analyzeIngredients([meal('2026-10-01', ['쌀']), meal('2026-10-03', ['쌀', '애호박'])], 3)
    expect(a.warnings).toHaveLength(1)
    expect(a.warnings[0].name).toBe('애호박')
  })

  it('이름의 공백 차이는 같은 재료로 본다', () => {
    const a = analyzeIngredients([meal('2026-10-01', ['소고기']), meal('2026-10-05', ['소 고기'])], 3)
    expect(a.tests).toHaveLength(1)
  })

  it('이미 먹어본 재료는 새 재료로 보지 않는다', () => {
    const a = analyzeIngredients([meal('2026-10-01', ['쌀', '감자'])], 3, ['쌀'])
    expect(a.tests.map((t) => t.name)).toEqual(['감자'])
    expect(a.warnings).toEqual([])
  })

  it('이상 반응은 그날 테스트 중이던 새 재료에만 붙는다', () => {
    const a = analyzeIngredients(
      [meal('2026-10-01', ['쌀', '감자']), meal('2026-10-04', ['쌀', '감자', '달걀'], true)],
      3,
      ['쌀'],
    )
    expect([...a.cautionKeys]).toEqual(['달걀'])
  })
})

describe('checkDraft', () => {
  const meals = [meal('2026-10-01', ['쌀']), meal('2026-10-02', ['쌀', '감자'], true)]

  it('간격 위반과 주의 재료를 알려준다', () => {
    const msgs = checkDraft(meals, { date: '2026-10-03', slot: 1, items: [{ name: '감자' }, { name: '당근' }] }, 3)
    expect(msgs.some((m) => m.includes('당근'))).toBe(true)
    expect(msgs.some((m) => m.includes('이상 반응'))).toBe(true)
  })

  it('기존 끼니를 그대로 열면 이미 있던 경고를 다시 띄우지 않는다', () => {
    const saved = [meal('2026-10-07', ['소고기']), meal('2026-10-09', ['소고기', '브로콜리'])]
    const first = saved[0]
    expect(checkDraft(saved, { id: first.id, date: first.date, slot: 1, items: first.items }, 3)).toEqual([])
  })

  it('간격이 충분하면 경고하지 않는다', () => {
    const ok = [meal('2026-10-01', ['쌀'])]
    expect(checkDraft(ok, { date: '2026-10-04', slot: 1, items: [{ name: '쌀' }, { name: '당근' }] }, 3)).toEqual([])
  })
})

describe('dPlus', () => {
  it('태어난 날이 D+1', () => {
    expect(dPlus('2026-05-01', '2026-05-01')).toBe(1)
    expect(dPlus('2026-05-01', '2026-05-10')).toBe(10)
  })
})
