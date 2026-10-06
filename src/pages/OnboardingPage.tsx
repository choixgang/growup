import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, KeyRound, Sprout } from 'lucide-react'
import { repo } from '../data'

type Step = 'choose' | 'create' | 'join'

export default function OnboardingPage() {
  const qc = useQueryClient()
  // 로컬 모드는 참여할 다이어리가 없으니 바로 아기 등록으로
  const [step, setStep] = useState<Step>(repo.kind === 'supabase' ? 'choose' : 'create')
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
      if (step === 'create') await repo.createHousehold(name.trim(), birth)
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
        {step !== 'choose' && repo.kind === 'supabase' && (
          <button
            className="-ml-1 mb-3 flex items-center gap-1 text-[13px] text-ink-soft"
            onClick={() => {
              setStep('choose')
              setError(null)
            }}
          >
            <ArrowLeft size={15} /> 처음으로
          </button>
        )}
        <p className="title-serif text-[38px] leading-none italic">Hello, baby</p>

        {step === 'choose' && (
          <>
            <p className="mt-2 text-[13px] text-ink-soft">어떻게 시작할까요?</p>
            <div className="mt-6 flex flex-col gap-3">
              <ChoiceCard
                icon={<KeyRound size={22} strokeWidth={1.5} />}
                title="배우자에게 초대 코드를 받았어요"
                desc="배우자가 이미 다이어리를 쓰고 있다면 이쪽이에요"
                onClick={() => setStep('join')}
              />
              <ChoiceCard
                icon={<Sprout size={22} strokeWidth={1.5} />}
                title="처음 시작해요"
                desc="아기를 등록하고 새 다이어리를 만들어요"
                onClick={() => setStep('create')}
              />
            </div>
            <button className="btn btn-ghost mt-4 w-full text-[13px]" onClick={() => repo.signOut()}>
              로그아웃
            </button>
          </>
        )}

        {step !== 'choose' && (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
            {step === 'create' ? (
              <>
                {repo.kind === 'supabase' && (
                  <p className="rounded-xl bg-rose-soft px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
                    배우자가 이미 다이어리를 만들었다면 새로 만들지 말고 <b>초대 코드로 참여</b>해 주세요. 그래야 기록을 함께 봐요.
                  </p>
                )}
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
                <span className="text-[12px] text-ink-soft">배우자 앱의 Settings → 배우자 초대에 있는 6자리 코드</span>
                <input
                  className="field date-serif text-3xl tracking-[0.3em] uppercase"
                  required
                  maxLength={6}
                  autoCapitalize="characters"
                  autoComplete="off"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
            )}
            {error && <p className="text-[13px] text-warn">{error}</p>}
            <button className="btn btn-primary mt-2" disabled={busy}>
              {step === 'create' ? '다이어리 시작하기' : '참여하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function ChoiceCard({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-4 text-left transition-colors active:bg-rose-soft"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-soft text-rose-deep">
        {icon}
      </span>
      <span>
        <span className="block text-[15px] font-bold">{title}</span>
        <span className="mt-0.5 block text-[12px] text-ink-soft">{desc}</span>
      </span>
    </button>
  )
}
