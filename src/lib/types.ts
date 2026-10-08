export type Stage = 'early' | 'middle' | 'late'

export const STAGE_LABEL: Record<Stage, string> = {
  early: '초기',
  middle: '중기',
  late: '후기',
}

export interface Baby {
  id: string
  householdId: string
  name: string
  birthDate: string // yyyy-MM-dd
}

export type FeedingStyle = 'topping' | 'porridge'

export const FEEDING_STYLE_LABEL: Record<FeedingStyle, string> = {
  topping: '토핑',
  porridge: '죽',
}

export interface Household {
  id: string
  inviteCode: string
  testIntervalDays: number
  knownIngredients: string[] // 앱을 쓰기 전에 이미 먹어본 재료 (새 재료로 보지 않음)
  feedingStyle: FeedingStyle // 새 끼니를 적을 때 먼저 보여줄 방식
}

export interface MealItem {
  name: string
  grams: number | null
}

export type Reaction = 'none' | 'issue'
export type Preference = 'like' | 'normal' | 'refuse'

export interface MealLog {
  eatenAmount: string // 자유 입력 (예: "30ml", "절반")
  reaction: Reaction
  reactionNote: string
  preference: Preference | null
  photoUrl: string | null
  /** 목록용 작은 사진. 예전 기록에는 없을 수 있어 photoUrl로 대신한다 */
  photoThumbUrl?: string | null
  loggedAt: string
}

export interface Meal {
  id: string
  babyId: string
  date: string // yyyy-MM-dd
  slot: number // 1, 2, 3 ... (끼니 순서)
  /** 예전 기록에는 없어서 토핑으로 본다 */
  style?: FeedingStyle
  /** 죽 이름 (예: 양배추당근감자소고기죽). 죽일 때만 */
  title?: string
  /** 죽 전체 용량 ml. 죽일 때만, 재료별 g은 적지 않는다 */
  totalMl?: number | null
  items: MealItem[]
  log: MealLog | null
  updatedAt: string
}

export interface MonthNote {
  babyId: string
  month: string // yyyy-MM
  stage: Stage
  caution: string
  goal: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface WeekNote {
  babyId: string
  weekStart: string // yyyy-MM-dd (일요일)
  memo: string
  checklist: ChecklistItem[]
}

export function emptyLog(): MealLog {
  return {
    eatenAmount: '',
    reaction: 'none',
    reactionNote: '',
    preference: null,
    photoUrl: null,
    photoThumbUrl: null,
    loggedAt: new Date().toISOString(),
  }
}
