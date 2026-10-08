import { describe, expect, it } from 'vitest'
import { pairingNotes, pairingSuggestions } from './pairings'

describe('pairingNotes', () => {
  it('어울리는 재료와 주의할 재료를 찾는다', () => {
    const notes = pairingNotes(['소고기', '브로콜리', '시금치', '아기치즈'])
    expect(notes[0].kind).toBe('caution')
    expect(notes.some((n) => n.kind === 'good' && n.a === '소고기' && n.b === '브로콜리')).toBe(true)
  })

  it('한 글자 재료는 다른 재료 이름 가운데에 걸리지 않는다', () => {
    // '양배추'의 '배'가 단맛 재료 '배'로 잡히면 안 된다
    expect(pairingNotes(['양배추', '시금치']).filter((n) => n.reason.includes('단맛'))).toHaveLength(0)
    expect(pairingNotes(['흰쌀', '완두콩']).some((n) => n.reason.includes('단백질'))).toBe(true)
  })
})

describe('pairingNotes 짝 고르기', () => {
  it('앞 안내와 같은 두 재료는 피해서 짝을 고른다', () => {
    const dairy = pairingNotes(['시금치', '아기치즈', '소고기']).find((n) => n.reason.includes('유제품'))
    expect(dairy && [dairy.a, dairy.b]).toEqual(['아기치즈', '소고기'])
  })
})

describe('pairingSuggestions', () => {
  it('먹어본 재료 중에서만 추천한다', () => {
    const s = pairingSuggestions(['소고기'], ['쌀', '양배추', '애호박'])
    expect(s).toEqual([{ for: '소고기', names: ['양배추', '애호박'] }])
  })
})

describe('ingredientsFromTitle', () => {
  it('죽 이름에서 재료를 긴 이름부터 찾는다', async () => {
    const { ingredientsFromTitle } = await import('./ingredients')
    expect(ingredientsFromTitle('양배추당근감자소고기죽')).toEqual(['양배추', '당근', '감자', '소고기'])
    expect(ingredientsFromTitle('소고기 무 미음')).toEqual(['소고기', '무'])
    expect(ingredientsFromTitle('닭안심단호박죽', ['닭안심'])).toEqual(['닭안심', '단호박'])
  })
})
