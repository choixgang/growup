import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { Meal } from './types'

/** 재료 이름 비교용 정규화: 공백 제거 + 소문자 */
export function normalizeName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase()
}

export interface IngredientTest {
  key: string // 정규화된 이름
  name: string // 처음 입력된 표기
  start: string // 처음 먹인(또는 계획한) 날 yyyy-MM-dd
  end: string // 테스트 마지막 날 (start + interval - 1)
  colorIndex: number
}

export interface IngredientWarning {
  date: string
  name: string
  message: string
}

export interface IngredientAnalysis {
  /** 재료별 테스트 기간, 시작일 순 */
  tests: IngredientTest[]
  /** 재료 key → 테스트 정보 */
  byKey: Map<string, IngredientTest>
  /** 이상 반응이 기록된 재료 key */
  cautionKeys: Set<string>
  /** 날짜별 새 재료 key 목록 */
  newByDate: Map<string, string[]>
  /** 테스트 기간이 겹친 경우의 경고 (나중에 시작한 재료 기준) */
  warnings: IngredientWarning[]
}

/**
 * 모든 식단을 날짜순으로 훑어서, 재료가 처음 등장한 날을 '새 재료' 테스트 시작일로 본다.
 * 테스트 기간은 시작일부터 intervalDays 일 동안. 다른 새 재료의 테스트 기간 안에
 * 또 새 재료가 시작되면 경고한다. 경고는 막지 않고 알려주기만 한다.
 */
export function analyzeIngredients(
  meals: Meal[],
  intervalDays: number,
  knownIngredients: string[] = [],
): IngredientAnalysis {
  const known = new Set(knownIngredients.map(normalizeName))
  const interval = Math.max(1, Math.floor(intervalDays))
  const sorted = [...meals].sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot)

  const byKey = new Map<string, IngredientTest>()
  const tests: IngredientTest[] = []
  const newByDate = new Map<string, string[]>()
  const cautionKeys = new Set<string>()

  for (const meal of sorted) {
    for (const item of meal.items) {
      const key = normalizeName(item.name)
      if (!key) continue
      if (!byKey.has(key) && !known.has(key)) {
        const test: IngredientTest = {
          key,
          name: item.name.trim(),
          start: meal.date,
          end: format(addDays(parseISO(meal.date), interval - 1), 'yyyy-MM-dd'),
          colorIndex: tests.length,
        }
        byKey.set(key, test)
        tests.push(test)
        const list = newByDate.get(meal.date) ?? []
        list.push(key)
        newByDate.set(meal.date, list)
      }
    }
  }

  // 이상 반응은 그날 테스트 중이던 새 재료 탓으로 본다. 테스트 중인 재료가 없으면
  // 이미 먹어본 재료를 뺀 나머지 재료 전부를 주의 재료로 둔다.
  for (const meal of sorted) {
    if (meal.log?.reaction !== 'issue') continue
    const keys = meal.items.map((i) => normalizeName(i.name)).filter((k) => k && !known.has(k))
    const testing = keys.filter((k) => {
      const t = byKey.get(k)
      return t && meal.date >= t.start && meal.date <= t.end
    })
    for (const k of testing.length ? testing : keys) cautionKeys.add(k)
  }

  const warnings: IngredientWarning[] = []
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i]
    for (let j = 0; j < i; j++) {
      const prev = tests[j]
      if (t.start >= prev.start && t.start <= prev.end) {
        warnings.push({
          date: t.start,
          name: t.name,
          message:
            t.start === prev.start
              ? `${prev.name}와(과) ${t.name}을(를) 같은 날 처음 먹여요`
              : `${prev.name} 테스트 기간(${shortDate(prev.start)}~${shortDate(prev.end)}) 중에 새 재료 ${t.name}이(가) 들어가요`,
        })
        break
      }
    }
  }

  return { tests, byKey, cautionKeys, newByDate, warnings }
}

/**
 * 아직 저장하지 않은 식단 초안을 검사한다. 초안을 넣었을 때 새로 생기는 간격 경고와,
 * 이전에 이상 반응이 있었던 재료를 메시지로 돌려준다.
 */
export function checkDraft(
  meals: Meal[],
  draft: { id?: string; date: string; slot: number; items: { name: string }[] },
  intervalDays: number,
  knownIngredients: string[] = [],
): string[] {
  const others = meals.filter((m) => m.id !== draft.id)
  // 비교 기준은 지금 저장된 상태(수정 중인 끼니의 원래 내용 포함) — 이미 있던 경고는 다시 띄우지 않는다
  const base = analyzeIngredients(meals, intervalDays, knownIngredients)
  const draftMeal: Meal = {
    id: draft.id ?? '__draft__',
    babyId: '',
    date: draft.date,
    slot: draft.slot,
    items: draft.items.map((i) => ({ name: i.name, grams: null })),
    log: null,
    updatedAt: '',
  }
  const merged = analyzeIngredients([...others, draftMeal], intervalDays, knownIngredients)
  const before = new Set(base.warnings.map((w) => w.message))
  const messages = merged.warnings.filter((w) => !before.has(w.message)).map((w) => w.message)

  // 주의 재료는 이 끼니 자신의 기록을 빼고 판단 (방금 반응을 적은 끼니에 경고가 뜨지 않게)
  const prior = analyzeIngredients(others, intervalDays, knownIngredients)
  for (const item of draft.items) {
    const key = normalizeName(item.name)
    if (key && prior.cautionKeys.has(key)) {
      messages.push(`${prior.byKey.get(key)?.name ?? item.name.trim()}은(는) 이전에 이상 반응이 있었던 재료예요`)
    }
  }
  return [...new Set(messages)]
}

function shortDate(d: string): string {
  const date = parseISO(d)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/** 생년월일 기준 D+일수. 태어난 날이 D+1 (국내 육아 관례) */
export function dPlus(birthDate: string, date: string): number {
  return differenceInCalendarDays(parseISO(date), parseISO(birthDate)) + 1
}

/** 마스킹테이프 색 (컨셉 이미지의 파스텔 테이프) */
export const TAPE_COLORS = [
  '#e9b8b0', // 로즈
  '#c9d8b6', // 세이지
  '#f1d9a7', // 버터
  '#b9cfe0', // 하늘
  '#d8c3e0', // 라벤더
  '#f0c4a4', // 살구
  '#b8d8cf', // 민트
  '#e3c9b5', // 베이지
]

export function tapeColor(index: number): string {
  return TAPE_COLORS[index % TAPE_COLORS.length]
}
