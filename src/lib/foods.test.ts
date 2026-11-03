import { describe, expect, it } from 'vitest'
import { foodStatuses, matchFoods } from './foods'
import { emptyLog, type Meal } from './types'

describe('matchFoods', () => {
  it('긴 이름을 먼저 맞춘다', () => {
    expect(matchFoods('양배추')).toEqual(['양배추'])
    expect(matchFoods('감자')).toEqual(['감자'])
    expect(matchFoods('무화과')).toEqual(['무화과'])
    expect(matchFoods('현미유')).toEqual(['현미유'])
    expect(matchFoods('밤호박')).toEqual(['단호박'])
  })
  it('다른 표기도 같은 재료로 본다', () => {
    expect(matchFoods('쇠고기 안심')).toEqual(['소고기'])
    expect(matchFoods('달걀노른자')).toEqual(['달걀'])
    expect(matchFoods('대구살')).toEqual(['흰살생선'])
    expect(matchFoods('적양배추')).toEqual(['적채'])
  })
})

describe('foodStatuses', () => {
  const meal = (date: string, names: string[]): Meal => ({
    id: date, babyId: 'b', date, slot: 1, items: names.map((name) => ({ name, grams: null })), log: null, updatedAt: '',
  })
  it('먹였어요로 기록한 끼니만 먹은 것, 나머지는 계획으로 본다', () => {
    const fed = { ...meal('2026-10-01', ['쌀', '소고기']), log: emptyLog() }
    const s = foodStatuses([fed, meal('2026-10-02', ['감자']), meal('2026-11-02', ['브로콜리'])], ['사과'])
    expect(s.eaten.has('감자')).toBe(false)
    expect(s.planned.get('감자')).toBe('2026-10-02')
    expect(s.eaten.get('소고기')).toMatchObject({ source: 'meal', date: '2026-10-01' })
    expect(s.eaten.get('사과')).toMatchObject({ source: 'known' })
    expect(s.eaten.has('브로콜리')).toBe(false)
    expect(s.planned.get('브로콜리')).toBe('2026-11-02')
  })
})
