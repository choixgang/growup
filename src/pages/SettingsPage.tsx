import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Baby, ChevronRight, CookingPot, Minus, Plus, UserRound, Users, X } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useCtx } from '../App'
import { repo } from '../data'
import { useMeals, useMembers, useUser } from '../data/hooks'
import StylePicker from '../components/StylePicker'
import BabySwitcher from '../components/BabySwitcher'
import { FEEDING_STYLE_LABEL } from '../lib/types'

type MenuKey = 'baby' | 'feeding' | 'share' | 'account'

const MENU_TITLE: Record<MenuKey, string> = {
  baby: '아기 정보',
  feeding: '이유식 설정',
  share: '함께 쓰기',
  account: '내 계정',
}

/** 설정은 종류별 메뉴 → 각 메뉴 화면 (/settings/:menu) */
export default function SettingsPage() {
  const { menu } = useParams()
  if (!menu) return <SettingsMenu />
  if (!(menu in MENU_TITLE)) return <Navigate to="/settings" replace />
  const key = menu as MenuKey
  return (
    <div className="px-4 pt-[max(14px,env(safe-area-inset-top))] pb-6">
      <Link to="/settings" replace className="-ml-1 flex w-fit items-center gap-1 text-[13px] text-ink-soft">
        <ArrowLeft size={15} /> Settings
      </Link>
      <h1 className="mt-1 text-[22px] font-bold">{MENU_TITLE[key]}</h1>
      {key === 'baby' && <BabySettings />}
      {key === 'feeding' && <FeedingSettings />}
      {key === 'share' && <ShareSettings />}
      {key === 'account' && <AccountSettings />}
    </div>
  )
}

function SettingsMenu() {
  const ctx = useCtx()
  const user = useUser()
  const h = ctx.household
  const birth = ctx.baby.birthDate.replace(/-/g, '.')
  const items: { key: MenuKey; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'baby',
      icon: <Baby size={20} strokeWidth={1.5} />,
      desc: ctx.babies.length > 1 ? ctx.babies.map((b) => b.name).join(' · ') : `${ctx.baby.name} · ${birth}`,
    },
    {
      key: 'feeding',
      icon: <CookingPot size={20} strokeWidth={1.5} />,
      desc:
        ctx.babies.length > 1
          ? ctx.babies.map((b) => `${b.name} ${FEEDING_STYLE_LABEL[b.feedingStyle]}·${b.testIntervalDays}일`).join(' / ')
          : `${FEEDING_STYLE_LABEL[ctx.baby.feedingStyle]} 이유식 · 새 재료 간격 ${ctx.baby.testIntervalDays}일 · 먹어본 재료 ${ctx.baby.knownIngredients.length}개`,
    },
    {
      key: 'share',
      icon: <Users size={20} strokeWidth={1.5} />,
      desc: repo.kind === 'supabase' ? `함께 쓰는 사람 · 초대 코드 ${h.inviteCode}` : '이 기기에만 저장 중',
    },
    ...(repo.kind === 'supabase'
      ? [{ key: 'account' as const, icon: <UserRound size={20} strokeWidth={1.5} />, desc: user?.email ?? '비밀번호 · 로그아웃' }]
      : []),
  ]

  return (
    <div className="px-4 pt-[max(14px,env(safe-area-inset-top))]">
      <h1 className="title-serif text-[42px] leading-[0.95] italic">Settings</h1>
      <nav className="paper-texture mt-4 overflow-hidden rounded-[20px] shadow-[0_4px_16px_rgba(90,60,40,0.06)]">
        {items.map((it, i) => (
          <Link
            key={it.key}
            to={`/settings/${it.key}`}
            className={`flex items-center gap-3 px-4 py-3.5 active:bg-rose-soft ${i ? 'border-t border-line' : ''}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-soft text-rose-deep">
              {it.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold">{MENU_TITLE[it.key]}</span>
              <span className="mt-0.5 block truncate text-[12px] text-ink-soft">{it.desc}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-ink-faint" />
          </Link>
        ))}
      </nav>
    </div>
  )
}

/** 저장 후 앱 정보(context)를 다시 불러오고 결과 메시지를 보여준다 */
function useRun() {
  const qc = useQueryClient()
  const [msg, setMsg] = useState<string | null>(null)
  async function run(fn: () => Promise<void>, done?: string) {
    setMsg(null)
    try {
      await fn()
      await qc.invalidateQueries({ queryKey: ['context'] })
      if (done) setMsg(done)
    } catch (e) {
      setMsg((e as Error).message)
    }
  }
  const message = msg ? <p className="mt-4 text-center text-[13px] text-ink-soft">{msg}</p> : null
  return { run, message }
}

function BabySettings() {
  const ctx = useCtx()
  const { run, message } = useRun()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [birth, setBirth] = useState(ctx.baby.birthDate) // 쌍둥이면 생일이 같으니 기본값으로

  return (
    <>
      {ctx.babies.map((b) => (
        <BabyCard key={b.id} babyId={b.id} canDelete={ctx.babies.length > 1} run={run} />
      ))}

      {adding ? (
        <Section title="아이 추가">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim() || !birth) return
              run(async () => {
                // 쌍둥이는 보통 같은 식단이라 지금 아이의 이유식 설정을 그대로 가져온다
                await repo.addBaby(ctx.household.id, name.trim(), birth, {
                  feedingStyle: ctx.baby.feedingStyle,
                  testIntervalDays: ctx.baby.testIntervalDays,
                  knownIngredients: ctx.baby.knownIngredients,
                })
                setAdding(false)
                setName('')
              }, '추가했어요. Monthly·Weekly 위에서 아이를 바꿔 볼 수 있어요')
            }}
          >
            <label className="flex flex-col gap-0.5">
              <span className="text-[12px] text-ink-soft">이름 (태명도 좋아요)</span>
              <input className="field pen text-[22px]" required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[12px] text-ink-soft">태어난 날</span>
              <input
                className="field pen text-[22px]"
                type="date"
                required
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setAdding(false)}>
                취소
              </button>
              <button className="btn btn-primary flex-1">추가</button>
            </div>
          </form>
        </Section>
      ) : (
        <button
          className="paper-texture mt-4 flex w-full items-center justify-center gap-1.5 rounded-[20px] border border-dashed border-line-strong py-3.5 text-[14px] text-ink-soft"
          onClick={() => setAdding(true)}
        >
          <Plus size={16} /> 쌍둥이·형제 추가
        </button>
      )}
      <p className="mt-2 px-1 text-[12px] leading-relaxed text-ink-faint">
        아이마다 식단과 기록을 따로 적어요. 새로 추가한 아이는 지금 아이의 이유식 설정을 그대로 가져오고, 이유식 설정에서 아이별로 바꿀 수 있어요.
      </p>
      {message}
    </>
  )
}

function BabyCard({
  babyId,
  canDelete,
  run,
}: {
  babyId: string
  canDelete: boolean
  run: (fn: () => Promise<void>, done?: string) => Promise<void>
}) {
  const ctx = useCtx()
  const baby = ctx.babies.find((b) => b.id === babyId)!
  const [name, setName] = useState(baby.name)
  const [birth, setBirth] = useState(baby.birthDate)
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <Section title={baby.name}>
      <label className="flex flex-col gap-0.5">
        <span className="text-[12px] text-ink-soft">이름</span>
        <input className="field pen text-[22px]" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="mt-3 flex flex-col gap-0.5">
        <span className="text-[12px] text-ink-soft">태어난 날</span>
        <input className="field pen text-[22px]" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
      </label>
      {(name !== baby.name || birth !== baby.birthDate) && (
        <button
          className="btn btn-primary mt-3 w-full"
          onClick={() => run(() => repo.updateBaby(baby.id, { name: name.trim(), birthDate: birth }), '저장했어요')}
        >
          저장
        </button>
      )}
      {canDelete && (
        <button
          className={`btn mt-3 w-full text-[13px] ${confirmDelete ? 'bg-alert/15 text-alert' : 'btn-ghost text-ink-soft'}`}
          onClick={() => {
            if (!confirmDelete) return setConfirmDelete(true)
            run(() => repo.deleteBaby(baby.id), `${baby.name}을(를) 삭제했어요`)
          }}
        >
          {confirmDelete ? `${baby.name}의 식단·기록이 모두 지워져요. 한 번 더 누르면 삭제` : '이 아이 삭제'}
        </button>
      )}
    </Section>
  )
}

function FeedingSettings() {
  const ctx = useCtx()
  const { run, message } = useRun()
  const [known, setKnown] = useState('')

  const interval = ctx.baby.testIntervalDays
  const setInterval = (v: number) =>
    run(() => repo.updateBaby(ctx.baby.id, { testIntervalDays: Math.min(14, Math.max(1, v)) }))

  const addKnown = () => {
    const items = known
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!items.length) return
    setKnown('')
    run(() =>
      repo.updateBaby(ctx.baby.id, {
        knownIngredients: [...new Set([...ctx.baby.knownIngredients, ...items])],
      }),
    )
  }

  return (
    <>
      {ctx.babies.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <BabySwitcher />
          <span className="text-[12px] text-ink-soft">{ctx.baby.name}의 설정이에요</span>
        </div>
      )}
      <Section title="이유식 방식">
        <p className="mb-2 text-[12px] text-ink-soft">새 끼니를 적을 때 이 방식이 먼저 보여요. 끼니마다 바꿀 수도 있어요.</p>
        <StylePicker
          value={ctx.baby.feedingStyle}
          onChange={(v) => run(() => repo.updateBaby(ctx.baby.id, { feedingStyle: v }))}
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
          {ctx.baby.knownIngredients.map((k) => (
            <span key={k} className="pen flex items-center gap-1 rounded-full bg-rose-soft py-0.5 pr-1.5 pl-3 text-[19px]">
              {k}
              <button
                aria-label={`${k} 삭제`}
                className="text-ink-soft"
                onClick={() =>
                  run(() =>
                    repo.updateBaby(ctx.baby.id, {
                      knownIngredients: ctx.baby.knownIngredients.filter((x) => x !== k),
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

      {message}
    </>
  )
}

function ShareSettings() {
  const ctx = useCtx()
  if (repo.kind !== 'supabase') {
    return (
      <Section title="공유 연결">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          지금은 로컬 모드라 이 기기에만 저장돼요. 배우자와 실시간으로 공유하려면 Supabase 프로젝트를 만들고
          <code className="mx-1 rounded bg-rose-soft px-1">.env</code>에 주소와 키를 넣어 다시 배포하세요. (README 참고)
        </p>
      </Section>
    )
  }
  return (
    <>
      <MemberList />
      <InviteCode />
      <JoinOtherDiary />
    </>
  )
}

/** 함께 쓰는 사람. 표시 이름과 일부 가린 이메일만 보여주고, 만든 사람은 다른 사람을 내보낼 수 있다 */
function MemberList() {
  const ctx = useCtx()
  const members = useMembers(ctx.household.id)
  const qc = useQueryClient()
  const me = members.data?.find((m) => m.isMe)
  const [name, setName] = useState<string | null>(null) // null = 아직 안 고침
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function act(fn: () => Promise<void>, done: string) {
    setMsg(null)
    try {
      await fn()
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['members'] }),
        qc.invalidateQueries({ queryKey: ['context'] }),
      ])
      setMsg(done)
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  const nameValue = name ?? me?.displayName ?? ''
  return (
    <Section title="함께 쓰는 사람">
      {members.isLoading && <p className="text-[13px] text-ink-faint">불러오는 중…</p>}
      {members.isError && <p className="text-[13px] text-warn">{(members.error as Error).message}</p>}
      <ul className="flex flex-col">
        {members.data?.map((m, i) => (
          <li key={m.userId} className={`py-2.5 ${i ? 'border-t border-line' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="pen text-[22px] leading-none">{m.displayName || '이름 없음'}</span>
              {m.isMe && <span className="rounded-full bg-rose-soft px-2 py-0.5 text-[11px] text-rose-deep">나</span>}
              {m.isOwner && <span className="rounded-full bg-line px-2 py-0.5 text-[11px] text-ink-soft">만든 사람</span>}
              {me?.isOwner && !m.isMe && (
                <button
                  className={`ml-auto rounded-full px-3 py-1 text-[12px] ${
                    confirmId === m.userId ? 'bg-alert/15 text-alert' : 'text-ink-soft'
                  }`}
                  onClick={() => {
                    if (confirmId !== m.userId) return setConfirmId(m.userId)
                    setConfirmId(null)
                    act(
                      () => repo.removeMember(ctx.household.id, m.userId),
                      `${m.displayName || '그 사람'}을(를) 내보냈어요. 초대 코드도 새로 바뀌었어요`,
                    )
                  }}
                >
                  {confirmId === m.userId ? '한 번 더 누르면 내보내기' : '내보내기'}
                </button>
              )}
            </div>
            <p className="mt-1 text-[12px] text-ink-faint">
              {m.maskedEmail}
              {m.joinedAt && ` · ${m.joinedAt.slice(0, 10).replace(/-/g, '.')} 참여`}
            </p>
          </li>
        ))}
      </ul>

      <form
        className="mt-2 flex items-end gap-2 border-t border-line pt-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!nameValue.trim()) return
          act(() => repo.setDisplayName(nameValue.trim()), '이름을 바꿨어요').then(() => setName(null))
        }}
      >
        <label className="flex flex-1 flex-col gap-0.5">
          <span className="text-[12px] text-ink-soft">내 이름</span>
          <input
            className="field pen text-[20px]"
            maxLength={20}
            placeholder="엄마, 아빠, 할머니…"
            value={nameValue}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {name !== null && name.trim() !== (me?.displayName ?? '') && (
          <button className="btn btn-soft px-4 py-1.5 text-[13px]">저장</button>
        )}
      </form>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
        같은 다이어리 사람에게는 이름과 일부를 가린 이메일만 보여요. 다이어리를 만든 사람만 다른 사람을 내보낼 수 있어요.
      </p>
      {msg && <p className="mt-2 text-center text-[13px] text-ink-soft">{msg}</p>}
    </Section>
  )
}

function InviteCode() {
  const ctx = useCtx()
  const members = useMembers(ctx.household.id)
  const isOwner = members.data?.some((m) => m.isMe && m.isOwner) ?? false
  const { run, message } = useRun()
  const [confirm, setConfirm] = useState(false)
  return (
    <Section title="가족 초대">
      <p className="text-[12px] text-ink-soft">가족이 가입한 뒤 '초대 코드로 참여'에 이 코드를 넣으면 함께 볼 수 있어요.</p>
      <p className="date-serif mt-2 text-center text-[34px] tracking-[0.3em] select-all">{ctx.household.inviteCode}</p>
      {isOwner && (
        <button
          className={`btn mt-2 w-full text-[13px] ${confirm ? 'bg-alert/15 text-alert' : 'btn-ghost text-ink-soft'}`}
          onClick={() => {
            if (!confirm) return setConfirm(true)
            setConfirm(false)
            run(() => repo.regenerateInviteCode(ctx.household.id), '새 코드로 바꿨어요. 예전 코드로는 더 이상 들어올 수 없어요')
          }}
        >
          {confirm ? '예전 코드는 못 쓰게 돼요. 한 번 더 누르면 바꾸기' : '코드 바꾸기'}
        </button>
      )}
      {message}
    </Section>
  )
}

function AccountSettings() {
  const user = useUser()
  return (
    <Section title={user?.email ?? '내 계정'}>
      <ChangePassword />
      <button className="btn btn-ghost mt-3 w-full text-[13px]" onClick={() => repo.signOut()}>
        로그아웃
      </button>
    </Section>
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
