import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { FeedingSettings, FeedingStyle, Meal, MealItem, MealLog, MonthNote, Stage, WeekNote, ChecklistItem } from '../lib/types'
import type { Repo, SessionUser, StoredContext } from './repo'

interface MealRow {
  id: string
  baby_id: string
  date: string
  slot: number
  style: FeedingStyle | null
  title: string | null
  total_ml: number | null
  items: MealItem[]
  log: MealLog | null
  updated_at: string
}

function toMeal(r: MealRow): Meal {
  return {
    id: r.id,
    babyId: r.baby_id,
    date: r.date,
    slot: r.slot,
    style: r.style ?? 'topping',
    title: r.title ?? '',
    totalMl: r.total_ml,
    items: r.items ?? [],
    log: r.log,
    updatedAt: r.updated_at,
  }
}

function toUser(u: User | null | undefined): SessionUser | null {
  return u ? { id: u.id, email: u.email ?? null } : null
}

function check<T>(res: { data: T; error: { message: string } | null } | { data: unknown; error: { message: string } }): T {
  if (res.error) throw new Error(translateError(res.error.message))
  return res.data as T
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요'
  if (msg.includes('User already registered')) return '이미 가입된 이메일이에요'
  if (msg.includes('should be different from the old password')) return '지금 비밀번호와 다른 비밀번호를 입력해 주세요'
  if (msg.includes('Password should be')) return '비밀번호는 6자 이상이어야 해요'
  if (msg.includes('Email not confirmed')) return '메일함에서 가입 확인 링크를 먼저 눌러주세요'
  if (/Email address .* is invalid/.test(msg)) return '사용할 수 없는 이메일 주소예요'
  if (msg.includes('Email logins are disabled') || msg.includes('Email signups are disabled'))
    return 'Supabase에서 이메일 로그인이 꺼져 있어요 (Authentication → Email 설정 확인)'
  if (msg.includes('email rate limit'))
    return '메일을 보낼 수 있는 횟수를 넘었어요. 1시간쯤 뒤에 다시 시도해 주세요'
  if (msg.includes('rate limit')) return '잠시 후 다시 시도해 주세요 (요청이 너무 많아요)'
  return msg
}

function settingsRow(s: Partial<FeedingSettings>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (s.feedingStyle !== undefined) row.feeding_style = s.feedingStyle
  if (s.testIntervalDays !== undefined) row.test_interval_days = s.testIntervalDays
  if (s.knownIngredients !== undefined) row.known_ingredients = s.knownIngredients
  return row
}

export function createSupabaseRepo(url: string, anonKey: string): Repo {
  // 재설정 메일 링크(#...type=recovery)로 열렸는지는 클라이언트가 주소를 지우기 전에 확인해 둔다
  let recovering = window.location.hash.includes('type=recovery')
  const recoveryListeners = new Set<(r: boolean) => void>()
  const setRecovering = (r: boolean) => {
    recovering = r
    recoveryListeners.forEach((cb) => cb(r))
  }

  const sb: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    if (event === 'SIGNED_OUT') setRecovering(false)
  })

  return {
    kind: 'supabase',

    async getUser() {
      const { data } = await sb.auth.getSession()
      return toUser(data.session?.user)
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)))
      return () => data.subscription.unsubscribe()
    },
    async signUp(email, password) {
      const res = await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      check(res)
      if (!res.data.session) throw new Error('가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.')
    },
    async signIn(email, password) {
      check(await sb.auth.signInWithPassword({ email, password }))
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async changePassword(newPassword) {
      check(await sb.auth.updateUser({ password: newPassword }))
    },
    async sendPasswordReset(email) {
      check(await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }))
    },
    isRecovering: () => recovering,
    onRecoveryChange(cb) {
      recoveryListeners.add(cb)
      return () => recoveryListeners.delete(cb)
    },
    finishRecovery: () => setRecovering(false),

    async getContext(): Promise<StoredContext | null> {
      const { data: session } = await sb.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) return null
      const members = check(
        await sb.from('household_members').select('household_id').eq('user_id', userId).limit(1),
      ) as { household_id: string }[]
      if (!members.length) return null
      const hid = members[0].household_id
      const h = check(await sb.from('households').select('*').eq('id', hid).single()) as {
        id: string
        invite_code: string
        test_interval_days: number
        known_ingredients: string[]
        feeding_style?: FeedingStyle
      }
      const babies = check(
        await sb.from('babies').select('*').eq('household_id', hid).order('created_at'),
      ) as {
        id: string
        household_id: string
        name: string
        birth_date: string
        feeding_style?: FeedingStyle | null
        test_interval_days?: number | null
        known_ingredients?: string[] | null
      }[]
      if (!babies.length) return null
      const household = {
        id: h.id,
        inviteCode: h.invite_code,
        testIntervalDays: h.test_interval_days,
        knownIngredients: h.known_ingredients ?? [],
        feedingStyle: h.feeding_style ?? 'topping',
      }
      return {
        household,
        // 아이별 설정이 비어 있으면 다이어리 기본값을 쓴다 (아이별 설정 전에 만든 다이어리)
        babies: babies.map((b) => ({
          id: b.id,
          householdId: b.household_id,
          name: b.name,
          birthDate: b.birth_date,
          feedingStyle: b.feeding_style ?? household.feedingStyle,
          testIntervalDays: b.test_interval_days ?? household.testIntervalDays,
          knownIngredients: b.known_ingredients ?? household.knownIngredients,
        })),
      }
    },
    async createHousehold(babyName, birthDate, feedingStyle) {
      const hid = check(await sb.rpc('create_household', { baby_name: babyName, baby_birth_date: birthDate })) as string
      if (feedingStyle !== 'topping') check(await sb.from('households').update({ feeding_style: feedingStyle }).eq('id', hid))
      return hid
    },
    async joinHousehold(inviteCode) {
      check(await sb.rpc('join_household', { code: inviteCode }))
    },
    async getMemberCount(householdId) {
      const res = await sb.from('household_members').select('user_id', { count: 'exact', head: true }).eq('household_id', householdId)
      if (res.error) throw new Error(translateError(res.error.message))
      return res.count ?? 0
    },
    async listMembers(householdId) {
      const rows = check(await sb.rpc('list_household_members', { hid: householdId })) as {
        user_id: string
        display_name: string | null
        masked_email: string | null
        joined_at: string
        is_owner: boolean
        is_me: boolean
      }[]
      return rows.map((r) => ({
        userId: r.user_id,
        displayName: r.display_name,
        maskedEmail: r.masked_email,
        joinedAt: r.joined_at,
        isOwner: r.is_owner,
        isMe: r.is_me,
      }))
    },
    async setDisplayName(name) {
      check(await sb.rpc('set_display_name', { name }))
    },
    async removeMember(householdId, userId) {
      check(await sb.rpc('remove_household_member', { hid: householdId, target: userId }))
    },
    async regenerateInviteCode(householdId) {
      check(await sb.rpc('regenerate_invite_code', { hid: householdId }))
    },
    async updateBaby(babyId, patch) {
      const row: Record<string, unknown> = settingsRow(patch)
      if (patch.name !== undefined) row.name = patch.name
      if (patch.birthDate !== undefined) row.birth_date = patch.birthDate
      check(await sb.from('babies').update(row).eq('id', babyId))
    },
    async addBaby(householdId, name, birthDate, settings = {}) {
      check(
        await sb.from('babies').insert({ household_id: householdId, name, birth_date: birthDate, ...settingsRow(settings) }),
      )
    },
    async deleteBaby(babyId) {
      check(await sb.from('babies').delete().eq('id', babyId))
    },
    async updateHousehold(householdId, patch) {
      const row: Record<string, unknown> = {}
      if (patch.testIntervalDays !== undefined) row.test_interval_days = patch.testIntervalDays
      if (patch.knownIngredients !== undefined) row.known_ingredients = patch.knownIngredients
      if (patch.feedingStyle !== undefined) row.feeding_style = patch.feedingStyle
      check(await sb.from('households').update(row).eq('id', householdId))
    },

    async listMeals(babyId) {
      const rows = check(await sb.from('meals').select('*').eq('baby_id', babyId)) as MealRow[]
      return rows.map(toMeal)
    },
    async saveMeal(input) {
      const row = {
        ...(input.id ? { id: input.id } : {}),
        baby_id: input.babyId,
        date: input.date,
        slot: input.slot,
        style: input.style ?? 'topping',
        title: input.style === 'porridge' ? input.title?.trim() || null : null,
        total_ml: input.style === 'porridge' ? (input.totalMl ?? null) : null,
        items: input.items,
        log: input.log,
        updated_at: new Date().toISOString(),
      }
      const saved = check(await sb.from('meals').upsert(row).select().single()) as MealRow
      return toMeal(saved)
    },
    async deleteMeal(id) {
      check(await sb.from('meals').delete().eq('id', id))
    },
    async uploadPhoto(babyId, file) {
      const path = `${babyId}/${crypto.randomUUID()}.jpg`
      check(await sb.storage.from('meal-photos').upload(path, file, { contentType: 'image/jpeg', cacheControl: '31536000' }))
      return sb.storage.from('meal-photos').getPublicUrl(path).data.publicUrl
    },

    async getMonthNote(babyId, month) {
      const rows = check(
        await sb.from('month_notes').select('*').eq('baby_id', babyId).eq('month', month).limit(1),
      ) as { baby_id: string; month: string; stage: Stage; caution: string; goal: string }[]
      const r = rows[0]
      return r ? { babyId: r.baby_id, month: r.month, stage: r.stage, caution: r.caution, goal: r.goal } : null
    },
    async saveMonthNote(n: MonthNote) {
      check(
        await sb.from('month_notes').upsert({
          baby_id: n.babyId,
          month: n.month,
          stage: n.stage,
          caution: n.caution,
          goal: n.goal,
        }),
      )
    },
    async getWeekNote(babyId, weekStart) {
      const rows = check(
        await sb.from('week_notes').select('*').eq('baby_id', babyId).eq('week_start', weekStart).limit(1),
      ) as { baby_id: string; week_start: string; memo: string; checklist: ChecklistItem[] }[]
      const r = rows[0]
      return r ? { babyId: r.baby_id, weekStart: r.week_start, memo: r.memo, checklist: r.checklist ?? [] } : null
    },
    async saveWeekNote(n: WeekNote) {
      check(
        await sb.from('week_notes').upsert({
          baby_id: n.babyId,
          week_start: n.weekStart,
          memo: n.memo,
          checklist: n.checklist,
        }),
      )
    },

    subscribe(babyId, householdId, cb) {
      const channel = sb.channel(`baby-${babyId}`)
      for (const table of ['meals', 'month_notes', 'week_notes']) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `baby_id=eq.${babyId}` },
          () => cb(table),
        )
      }
      // DELETE 이벤트는 필터를 지원하지 않아서 따로 받는다 (RLS상 볼 수 없는 행은 id만 오고 refetch로 걸러짐)
      channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'meals' }, () => cb('meals'))
      // 배우자가 아기를 추가·수정해도 바로 보이게 다이어리 단위로 받는다
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'babies', filter: `household_id=eq.${householdId}` },
        () => cb('context'),
      )
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'households', filter: `id=eq.${householdId}` },
        () => cb('context'),
      )
      // 구성원 변화: 목록을 새로 받고, 내가 내보내졌으면 다이어리 정보를 다시 불러온다(→ 첫 화면)
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'household_members', filter: `household_id=eq.${householdId}` },
        () => cb('members'),
      )
      channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'household_members' }, async (p) => {
        const old = p.old as { household_id?: string; user_id?: string }
        if (old.household_id !== householdId) return
        const { data } = await sb.auth.getSession()
        cb(old.user_id === data.session?.user.id ? 'context' : 'members')
      })
      channel.subscribe()
      return () => {
        sb.removeChannel(channel)
      }
    },
  }
}
