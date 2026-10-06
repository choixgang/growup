import { createLocalRepo } from './localRepo'
import type { Repo } from './repo'
import { createSupabaseRepo } from './supabaseRepo'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Supabase 설정이 있으면 부부 공유 모드, 없으면 이 기기 전용 로컬 모드 */
export const repo: Repo = url && key ? createSupabaseRepo(url, key) : createLocalRepo()
