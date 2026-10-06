import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { repo } from '../data'

export default function OnboardingPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [birth, setBirth] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (tab === 'create') await repo.createHousehold(name.trim(), birth)
      else await repo.joinHousehold(code)
      await qc.invalidateQueries({ queryKey: ['context'] })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-6">
      <div className="paper-texture rounded-[28px] px-7 pt-9 pb-8 shadow-[0_10px_30px_rgba(90,60,40,0.10)]">
        <p className="title-serif text-[38px] leading-none italic">Hello, baby</p>
        <p className="mt-2 text-[13px] text-ink-soft">우리 아기를 등록하거나, 배우자가 만든 다이어리에 참여하세요.</p>

        {repo.kind === 'supabase' && (
          <div className="mt-6 flex rounded-full bg-rose-soft p-1 text-[14px]">
            {(['create', 'join'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-full py-2 ${tab === t ? 'bg-card shadow-sm' : 'text-ink-soft'}`}
              >
                {t === 'create' ? '새로 시작' : '초대 코드로 참여'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
          {tab === 'create' ? (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-ink-soft">아기 이름 (태명도 좋아요)</span>
                <input className="field pen text-2xl" required value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-ink-soft">태어난 날 · D+일수 계산에 써요</span>
                <input
                  className="field pen text-2xl"
                  type="date"
                  required
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                />
              </label>
            </>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-ink-soft">배우자 설정 화면에 있는 6자리 코드</span>
              <input
                className="field pen text-3xl tracking-[0.3em] uppercase"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
          )}
          {error && <p className="text-[13px] text-warn">{error}</p>}
          <button className="btn btn-primary mt-2" disabled={busy}>
            {tab === 'create' ? '다이어리 시작하기' : '참여하기'}
          </button>
        </form>
        {repo.kind === 'supabase' && (
          <button className="btn btn-ghost mt-2 w-full text-[13px]" onClick={() => repo.signOut()}>
            로그아웃
          </button>
        )}
      </div>
    </div>
  )
}
