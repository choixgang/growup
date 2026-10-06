import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { repo } from '../data'

type Mode = 'signin' | 'signup' | 'reset'

const COPY: Record<Mode, { heading: string; sub: string; button: string }> = {
  signin: { heading: '다시 오셨네요', sub: '가입한 이메일로 로그인해 주세요.', button: '로그인' },
  signup: { heading: '처음 오셨나요?', sub: '내 계정을 만들고, 배우자와 같은 다이어리를 함께 써요.', button: '계정 만들기' },
  reset: { heading: '비밀번호 찾기', sub: '가입한 이메일로 비밀번호를 다시 정하는 링크를 보내드려요.', button: '재설정 메일 보내기' },
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const copy = COPY[mode]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (mode === 'signup' && password !== password2) return setMessage('두 비밀번호가 달라요')
    setBusy(true)
    try {
      if (mode === 'signin') await repo.signIn(email.trim(), password)
      else if (mode === 'signup') await repo.signUp(email.trim(), password)
      else {
        await repo.sendPasswordReset(email.trim())
        setSent(true)
      }
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setMessage(null)
    setSent(false)
    setPassword('')
    setPassword2('')
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6">
      <div className="paper-texture rounded-[28px] px-7 pt-9 pb-8 shadow-[0_10px_30px_rgba(90,60,40,0.10)]">
        <p className="font-batang text-[26px] leading-tight font-bold">이유식 다이어리</p>
        <p className="mt-1 text-[13px] text-ink-soft">함께 쓰는 우리 아기 식단표</p>

        {mode !== 'signin' && (
          <button className="-ml-1 mt-6 flex items-center gap-1 text-[13px] text-ink-soft" onClick={() => switchMode('signin')}>
            <ArrowLeft size={15} /> 로그인으로 돌아가기
          </button>
        )}

        <h1 className="font-batang mt-6 text-[20px] font-bold">{copy.heading}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{copy.sub}</p>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-5">
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
          {mode !== 'reset' && (
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-ink-soft">{mode === 'signup' ? '비밀번호 (6자 이상)' : '비밀번호'}</span>
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
          )}
          {mode === 'signup' && (
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-ink-soft">비밀번호 확인</span>
              <input
                className="field pen text-xl"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </label>
          )}
          {message && <p className="text-[13px] text-warn">{message}</p>}
          {sent && mode === 'reset' && (
            <p className="rounded-xl bg-rose-soft px-3 py-2 text-[13px] leading-relaxed">
              메일을 보냈어요. 메일의 링크를 누르면 새 비밀번호를 정할 수 있어요. 메일이 안 보이면 스팸함도 확인해
              주세요.
            </p>
          )}
          <button
            className={`btn mt-1 ${mode === 'signup' ? 'bg-rose-deep text-paper' : 'btn-primary'}`}
            disabled={busy}
          >
            {busy ? '잠시만요…' : mode === 'reset' && sent ? '메일 다시 보내기' : copy.button}
          </button>
        </form>
        {mode === 'signin' && (
          <div className="mt-3 flex flex-col items-center gap-1">
            <button className="btn btn-soft w-full text-[14px]" onClick={() => switchMode('signup')}>
              처음이에요 · 계정 만들기
            </button>
            <button className="btn btn-ghost w-full text-[13px]" onClick={() => switchMode('reset')}>
              비밀번호를 잊었어요
            </button>
          </div>
        )}
      </div>
      <p className="mt-6 text-center text-[12px] text-ink-faint">우리 아기를 함께 기록해요</p>
    </div>
  )
}

/** 재설정 메일 링크로 들어왔을 때 새 비밀번호를 정하는 화면 */
export function ResetPasswordPage() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pw.length < 6) return setMessage('비밀번호는 6자 이상이어야 해요')
    if (pw !== pw2) return setMessage('두 비밀번호가 달라요')
    setBusy(true)
    setMessage(null)
    try {
      await repo.changePassword(pw)
      repo.finishRecovery()
    } catch (err) {
      setMessage((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6">
      <div className="paper-texture rounded-[28px] px-7 pt-10 pb-8 shadow-[0_10px_30px_rgba(90,60,40,0.10)]">
        <p className="font-batang text-[28px] leading-tight font-bold">새 비밀번호 정하기</p>
        <p className="mt-2 text-[13px] text-ink-soft">앞으로 로그인할 때 쓸 비밀번호를 넣어주세요.</p>
        <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-ink-soft">새 비밀번호</span>
            <input
              className="field pen text-xl"
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-ink-soft">새 비밀번호 확인</span>
            <input
              className="field pen text-xl"
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
          </label>
          {message && <p className="text-[13px] text-warn">{message}</p>}
          <button className="btn btn-primary mt-2" disabled={busy || !pw}>
            {busy ? '저장 중…' : '저장하고 시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
