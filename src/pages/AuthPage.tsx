import { useState } from 'react'
import { repo } from '../data'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'signin') await repo.signIn(email.trim(), password)
      else await repo.signUp(email.trim(), password)
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6">
      <div className="paper-texture rounded-[28px] px-7 pt-10 pb-8 shadow-[0_10px_30px_rgba(90,60,40,0.10)]">
        <p className="title-serif text-[44px] leading-none italic">Mamma</p>
        <p className="title-serif -mt-1 pl-10 text-[44px] leading-none">Diary</p>
        <p className="mt-3 text-[13px] text-ink-soft">매일 매일 기록하는 우리 아기 이유식</p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-ink-soft">이메일</span>
            <input
              className="field pen text-xl"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-ink-soft">비밀번호</span>
            <input
              className="field pen text-xl"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {message && <p className="text-[13px] text-warn">{message}</p>}
          <button className="btn btn-primary mt-2" disabled={busy}>
            {mode === 'signin' ? '로그인' : '가입하기'}
          </button>
        </form>
        <button
          className="btn btn-ghost mt-2 w-full text-[13px]"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setMessage(null)
          }}
        >
          {mode === 'signin' ? '처음이에요 · 계정 만들기' : '이미 계정이 있어요 · 로그인'}
        </button>
      </div>
      <p className="mt-6 text-center text-[12px] text-ink-faint">남편과 아내가 각자 계정으로 같은 아기를 함께 기록해요</p>
    </div>
  )
}
