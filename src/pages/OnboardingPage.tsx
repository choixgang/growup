import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, KeyRound, Plus, Sprout, X } from 'lucide-react'
import { repo } from '../data'
import type { FeedingStyle } from '../lib/types'
import StylePicker from '../components/StylePicker'

type Step = 'choose' | 'create' | 'join'

export default function OnboardingPage() {
  const qc = useQueryClient()
  // 로컬 모드는 참여할 다이어리가 없으니 바로 아기 등록으로
  const [step, setStep] = useState<Step>(repo.kind === 'supabase' ? 'choose' : 'create')
  // 쌍둥이·형제는 처음부터 함께 등록할 수 있다
  const [babies, setBabies] = useState([{ name: '', birth: '' }])
  const updateBaby = (i: number, patch: Partial<{ name: string; birth: string }>) =>
    setBabies((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)))
  const [style, setStyle] = useState<FeedingStyle>('topping')
  const [code, setCode] = useState('')
  const [myName, setMyName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (step === 'create') {
        const [first, ...rest] = babies
        const hid = await repo.createHousehold(first.name.trim(), first.birth, style)
        for (const b of rest) await repo.addBaby(hid, b.name.trim(), b.birth, { feedingStyle: style })
      } else await repo.joinHousehold(code)
      if (myName.trim()) await repo.setDisplayName(myName.trim())
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
                {babies.map((b, i) => (
                  <div key={i} className={`flex flex-col gap-5 ${i ? 'border-t border-dashed border-line pt-4' : ''}`}>
                    {babies.length > 1 && (
                      <div className="-mb-3 flex items-center justify-between">
                        <span className="title-serif text-[17px] italic">Baby {i + 1}</span>
                        {i > 0 && (
                          <button
                            type="button"
                            aria-label="이 아이 빼기"
                            className="p-1 text-ink-faint"
                            onClick={() => setBabies((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    )}
                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] text-ink-soft">아기 이름 (태명도 좋아요)</span>
                      <input
                        className="field pen text-2xl"
                        required
                        value={b.name}
                        onChange={(e) => updateBaby(i, { name: e.target.value })}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[12px] text-ink-soft">태어난 날 · D+일수 계산에 써요</span>
                      <input
                        className="field pen text-2xl"
                        type="date"
                        required
                        value={b.birth}
                        onChange={(e) => updateBaby(i, { birth: e.target.value })}
                      />
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  className="-mt-2 flex w-fit items-center gap-1 text-[13px] text-rose-deep"
                  onClick={() => setBabies((prev) => [...prev, { name: '', birth: prev[0].birth }])}
                >
                  <Plus size={15} /> 쌍둥이·형제 함께 등록
                </button>
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] text-ink-soft">이유식 방식 · 나중에 설정에서 아이별로 바꿀 수 있어요</span>
                  <StylePicker value={style} onChange={setStyle} />
                </div>
              </>
            ) : (
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-ink-soft">가족 앱의 Settings → 함께 쓰기에 있는 6자리 코드</span>
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
            {repo.kind === 'supabase' && <MyNameField value={myName} onChange={setMyName} />}
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

/** 같은 다이어리 사람에게 보이는 이름. 이메일 대신 이 이름으로 서로를 알아본다 */
function MyNameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] text-ink-soft">나는 아기의 · 함께 쓰는 가족에게 보이는 이름이에요</span>
      <input
        className="field pen text-2xl"
        required
        maxLength={20}
        placeholder="엄마, 아빠, 할머니…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
