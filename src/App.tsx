import { createContext, useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppContext, useRealtime, useRecovering, useUser } from './data/hooks'
import type { AppContext } from './data/repo'
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
  return (
    <Ctx.Provider value={context.data}>
      <Shell ctx={context.data} />
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
