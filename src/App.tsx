import { createContext, useContext, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppContext, useRealtime, useRecovering, useUser } from './data/hooks'
import type { AppContext, StoredContext } from './data/repo'
import { repo } from './data'
import AuthPage, { ResetPasswordPage } from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import MonthPage from './pages/MonthPage'
import WeekPage from './pages/WeekPage'
import SettingsPage from './pages/SettingsPage'
import ExportPage from './pages/ExportPage'
import BottomNav from './components/BottomNav'

const Ctx = createContext<AppContext | null>(null)

export function useCtx(): AppContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('AppContext missing')
  return ctx
}

export default function App() {
  const user = useUser()
  const recovering = useRecovering()
  const context = useAppContext(!!user)

  if (user && recovering) return <ResetPasswordPage />
  if (user === undefined || (user && context.isLoading)) return <Splash />
  if (!user) return <AuthPage />
  if (context.isError) return <Splash message={(context.error as Error).message} />
  if (!context.data) return <OnboardingPage />
  return <WithBaby stored={context.data} />
}

const BABY_KEY = 'growup-baby'

function readBabyId(): string | null {
  try {
    return localStorage.getItem(BABY_KEY)
  } catch {
    return null
  }
}

/** 지금 보고 있는 아기를 고른다. 기기마다 마지막으로 본 아기를 기억한다 */
function WithBaby({ stored }: { stored: StoredContext }) {
  const [babyId, setBabyId] = useState(readBabyId)
  const ctx = useMemo<AppContext>(() => {
    const baby = stored.babies.find((b) => b.id === babyId) ?? stored.babies[0]
    return {
      ...stored,
      baby,
      selectBaby: (id) => {
        setBabyId(id)
        try {
          localStorage.setItem(BABY_KEY, id)
        } catch {
          // 저장을 못 해도 이번 실행 동안은 바뀐 아기로 본다
        }
      },
    }
  }, [stored, babyId])
  return (
    <Ctx.Provider value={ctx}>
      <Shell ctx={ctx} />
    </Ctx.Provider>
  )
}

function Shell({ ctx }: { ctx: AppContext }) {
  useRealtime(ctx)
  return (
    <div className="mx-auto flex min-h-dvh max-w-[520px] flex-col">
      {repo.kind === 'local' && (
        <div className="bg-rose-soft px-4 py-1.5 text-center text-[12px] text-ink-soft">
          로컬 모드 · 이 기기에만 저장돼요 (공유하려면 Supabase 연결)
        </div>
      )}
      <main className="flex-1 pb-24">
        <Routes>
          <Route path="/" element={<MonthPage />} />
          <Route path="/week/:start" element={<WeekPage />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/:menu" element={<SettingsPage />} />
          <Route path="/export/:month" element={<ExportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

function Splash({ message }: { message?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-batang text-3xl">이유식 다이어리</p>
      <p className="text-sm text-ink-soft">{message ?? '불러오는 중…'}</p>
    </div>
  )
}
