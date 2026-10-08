import { useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { AlertTriangle, Camera, Plus, Trash2, X } from 'lucide-react'
import { repo } from '../data'
import { checkDraft, normalizeName } from '../lib/rules'
import { pairingNotes, pairingSuggestions } from '../lib/pairings'
import ReactionEmoji from './ReactionEmoji'
import { preparePhoto } from '../lib/image'
import { circled } from '../lib/dates'
import { emptyLog, ITEM_REACTIONS, type FeedingStyle, type ItemReaction, type Meal, type MealItem, type MealLog } from '../lib/types'

interface Props {
  babyId: string
  date: string
  slot: number
  meal: Meal | null
  allMeals: Meal[]
  intervalDays: number
  knownIngredients: string[]
  ingredientNames: string[]
  defaultStyle: FeedingStyle
  onSave: (meal: Omit<Meal, 'id' | 'updatedAt'> & { id?: string }) => Promise<unknown>
  onDelete: (id: string) => void
  onClose: () => void
}

export default function MealSheet(props: Props) {
  const { meal, date, slot } = props
  const [style, setStyle] = useState<FeedingStyle>(meal ? (meal.style ?? 'topping') : props.defaultStyle)
  const [title, setTitle] = useState(meal?.title ?? '')
  const [totalMl, setTotalMl] = useState<number | null>(meal?.totalMl ?? null)
  const porridge = style === 'porridge'
  const [items, setItems] = useState<MealItem[]>(meal?.items.length ? meal.items : [{ name: '', grams: null }])
  const [log, setLog] = useState<MealLog | null>(meal?.log ?? null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const cleanItems = items.filter((i) => i.name.trim())
  const warnings = useMemo(
    () =>
      checkDraft(
        props.allMeals,
        { id: meal?.id, date, slot, items: cleanItems },
        props.intervalDays,
        props.knownIngredients,
      ),
    [props.allMeals, meal?.id, date, slot, JSON.stringify(cleanItems), props.intervalDays, props.knownIngredients],
  )

  const itemNames = cleanItems.map((i) => i.name)
  const pairs = useMemo(() => pairingNotes(itemNames), [itemNames.join('|')])
  const suggestions = useMemo(
    () => pairingSuggestions(itemNames, props.ingredientNames),
    [itemNames.join('|'), props.ingredientNames],
  )

  // 예전 기록(끼니 전체 반응)은 재료별 반응을 하나도 안 골랐을 때만 그 값을 유지한다
  const hasIssue = log
    ? Object.keys(log.itemReactions ?? {}).length
      ? Object.values(log.itemReactions ?? {}).includes('issue')
      : log.reaction === 'issue'
    : false

  function setItemReaction(key: string, value: ItemReaction | null) {
    setLog((l) => {
      if (!l) return l
      const next = { ...(l.itemReactions ?? {}) }
      if (value) next[key] = value
      else delete next[key]
      return { ...l, itemReactions: next }
    })
  }

  function updateItem(i: number, patch: Partial<MealItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { full, thumb } = await preparePhoto(file)
      const [url, thumbUrl] = await Promise.all([
        repo.uploadPhoto(props.babyId, full),
        repo.uploadPhoto(props.babyId, thumb),
      ])
      setLog((l) => ({ ...(l ?? emptyLog()), photoUrl: url, photoThumbUrl: thumbUrl }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function finishLog(l: MealLog): MealLog {
    const keys = new Set(cleanItems.map((i) => normalizeName(i.name)))
    const reactions = Object.fromEntries(Object.entries(l.itemReactions ?? {}).filter(([k]) => keys.has(k)))
    const picked = Object.keys(reactions).length > 0
    return {
      ...l,
      itemReactions: reactions,
      reaction: picked ? (Object.values(reactions).includes('issue') ? 'issue' : 'none') : l.reaction,
      loggedAt: meal?.log?.loggedAt ?? new Date().toISOString(),
    }
  }

  async function save() {
    if (!cleanItems.length) {
      setError('재료를 하나 이상 적어주세요')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await props.onSave({
        id: meal?.id,
        babyId: props.babyId,
        date,
        slot,
        style,
        title: porridge ? title.trim() : '',
        totalMl: porridge ? totalMl : null,
        items: cleanItems.map((i) => ({ name: i.name.trim(), grams: porridge ? null : i.grams })),
        log: log ? finishLog(log) : null,
      })
      props.onClose()
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25" onClick={props.onClose}>
      <div
        className="paper-texture sheet-up safe-bottom max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[26px] px-5 pt-4 pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] text-ink-soft">{format(parseISO(date), 'M월 d일 EEEE', { locale: ko })}</p>
            <h2 className="pen text-[30px] leading-tight">{circled(slot)} 끼니</h2>
          </div>
          <button aria-label="닫기" className="p-1 text-ink-soft" onClick={props.onClose}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {/* 식단 */}
        <div className="mt-4 flex items-center justify-between">
          <h3 className="title-serif text-[20px] italic">Menu</h3>
          <div className="flex rounded-full bg-rose-soft p-0.5 text-[13px]">
            {(['topping', 'porridge'] as const).map((v) => (
              <button
                key={v}
                className={`rounded-full px-3.5 py-1 ${style === v ? 'bg-ink text-paper' : 'text-ink-soft'}`}
                onClick={() => setStyle(v)}
              >
                {v === 'topping' ? '토핑' : '죽'}
              </button>
            ))}
          </div>
        </div>
        {porridge && (
          <div className="mt-1 flex items-end gap-2">
            <input
              className="field pen min-w-0 flex-1 text-[22px]"
              placeholder="죽 이름 (예: 소고기양배추죽)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex w-[96px] shrink-0 items-end">
              <input
                className="field pen w-full text-right text-[22px]"
                inputMode="decimal"
                placeholder="0"
                value={totalMl ?? ''}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, '')
                  setTotalMl(v === '' ? null : Number(v))
                }}
              />
              <span className="pen shrink-0 pb-1 pl-0.5 text-[20px] text-ink-soft">ml</span>
            </div>
          </div>
        )}
        {porridge && <p className="mt-3 text-[12px] text-ink-soft">들어간 재료</p>}
        <datalist id="ingredient-names">
          {props.ingredientNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <div className="mt-1 flex flex-col gap-1.5">
          {items.map((it, i) => (
            <div key={i} className="flex items-end gap-2">
              <input
                className="field pen min-w-0 flex-1 text-[22px]"
                placeholder={i === 0 ? '쌀' : '재료'}
                list="ingredient-names"
                value={it.name}
                onChange={(e) => updateItem(i, { name: e.target.value })}
              />
              {!porridge && (
                <div className="flex w-[78px] items-end">
                  <input
                    className="field pen w-full text-right text-[22px]"
                    inputMode="decimal"
                    placeholder="0"
                    value={it.grams ?? ''}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      updateItem(i, { grams: v === '' ? null : Number(v) })
                    }}
                  />
                  <span className="pen pb-1 pl-0.5 text-[20px] text-ink-soft">g</span>
                </div>
              )}
              <button
                aria-label="재료 삭제"
                className="p-1.5 text-ink-faint"
                onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          className="mt-2 flex items-center gap-1 text-[13px] text-rose-deep"
          onClick={() => setItems((p) => [...p, { name: '', grams: null }])}
        >
          <Plus size={15} /> 재료 추가
        </button>

        {warnings.length > 0 && (
          <div className="mt-3 rounded-xl bg-warn/10 px-3 py-2">
            {warnings.map((w) => (
              <p key={w} className="flex items-start gap-1.5 text-[13px] text-warn">
                <AlertTriangle size={14} className="mt-[2px] shrink-0" />
                {w}
              </p>
            ))}
            <p className="mt-1 text-[11px] text-ink-soft">저장은 그대로 할 수 있어요.</p>
          </div>
        )}

        {(pairs.length > 0 || suggestions.length > 0) && (
          <div className="mt-3 rounded-xl bg-sage/10 px-3 py-2">
            {pairs.map((p) => (
              <p key={p.reason} className="text-[13px] leading-snug">
                <span className={p.kind === 'good' ? 'text-sage' : 'text-warn'}>
                  {p.kind === 'good' ? '💡 ' : '⚖️ '}
                  {p.a} + {p.b}
                </span>
                <span className="text-ink-soft"> · {p.reason}</span>
              </p>
            ))}
            {suggestions.map((s) => (
              <p key={s.for} className="mt-0.5 text-[12px] text-ink-soft">
                {s.for}와(과) 어울리는 먹어본 재료:{' '}
                {s.names.map((n, i) => (
                  <button
                    key={n}
                    className="text-sage underline decoration-dotted underline-offset-2"
                    onClick={() =>
                      setItems((prev) => [...prev.filter((it) => it.name.trim()), { name: n, grams: null }])
                    }
                  >
                    {n}
                    {i < s.names.length - 1 ? ', ' : ''}
                  </button>
                ))}
              </p>
            ))}
            <p className="mt-1 text-[11px] text-ink-faint">재료 궁합은 참고용이에요{suggestions.length ? ' · 이름을 누르면 재료에 추가돼요' : ''}</p>
          </div>
        )}

        {/* 기록 */}
        <div className="mt-6 flex items-center justify-between">
          <h3 className="title-serif text-[20px] italic">Record</h3>
          <button
            className={`rounded-full px-3 py-1 text-[13px] ${log ? 'bg-ink text-paper' : 'bg-rose-soft'}`}
            onClick={() => setLog(log ? null : emptyLog())}
          >
            {log ? '먹였어요 ✓' : '먹였어요'}
          </button>
        </div>

        {log && (
          <div className="mt-2 flex flex-col gap-4">
            <label className="flex flex-col gap-0.5">
              <span className="text-[12px] text-ink-soft">먹은 양</span>
              <input
                className="field pen text-[22px]"
                placeholder="예: 40ml, 절반"
                value={log.eatenAmount}
                onChange={(e) => setLog({ ...log, eatenAmount: e.target.value })}
              />
            </label>

            <div>
              <span className="text-[12px] text-ink-soft">재료별 반응</span>
              {cleanItems.length ? (
                <div className="mt-1 flex flex-col">
                  {cleanItems.map((it) => {
                    const key = normalizeName(it.name)
                    const picked = log.itemReactions?.[key] ?? null
                    return (
                      <div key={key} className="flex items-center gap-2 border-b border-dashed border-line py-1">
                        <span
                          className={`pen min-w-0 flex-1 truncate text-[21px] ${picked === 'issue' ? 'text-alert' : ''}`}
                        >
                          {it.name.trim()}
                        </span>
                        {ITEM_REACTIONS.map((r) => (
                          <button
                            key={r.value}
                            aria-label={`${it.name.trim()} ${r.label}`}
                            aria-pressed={picked === r.value}
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-[17px] transition ${
                              picked === r.value
                                ? r.value === 'issue'
                                  ? 'bg-alert/15 ring-1 ring-alert'
                                  : 'bg-rose-soft ring-1 ring-ink-soft'
                                : picked
                                  ? 'opacity-30 grayscale'
                                  : 'opacity-70'
                            }`}
                            onClick={() => setItemReaction(key, picked === r.value ? null : r.value)}
                          >
                            <ReactionEmoji reaction={r.value} />
                          </button>
                        ))}
                      </div>
                    )
                  })}
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {ITEM_REACTIONS.map((r, i) => (
                      <span key={r.value}>
                        {i > 0 && '  ·  '}
                        <ReactionEmoji reaction={r.value} /> {r.label}
                      </span>
                    ))}
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-[12px] text-ink-faint">위에 재료를 적으면 재료마다 반응을 고를 수 있어요</p>
              )}
              {(hasIssue || log.reactionNote) && (
                <input
                  className="field pen mt-2 text-[20px]"
                  placeholder="이상 반응 메모 (예: 입 주변 발진, 2시간 뒤 가라앉음)"
                  value={log.reactionNote}
                  onChange={(e) => setLog({ ...log, reactionNote: e.target.value })}
                />
              )}
            </div>

            <div>
              <span className="text-[12px] text-ink-soft">사진</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickPhoto(e.target.files?.[0])}
              />
              {log.photoUrl ? (
                <div className="relative mt-1 w-fit rotate-[-1.5deg] bg-card p-2 pb-6 shadow-md">
                  <img src={log.photoUrl} alt="" decoding="async" className="h-[150px] w-[150px] object-cover" />
                  <button
                    aria-label="사진 삭제"
                    className="absolute top-3 right-3 rounded-full bg-ink/60 p-1 text-paper"
                    onClick={() => setLog({ ...log, photoUrl: null, photoThumbUrl: null })}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  className="mt-1 flex h-[90px] w-[90px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-[12px] text-ink-soft"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera size={20} strokeWidth={1.4} />
                  {uploading ? '올리는 중…' : '사진 추가'}
                </button>
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-[13px] text-warn">{error}</p>}

        <div className="mt-6 flex gap-2">
          {meal && (
            <button
              className={`btn px-3 ${confirmDelete ? 'bg-warn/15 text-warn' : 'btn-ghost'}`}
              aria-label="끼니 삭제"
              onClick={() => {
                if (!confirmDelete) return setConfirmDelete(true)
                props.onDelete(meal.id)
                props.onClose()
              }}
            >
              <Trash2 size={18} strokeWidth={1.5} />
              {confirmDelete && <span className="text-[13px]">한 번 더 누르면 삭제</span>}
            </button>
          )}
          <button className="btn btn-primary flex-1" onClick={save} disabled={saving || uploading}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
