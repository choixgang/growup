import type { Baby, Household, Meal, MonthNote, WeekNote } from '../lib/types'
import type { AppContext, Repo, SessionUser } from './repo'

const KEY = 'growup-local-v1'
const LOCAL_USER: SessionUser = { id: 'local', email: null }

interface LocalDb {
  household: Household | null
  baby: Baby | null
  meals: Meal[]
  monthNotes: MonthNote[]
  weekNotes: WeekNote[]
}

function load(): LocalDb {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as LocalDb
  } catch {
    // 저장소를 못 읽으면 빈 상태로 시작
  }
  return { household: null, baby: null, meals: [], monthNotes: [], weekNotes: [] }
}

function save(db: LocalDb) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // 용량 초과 등 — 사진이 많으면 발생할 수 있음
    throw new Error('기기 저장 공간이 부족해요. 사진을 줄이거나 Supabase 연결을 사용해 주세요.')
  }
}

function uid(): string {
  return crypto.randomUUID()
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/** Supabase 설정이 없을 때 쓰는 이 기기 전용 저장소. 로그인 없이 바로 쓴다. */
export function createLocalRepo(): Repo {
  return {
    kind: 'local',

    async getUser() {
      return LOCAL_USER
    },
    onAuthChange() {
      return () => {}
    },
    async signUp() {},
    async signIn() {},
    async signOut() {},

    async getContext(): Promise<AppContext | null> {
      const db = load()
      if (!db.household || !db.baby) return null
      return { household: { ...db.household, knownIngredients: db.household.knownIngredients ?? [] }, baby: db.baby }
    },
    async createHousehold(babyName, birthDate) {
      const db = load()
      const household: Household = { id: uid(), inviteCode: '로컬 모드', testIntervalDays: 3, knownIngredients: [] }
      db.household = household
      db.baby = { id: uid(), householdId: household.id, name: babyName, birthDate }
      save(db)
    },
    async joinHousehold() {
      throw new Error('로컬 모드에서는 가정에 참여할 수 없어요.')
    },
    async updateBaby(_id, patch) {
      const db = load()
      if (db.baby) db.baby = { ...db.baby, ...patch }
      save(db)
    },
    async updateHousehold(_id, patch) {
      const db = load()
      if (db.household) db.household = { ...db.household, ...patch }
      save(db)
    },

    async listMeals(babyId) {
      return load().meals.filter((m) => m.babyId === babyId)
    },
    async saveMeal(input) {
      const db = load()
      const meal: Meal = { ...input, id: input.id ?? uid(), updatedAt: new Date().toISOString() }
      const i = db.meals.findIndex((m) => m.id === meal.id)
      if (i >= 0) db.meals[i] = meal
      else db.meals.push(meal)
      save(db)
      return meal
    },
    async deleteMeal(id) {
      const db = load()
      db.meals = db.meals.filter((m) => m.id !== id)
      save(db)
    },
    async uploadPhoto(_babyId, file) {
      return blobToDataUrl(file)
    },

    async getMonthNote(babyId, month) {
      return load().monthNotes.find((n) => n.babyId === babyId && n.month === month) ?? null
    },
    async saveMonthNote(note) {
      const db = load()
      db.monthNotes = [...db.monthNotes.filter((n) => !(n.babyId === note.babyId && n.month === note.month)), note]
      save(db)
    },
    async getWeekNote(babyId, weekStart) {
      return load().weekNotes.find((n) => n.babyId === babyId && n.weekStart === weekStart) ?? null
    },
    async saveWeekNote(note) {
      const db = load()
      db.weekNotes = [
        ...db.weekNotes.filter((n) => !(n.babyId === note.babyId && n.weekStart === note.weekStart)),
        note,
      ]
      save(db)
    },

    subscribe(_babyId, _householdId, cb) {
      // 같은 기기의 다른 탭에서 바뀐 경우만 반영
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) cb('*')
      }
      window.addEventListener('storage', onStorage)
      return () => window.removeEventListener('storage', onStorage)
    },
  }
}
