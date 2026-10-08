import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, X } from 'lucide-react'
import { useCtx } from '../App'
import { repo } from '../data'
import { useMeals } from '../data/hooks'
import StylePicker from '../components/StylePicker'

export default function SettingsPage() {
  const ctx = useCtx()
  const qc = useQueryClient()
  const [name, setName] = useState(ctx.baby.name)
  const [birth, setBirth] = useState(ctx.baby.birthDate)
  const [known, setKnown] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = () => qc.invalidateQueries({ queryKey: ['context'] })

  async function run(fn: () => Promise<void>, done?: string) {
    setMsg(null)
    try {
      await fn()
      await refresh()
      if (done) setMsg(done)
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  const interval = ctx.household.testIntervalDays
  const setInterval = (v: number) =>
    run(() => repo.updateHousehold(ctx.household.id, { testIntervalDays: Math.min(14, Math.max(1, v)) }))

  const addKnown = () => {
    const items = known
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!items.length) return
    setKnown('')
    run(() =>
      repo.updateHousehold(ctx.household.id, {
        knownIngredients: [...new Set([...ctx.household.knownIngredients, ...items])],
      }),
    )
  }

  return (
    <div className="px-4 pt-[max(14px,env(safe-area-inset-top))]">
      <h1 className="title-serif text-[42px] leading-[0.95] italic">Settings</h1>

      <Section title="아기">
        <label className="flex flex-col gap-0.5">
          <span className="text-[12px] text-ink-soft">이름</span>
          <input className="field pen text-[22px]" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="mt-3 flex flex-col gap-0.5">
          <span className="text-[12px] text-ink-soft">태어난 날</span>
          <input className="field pen text-[22px]" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
        </label>
        {(name !== ctx.baby.name || birth !== ctx.baby.birthDate) && (
          <button
            className="btn btn-primary mt-3 w-full"
            onClick={() => run(() => repo.updateBaby(ctx.baby.id, { name: name.trim(), birthDate: birth }), '저장했어요')}
          >
            저장
          </button>
        )}
      </Section>

      <Section title="이유식 방식">
        <p className="mb-2 text-[12px] text-ink-soft">새 끼니를 적을 때 이 방식이 먼저 보여요. 끼니마다 바꿀 수도 있어요.</p>
        <StylePicker
          value={ctx.household.feedingStyle}
          onChange={(v) => run(() => repo.updateHousehold(ctx.household.id, { feedingStyle: v }))}
        />
      </Section>

      <Section title="새 재료 테스트 간격">
        <p className="text-[12px] text-ink-soft">새 재료를 넣은 뒤 다음 새 재료까지 기다리는 날 수예요.</p>
        <div className="mt-2 flex items-center gap-4">
          <button className="rounded-full bg-rose-soft p-2" aria-label="하루 줄이기" onClick={() => setInterval(interval - 1)}>
            <Minus size={16} />
          </button>
          <span className="pen w-16 text-center text-[30px]">{interval}일</span>
          <button className="rounded-full bg-rose-soft p-2" aria-label="하루 늘리기" onClick={() => setInterval(interval + 1)}>
            <Plus size={16} />
          </button>
        </div>
      </Section>

      <Section title="이미 먹어본 재료">
        <p className="text-[12px] text-ink-soft">앱을 쓰기 전에 먹여본 재료는 새 재료로 보지 않아요.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ctx.household.knownIngredients.map((k) => (
            <span key={k} className="pen flex items-center gap-1 rounded-full bg-rose-soft py-0.5 pr-1.5 pl-3 text-[19px]">
              {k}
              <button
                aria-label={`${k} 삭제`}
                className="text-ink-soft"
                onClick={() =>
                  run(() =>
                    repo.updateHousehold(ctx.household.id, {
                      knownIngredients: ctx.household.knownIngredients.filter((x) => x !== k),
                    }),
                  )
                }
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
        <form
          className="mt-2 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addKnown()
          }}
        >
          <input
            className="field pen flex-1 text-[20px]"
            placeholder="쌀, 감자 (쉼표로 여러 개)"
            value={known}
            onChange={(e) => setKnown(e.target.value)}
          />
          <button className="btn btn-soft px-4 py-1.5 text-[13px]">추가</button>
        </form>
      </Section>

      {repo.kind === 'supabase' ? (
        <Section title="배우자 초대">
          <p className="text-[12px] text-ink-soft">배우자가 가입한 뒤 '초대 코드로 참여'에 이 코드를 넣으면 함께 볼 수 있어요.</p>
          <p className="date-serif mt-2 text-center text-[34px] tracking-[0.3em] select-all">{ctx.household.inviteCode}</p>
        </Section>
      ) : null}

      {repo.kind === 'supabase' ? <JoinOtherDiary /> : null}

      {repo.kind === 'supabase' ? (
        <Section title="내 계정">
          <ChangePassword />
          <button className="btn btn-ghost mt-3 w-full text-[13px]" onClick={() => repo.signOut()}>
            로그아웃
          </button>
        </Section>
      ) : (
        <Section title="공유 연결">
          <p className="text-[13px] leading-relaxed text-ink-soft">
            지금은 로컬 모드라 이 기기에만 저장돼요. 배우자와 실시간으로 공유하려면 Supabase 프로젝트를 만들고
            <code className="mx-1 rounded bg-rose-soft px-1">.env</code>에 주소와 키를 넣어 다시 배포하세요. (README 참고)
          </p>
        </Section>
      )}

      {msg && <p className="mt-4 text-center text-[13px] text-ink-soft">{msg}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="paper-texture mt-4 rounded-[20px] px-4 pt-3 pb-4 shadow-[0_4px_16px_rgba(90,60,40,0.06)]">
      <h2 className="mb-2 text-[14px] font-bold">{title}</h2>
      {children}
    </section>
  )
}

function ChangePassword() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pw.length < 6) return setMsg({ ok: false, text: '비밀번호는 6자 이상이어야 해요' })
    if (pw !== pw2) return setMsg({ ok: false, text: '두 비밀번호가 달라요' })
    setBusy(true)
    setMsg(null)
    try {
      await repo.changePassword(pw)
      setPw('')
      setPw2('')
      setMsg({ ok: true, text: '비밀번호를 바꿨어요' })
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-0.5">
        <span className="text-[12px] text-ink-soft">새 비밀번호</span>
        <input
          className="field pen text-[20px]"
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[12px] text-ink-soft">새 비밀번호 확인</span>
        <input
          className="field pen text-[20px]"
          type="password"
          autoComplete="new-password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />
      </label>
      {msg && <p className={`text-[13px] ${msg.ok ? 'text-sage' : 'text-warn'}`}>{msg.text}</p>}
      <button className="btn btn-soft" disabled={busy || !pw}>
        {busy ? '바꾸는 중…' : '비밀번호 변경'}
      </button>
    </form>
  )
}

/** 실수로 따로 시작했을 때, 배우자의 초대 코드로 그 다이어리로 옮겨간다 */
function JoinOtherDiary() {
  const ctx = useCtx()
  const meals = useMeals(ctx.baby.id)
  const [code, setCode] = useState('')
  const [warning, setWarning] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const clean = code.trim().toUpperCase()
    if (clean.length !== 6) return setError('6자리 코드를 넣어주세요')
    if (clean === ctx.household.inviteCode) return setError('지금 쓰고 있는 다이어리의 코드예요')

    // 첫 번째 누름: 무엇이 사라지는지 알려주고 한 번 더 확인받는다
    if (!warning) {
      setBusy(true)
      try {
        const members = await repo.getMemberCount(ctx.household.id)
        const n = meals.data?.length ?? 0
        setWarning(
          members <= 1
            ? `지금 다이어리(${ctx.baby.name})는 나 혼자 쓰고 있어서, 옮기면 ${
                n ? `기록된 끼니 ${n}개를 포함해 ` : ''
              }모두 지워져요.`
            : '지금 다이어리에서 나가요. 다른 구성원은 계속 쓸 수 있어요.',
        )
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setBusy(false)
      }
      return
    }

    setBusy(true)
    try {
      await repo.joinHousehold(clean)
      // 아기·실시간 구독·캐시가 모두 바뀌므로 앱을 새로 연다
      window.location.replace('/')
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <Section title="다른 다이어리에 참여">
      <p className="text-[12px] leading-relaxed text-ink-soft">
        배우자가 이미 다이어리를 쓰고 있었다면, 배우자의 초대 코드를 넣어 그 다이어리로 옮겨갈 수 있어요.
      </p>
      <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
        <input
          className="field date-serif text-center text-[26px] tracking-[0.3em] uppercase"
          placeholder="초대 코드"
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setWarning(null)
            setError(null)
          }}
        />
        {warning && <p className="rounded-xl bg-warn/10 px-3 py-2 text-[13px] text-warn">{warning}</p>}
        {error && <p className="text-[13px] text-warn">{error}</p>}
        <button className={`btn ${warning ? 'btn-primary' : 'btn-soft'}`} disabled={busy || !code.trim()}>
          {busy ? '확인 중…' : warning ? '알겠어요, 옮겨갈게요' : '참여하기'}
        </button>
      </form>
    </Section>
  )
}
