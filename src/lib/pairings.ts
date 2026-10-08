import { normalizeName } from './rules'

/**
 * 이유식 재료 궁합 (참고용). 영양 흡수 근거가 비교적 분명한 것만 넣고,
 * 근거가 약한 민간 궁합(예: 당근+무)은 뺐다.
 */
export interface PairingRule {
  a: string[]
  b: string[]
  kind: 'good' | 'caution'
  reason: string
}

// 재료 묶음. 첫 이름이 대표 표기
const BEEF = ['소고기', '쇠고기', '한우', '소안심', '우둔']
const CHICKEN = ['닭고기', '닭안심', '닭가슴살']
const PORK = ['돼지고기', '돼지안심']
const FISH = ['흰살생선', '대구', '광어', '가자미', '도미', '연어']
const MEAT = [...BEEF, ...CHICKEN, ...PORK]
const VITAMIN_C = ['브로콜리', '양배추', '콜리플라워', '파프리카', '감자', '토마토', '무', '콜라비', '배추', '청경채', '키위', '딸기']
const IRON_GREENS = ['시금치', '청경채', '근대', '케일', '비타민']
const BETA_CAROTENE = ['단호박', '당근', '고구마', '애호박', '토마토']
const FATS = ['올리브유', '참기름', '들기름', '버터', '아보카도', '달걀노른자', '노른자']
const GRAINS = ['쌀', '찹쌀', '현미', '오트밀', '귀리', '보리', '수수', '밀가루', '빵']
const BEANS = ['두부', '검은콩', '콩', '완두콩', '렌틸콩', '병아리콩', '팥']
const PLANT_IRON = [...BEANS, '달걀노른자', '노른자', '오트밀', '귀리', '현미']
const DAIRY = ['우유', '분유', '치즈', '아기치즈', '요거트', '요구르트']
const OXALATE = ['시금치', '근대', '비트']
const CALCIUM = ['두부', '치즈', '아기치즈', '요거트', '요구르트', '멸치', '우유']
const BITTER_GREENS = ['브로콜리', '시금치', '청경채', '케일', '양배추']
const SWEET_VEG = ['단호박', '고구마', '사과', '배', '바나나']

export const PAIRING_RULES: PairingRule[] = [
  { a: MEAT, b: VITAMIN_C, kind: 'good', reason: '비타민C가 철분 흡수를 도와요' },
  { a: [...MEAT, ...FISH], b: IRON_GREENS, kind: 'good', reason: '고기·생선이 채소 속 철분 흡수를 도와요' },
  { a: PLANT_IRON, b: VITAMIN_C, kind: 'good', reason: '비타민C가 식물성 철분 흡수를 도와요' },
  { a: BETA_CAROTENE, b: [...FATS, ...MEAT], kind: 'good', reason: '지방과 함께 먹으면 베타카로틴이 더 잘 흡수돼요' },
  { a: GRAINS, b: BEANS, kind: 'good', reason: '곡물과 콩은 서로 부족한 단백질을 채워줘요' },
  { a: BITTER_GREENS, b: SWEET_VEG, kind: 'good', reason: '단맛 재료와 섞으면 쓴맛 채소를 더 잘 먹어요' },
  { a: OXALATE, b: CALCIUM, kind: 'caution', reason: '시금치 등의 수산이 칼슘 흡수를 줄일 수 있어요' },
  { a: DAIRY, b: [...MEAT, ...IRON_GREENS, ...BEANS], kind: 'caution', reason: '유제품의 칼슘이 같은 끼니 철분 흡수를 줄일 수 있어요' },
]

function matches(key: string, aliases: string[]): boolean {
  // 한 글자 이름(쌀, 배, 콩)은 '흰쌀'·'완두콩'처럼 끝에 올 때만 — '양배추'의 '배'에 걸리지 않게
  return aliases.some((a) => {
    const n = normalizeName(a)
    return n.length === 1 ? key.endsWith(n) : key.includes(n)
  })
}

export interface PairingNote {
  kind: 'good' | 'caution'
  a: string
  b: string
  reason: string
}

/** 이 끼니 재료끼리의 궁합. 같은 이유는 한 번만 */
export function pairingNotes(names: string[]): PairingNote[] {
  const items = [...new Map(names.map((n) => [normalizeName(n), n.trim()])).entries()].filter(([k]) => k)
  const notes: PairingNote[] = []
  for (const rule of PAIRING_RULES) {
    if (notes.some((n) => n.reason === rule.reason)) continue
    const candidates: PairingNote[] = []
    for (const [ka, na] of items) {
      if (!matches(ka, rule.a)) continue
      for (const [kb, nb] of items) {
        if (kb !== ka && matches(kb, rule.b)) candidates.push({ kind: rule.kind, a: na, b: nb, reason: rule.reason })
      }
    }
    // 앞의 안내와 같은 두 재료는 되도록 피한다
    const used = new Set(notes.map((n) => [n.a, n.b].sort().join('+')))
    const pick = candidates.find((c) => !used.has([c.a, c.b].sort().join('+'))) ?? candidates[0]
    if (pick) notes.push(pick)
  }
  return notes.sort((x, y) => (x.kind === y.kind ? 0 : x.kind === 'caution' ? -1 : 1))
}

/**
 * 이 끼니 재료와 잘 어울리는 재료 추천. 아기가 이미 먹어본 재료 중에서만 고른다
 * (추천 때문에 새 재료가 겹치지 않게).
 */
export function pairingSuggestions(names: string[], eaten: string[], limit = 4): { for: string; names: string[] }[] {
  const inMeal = new Set(names.map(normalizeName))
  const out: { for: string; names: string[] }[] = []
  for (const name of names) {
    const key = normalizeName(name)
    if (!key) continue
    const picks = new Set<string>()
    for (const rule of PAIRING_RULES) {
      if (rule.kind !== 'good') continue
      const partners = matches(key, rule.a) ? rule.b : matches(key, rule.b) ? rule.a : null
      if (!partners) continue
      for (const e of eaten) {
        const ek = normalizeName(e)
        if (!inMeal.has(ek) && ek !== key && matches(ek, partners)) picks.add(e.trim())
      }
    }
    if (picks.size) out.push({ for: name.trim(), names: [...picks].slice(0, limit) })
  }
  return out.slice(0, 2)
}
