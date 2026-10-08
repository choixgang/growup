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

/** 재료별 반응. 한 재료에 하나만 고른다 */
export type ItemReaction = 'like' | 'normal' | 'dislike' | 'issue'

export const ITEM_REACTIONS: { value: ItemReaction; emoji: string; label: string }[] = [
  { value: 'like', emoji: '❤️', label: '좋아함' },
  { value: 'normal', emoji: '💚', label: '보통' },
  { value: 'dislike', emoji: '💔', label: '싫어함' },
  { value: 'issue', emoji: '⚠️', label: '이상 반응' },
]

export const REACTION_EMOJI: Record<ItemReaction, string> = {
  like: '❤️',
  normal: '💚',
  dislike: '💔',
  issue: '⚠️',
}

export interface MealLog {
  eatenAmount: string // 자유 입력 (예: "30ml", "절반")
  /** 재료 하나라도 이상 반응이면 'issue'. 재료별 반응이 생기기 전 기록은 끼니 전체 값만 있다 */
  reaction: Reaction
  reactionNote: string
  /** 예전 기록의 끼니 전체 선호도. 새 기록은 itemReactions 를 쓴다 */
  preference: Preference | null
  /** 정규화한 재료 이름 → 반응 */
  itemReactions?: Record<string, ItemReaction>
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
    itemReactions: {},
    photoUrl: null,
    photoThumbUrl: null,
    loggedAt: new Date().toISOString(),
  }
}
