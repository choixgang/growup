import { normalizeName } from './rules'
import type { Meal } from './types'

export type FoodCategory = 'grain' | 'protein' | 'seafood' | 'nut' | 'vegetable' | 'fruit' | 'dairy'

export const FOOD_CATEGORIES: { id: FoodCategory; label: string; en: string }[] = [
  { id: 'grain', label: '곡물', en: 'Grains' },
  { id: 'protein', label: '고기·콩·달걀', en: 'Protein' },
  { id: 'seafood', label: '해산물', en: 'Seafood' },
  { id: 'nut', label: '견과', en: 'Nuts' },
  { id: 'vegetable', label: '채소', en: 'Vegetables' },
  { id: 'fruit', label: '과일', en: 'Fruits' },
  { id: 'dairy', label: '유제품·기름', en: 'Dairy & Oil' },
]

export interface Food {
  id: string // 대표 이름
  cat: FoodCategory
  /** 식단에 적힌 이름 중 이 재료로 볼 다른 표기 */
  aliases?: string[]
  /** 아기에게 흔한 알레르기 식품 (처음 줄 때 특히 살펴볼 것) */
  allergen?: boolean
}

const f = (cat: FoodCategory, id: string, aliases?: string[], allergen?: boolean): Food => ({ id, cat, aliases, allergen })

/** 돌 전까지 먹어보면 좋은 식재료 110가지 */
export const FOODS: Food[] = [
  f('grain', '쌀', ['백미', '쌀가루', '불린쌀', '흰쌀', '멥쌀']),
  f('grain', '현미'),
  f('grain', '찹쌀'),
  f('grain', '오트밀', ['귀리', '오트']),
  f('grain', '차조', ['좁쌀', '차좁쌀']),
  f('grain', '퀴노아'),
  f('grain', '보리'),
  f('grain', '메밀', ['메밀가루'], true),
  f('grain', '참깨', ['깨', '깨소금'], true),
  f('grain', '밀', ['밀가루', '통밀'], true),
  f('grain', '빵', ['식빵', '모닝빵'], true),
  f('grain', '파스타', ['마카로니', '스파게티', '푸실리'], true),

  f('protein', '소고기', ['쇠고기', '한우', '소안심', '우둔', '홍두깨']),
  f('protein', '닭고기', ['닭안심', '닭가슴살', '닭다리', '닭']),
  f('protein', '대두', ['검은콩', '서리태', '백태', '콩물', '두유'], true),
  f('protein', '돼지고기', ['돼지안심', '돼지등심'], true),
  f('protein', '오리고기', ['오리']),
  f('protein', '양고기'),
  f('protein', '두부', ['연두부', '순두부'], true),
  f('protein', '강낭콩'),
  f('protein', '완두콩'),
  f('protein', '달걀', ['계란', '노른자', '흰자', '달걀노른자', '달걀흰자', '계란노른자'], true),
  f('protein', '메추리알'),

  f('seafood', '흰살생선', ['대구', '광어', '가자미', '도미', '동태', '명태', '흰살', '틸라피아', '조기']),
  f('seafood', '등푸른생선', ['고등어', '삼치', '꽁치', '전갱이'], true),
  f('seafood', '연어'),
  f('seafood', '새우', ['새우살'], true),
  f('seafood', '게', ['게살', '꽃게'], true),
  f('seafood', '잔멸치', ['멸치', '지리멸치']),
  f('seafood', '전복', [], true),
  f('seafood', '바지락', ['조개', '모시조개'], true),
  f('seafood', '홍합', [], true),
  f('seafood', '오징어', [], true),
  f('seafood', '김', ['김가루', '아기김']),
  f('seafood', '미역'),

  f('nut', '땅콩', ['땅콩버터'], true),
  f('nut', '밤'),
  f('nut', '호두', [], true),
  f('nut', '잣', [], true),
  f('nut', '아몬드', [], true),

  f('vegetable', '가지'),
  f('vegetable', '감자'),
  f('vegetable', '고구마'),
  f('vegetable', '고사리'),
  f('vegetable', '근대'),
  f('vegetable', '느타리버섯', ['느타리']),
  f('vegetable', '단호박', ['밤호박', '호박']),
  f('vegetable', '당근'),
  f('vegetable', '마늘'),
  f('vegetable', '무'),
  f('vegetable', '배추', ['알배추', '알배기배추']),
  f('vegetable', '부추'),
  f('vegetable', '브로콜리'),
  f('vegetable', '비타민', ['비타민채', '다채']),
  f('vegetable', '비트'),
  f('vegetable', '새송이버섯', ['새송이']),
  f('vegetable', '새싹채소', ['새싹', '브로콜리새싹']),
  f('vegetable', '숙주', ['숙주나물']),
  f('vegetable', '시금치'),
  f('vegetable', '아스파라거스'),
  f('vegetable', '아욱'),
  f('vegetable', '애호박', ['주키니']),
  f('vegetable', '양배추'),
  f('vegetable', '양상추'),
  f('vegetable', '양송이버섯', ['양송이']),
  f('vegetable', '양파'),
  f('vegetable', '연근'),
  f('vegetable', '오이'),
  f('vegetable', '옥수수', ['옥수수가루']),
  f('vegetable', '적채', ['적양배추']),
  f('vegetable', '청경채'),
  f('vegetable', '케일'),
  f('vegetable', '콜라비'),
  f('vegetable', '콜리플라워'),
  f('vegetable', '콩나물'),
  f('vegetable', '토마토', ['방울토마토', '토마토퓨레'], true),
  f('vegetable', '파', ['대파', '쪽파']),
  f('vegetable', '파프리카', ['피망']),
  f('vegetable', '팽이버섯', ['팽이']),
  f('vegetable', '표고버섯', ['표고']),

  f('fruit', '감', ['단감', '홍시']),
  f('fruit', '귤', ['감귤', '한라봉']),
  f('fruit', '대추'),
  f('fruit', '딸기'),
  f('fruit', '레몬'),
  f('fruit', '망고'),
  f('fruit', '멜론'),
  f('fruit', '무화과'),
  f('fruit', '바나나'),
  f('fruit', '배'),
  f('fruit', '복숭아', ['백도', '황도'], true),
  f('fruit', '블루베리'),
  f('fruit', '사과'),
  f('fruit', '살구'),
  f('fruit', '수박'),
  f('fruit', '아보카도'),
  f('fruit', '오렌지'),
  f('fruit', '자두'),
  f('fruit', '참외'),
  f('fruit', '키위', ['골드키위'], true),
  f('fruit', '파인애플'),
  f('fruit', '포도', ['청포도', '샤인머스캣']),

  f('dairy', '요거트', ['요구르트', '플레인요거트', '그릭요거트'], true),
  f('dairy', '우유', ['생우유'], true),
  f('dairy', '치즈', ['아기치즈', '슬라이스치즈', '리코타'], true),
  f('dairy', '버터', ['무염버터'], true),
  f('dairy', '올리브유', ['올리브오일', '엑스트라버진']),
  f('dairy', '현미유'),
  f('dairy', '참기름'),
  f('dairy', '들기름'),
]

export const FOOD_BY_ID = new Map(FOODS.map((x) => [x.id, x]))

const DICT: [string, string][] = (() => {
  const m = new Map<string, string>()
  for (const food of FOODS) {
    for (const name of [food.id, ...(food.aliases ?? [])]) {
      const k = normalizeName(name)
      if (k && !m.has(k)) m.set(k, food.id)
    }
  }
  return [...m.entries()].sort((a, b) => b[0].length - a[0].length)
})()

/**
 * 식단에 적힌 재료 이름에서 도전 식재료를 찾는다.
 * 앞에서부터 가장 긴 이름을 먼저 맞춰서 '양배추'가 '배'로, '감자'가 '감'으로 잡히지 않게 한다.
 */
export function matchFoods(name: string): string[] {
  const text = normalizeName(name)
  const found: string[] = []
  let i = 0
  while (i < text.length) {
    const hit = DICT.find(([k]) => text.startsWith(k, i))
    if (hit) {
      if (!found.includes(hit[1])) found.push(hit[1])
      i += hit[0].length
    } else i++
  }
  return found
}

export interface FoodStatus {
  /** 'meal': 캘린더 기록에서, 'known': 직접 먹었어요로 표시(또는 설정의 먹어본 재료) */
  source: 'meal' | 'known'
  /** 캘린더에서 처음 먹였어요로 기록한 날 */
  date?: string
  mealId?: string
}

/**
 * 재료별 도전 상태. '먹였어요'로 기록한 끼니에 있으면 캘린더 기록, 아니면 먹어본 재료 목록에 있으면 직접 표시.
 * 아직 먹였어요 기록이 없는(계획만 된) 재료는 planned 에 처음 계획한 날로 담는다.
 */
export function foodStatuses(meals: Meal[], known: string[]) {
  const eaten = new Map<string, FoodStatus>()
  const planned = new Map<string, string>()
  const sorted = [...meals].sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot)
  for (const meal of sorted) {
    for (const item of meal.items) {
      for (const id of matchFoods(item.name)) {
        if (meal.log) {
          if (!eaten.has(id)) eaten.set(id, { source: 'meal', date: meal.date, mealId: meal.id })
        } else if (!planned.has(id)) planned.set(id, meal.date)
      }
    }
  }
  for (const name of known) {
    for (const id of matchFoods(name)) if (!eaten.has(id)) eaten.set(id, { source: 'known' })
  }
  return { eaten, planned }
}
