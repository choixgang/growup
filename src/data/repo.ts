import type { Baby, FeedingStyle, Household, Meal, MonthNote, WeekNote } from '../lib/types'

/** 저장소가 돌려주는 다이어리 정보. 아기는 등록 순서대로 */
export interface StoredContext {
  household: Household
  babies: Baby[]
}

/** 앱 화면이 쓰는 정보. baby 는 지금 보고 있는 아기 */
export interface AppContext extends StoredContext {
  baby: Baby
  selectBaby: (babyId: string) => void
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
  changePassword(newPassword: string): Promise<void>
  /** 비밀번호 재설정 메일 발송. 메일 링크는 앱으로 돌아온다 */
  sendPasswordReset(email: string): Promise<void>
  /** 재설정 메일 링크로 들어온 상태인지 (새 비밀번호를 정해야 함) */
  isRecovering(): boolean
  onRecoveryChange(cb: (recovering: boolean) => void): () => void
  finishRecovery(): void

  // 가정·아기
  getContext(): Promise<StoredContext | null>
  createHousehold(babyName: string, birthDate: string, feedingStyle: FeedingStyle): Promise<void>
  /** 초대 코드로 참여. 이미 다른 다이어리에 있으면 그곳에서 나와 옮겨간다 */
  joinHousehold(inviteCode: string): Promise<void>
  getMemberCount(householdId: string): Promise<number>
  updateBaby(babyId: string, patch: Pick<Baby, 'name' | 'birthDate'>): Promise<void>
  /** 쌍둥이·형제 추가. 아기마다 기록은 따로 */
  addBaby(householdId: string, name: string, birthDate: string): Promise<void>
  /** 아기와 그 아기의 기록을 모두 지운다 */
  deleteBaby(babyId: string): Promise<void>
  updateHousehold(householdId: string, patch: Partial<Pick<Household, 'testIntervalDays' | 'knownIngredients' | 'feedingStyle'>>): Promise<void>

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
