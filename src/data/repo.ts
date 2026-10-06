import type { Baby, Household, Meal, MonthNote, WeekNote } from '../lib/types'

export interface AppContext {
  household: Household
  baby: Baby
}

export interface SessionUser {
  id: string
  email: string | null
}

/**
 * 앱이 쓰는 모든 저장소 동작. Supabase(부부 공유) 구현과
 * 로컬 모드(이 기기에만 저장) 구현이 같은 인터페이스를 따른다.
 */
export interface Repo {
  readonly kind: 'supabase' | 'local'

  // 인증
  getUser(): Promise<SessionUser | null>
  onAuthChange(cb: (user: SessionUser | null) => void): () => void
  signUp(email: string, password: string): Promise<void>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>

  // 가정·아기
  getContext(): Promise<AppContext | null>
  createHousehold(babyName: string, birthDate: string): Promise<void>
  joinHousehold(inviteCode: string): Promise<void>
  updateBaby(babyId: string, patch: Pick<Baby, 'name' | 'birthDate'>): Promise<void>
  updateHousehold(householdId: string, patch: Partial<Pick<Household, 'testIntervalDays' | 'knownIngredients'>>): Promise<void>

  // 식단
  listMeals(babyId: string): Promise<Meal[]>
  saveMeal(meal: Omit<Meal, 'id' | 'updatedAt'> & { id?: string }): Promise<Meal>
  deleteMeal(id: string): Promise<void>
  uploadPhoto(babyId: string, file: Blob): Promise<string>

  // 메모
  getMonthNote(babyId: string, month: string): Promise<MonthNote | null>
  saveMonthNote(note: MonthNote): Promise<void>
  getWeekNote(babyId: string, weekStart: string): Promise<WeekNote | null>
  saveWeekNote(note: WeekNote): Promise<void>

  /** 다른 기기(배우자)의 변경을 구독. 변경된 테이블 이름을 넘겨준다. */
  subscribe(babyId: string, householdId: string, cb: (table: string) => void): () => void
}
