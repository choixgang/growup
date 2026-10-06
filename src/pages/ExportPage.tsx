import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCtx } from '../App'
import MonthGrid from '../components/MonthGrid'
import MonthInfo from '../components/MonthInfo'
import { useAnalysis, useMeals, useMonthNote } from '../data/hooks'
import { renderNodeToImage } from '../lib/exportImage'

const SCENE_W = 1500

type Backdrop = 'wall' | 'linen' | 'wood'

const BACKDROPS: Record<Backdrop, { label: string; style: React.CSSProperties }> = {
  wall: {
    label: '벽',
    style: {
      backgroundColor: '#e9e6e1',
      backgroundImage:
        'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.55), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(80,70,60,0.10), transparent 55%), radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)',
      backgroundSize: '100% 100%, 100% 100%, 5px 5px',
    },
  },
  linen: {
    label: '린넨',
    style: {
      backgroundColor: '#e4d9cb',
      backgroundImage:
        'radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.45), transparent 60%), repeating-linear-gradient(0deg, rgba(120,95,70,0.06) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(120,95,70,0.05) 0 1px, transparent 1px 5px)',
    },
  },
  wood: {
    label: '우드',
    style: {
      backgroundColor: '#d8bf9f',
      backgroundImage:
        'radial-gradient(ellipse at 30% 20%, rgba(255,240,220,0.45), transparent 60%), repeating-linear-gradient(92deg, rgba(110,70,40,0.07) 0 3px, transparent 3px 22px, rgba(110,70,40,0.05) 22px 24px, transparent 24px 61px)',
    },
  },
}

export default function ExportPage() {
  const ctx = useCtx()
  const navigate = useNavigate()
  const { month = format(new Date(), 'yyyy-MM') } = useParams()
  const meals = useMeals(ctx.baby.id)
  const analysis = useAnalysis(meals.data, ctx)
  const note = useMonthNote(ctx.baby.id, month)

  const [backdrop, setBackdrop] = useState<Backdrop>('wall')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(0.25)
  const [sceneH, setSceneH] = useState(2000)
  const wrapRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const update = () => {
      if (wrapRef.current) setScale(wrapRef.current.clientWidth / SCENE_W)
      if (sceneRef.current) setSceneH(sceneRef.current.offsetHeight)
    }
    update()
    const ro = new ResizeObserver(update)
    if (wrapRef.current) ro.observe(wrapRef.current)
    if (sceneRef.current) ro.observe(sceneRef.current)
    return () => ro.disconnect()
  }, [])

  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator
  const fileName = `이유식-${month}.jpg`

  async function make(): Promise<Blob | null> {
    if (!sceneRef.current) return null
    setBusy(true)
    setError(null)
    try {
      return await renderNodeToImage(sceneRef.current, 1.6)
    } catch (e) {
      setError((e as Error).message || '이미지를 만들지 못했어요')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function download() {
    const blob = await make()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  async function share() {
    const blob = await make()
    if (!blob) return
    const file = new File([blob], fileName, { type: 'image/jpeg' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${format(parseISO(`${month}-01`), 'M월')} 이유식` })
      } catch {
        // 사용자가 공유 창을 닫음
      }
    } else {
      await download()
    }
  }

  useEffect(() => {
    document.body.style.background = '#2f2925'
    return () => {
      document.body.style.background = ''
    }
  }, [])

  return (
    <div className="min-h-dvh bg-[#2f2925] text-paper">
      <header className="flex items-center justify-between px-3 pt-[max(12px,env(safe-area-inset-top))] pb-2">
        <button className="flex items-center gap-1 p-1 text-[14px] text-paper/80" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> 돌아가기
        </button>
        <p className="title-serif text-[22px] italic">Export</p>
        <span className="w-[72px]" />
      </header>

      <div ref={wrapRef} className="mx-3 overflow-hidden rounded-md shadow-2xl" style={{ height: sceneH * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: SCENE_W }}>
          <div ref={sceneRef} style={{ width: SCENE_W, ...BACKDROPS[backdrop].style }} className="relative px-[110px] py-[120px] text-ink">
            <PaperSheet month={month}>
              {note.data && (
                <>
                  <SheetHeader month={month} babyName={ctx.baby.name}>
                    <MonthInfo variant="export" note={note.data} />
                  </SheetHeader>
                  <div className="mt-8">
                    <MonthGrid
                      variant="export"
                      month={month}
                      meals={meals.data ?? []}
                      analysis={analysis}
                      birthDate={ctx.baby.birthDate}
                    />
                  </div>
                </>
              )}
            </PaperSheet>
          </div>
        </div>
      </div>

      <div className="safe-bottom mx-auto max-w-[520px] px-4 pt-4 pb-6">
        <div className="flex justify-center gap-2">
          {(Object.keys(BACKDROPS) as Backdrop[]).map((b) => (
            <button
              key={b}
              onClick={() => setBackdrop(b)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] ${
                backdrop === b ? 'border-paper text-paper' : 'border-paper/25 text-paper/60'
              }`}
            >
              <span className="h-4 w-4 rounded-full" style={BACKDROPS[b].style} />
              {BACKDROPS[b].label}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-center text-[13px] text-rose">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button className="btn flex-1 bg-paper text-ink" onClick={download} disabled={busy}>
            <Download size={17} /> {busy ? '만드는 중…' : '이미지 저장'}
          </button>
          {canShare && (
            <button className="btn flex-1 border border-paper/40 text-paper" onClick={share} disabled={busy}>
              <Share2 size={17} /> 공유
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** 마스킹테이프로 벽에 붙인 종이 한 장 */
function PaperSheet({ month, children }: { month: string; children: React.ReactNode }) {
  // 달마다 살짝 다르게 기울어지게
  const tilt = ((parseInt(month.slice(5), 10) * 7) % 5) * 0.15 - 0.3
  return (
    <div className="relative" style={{ transform: `rotate(${tilt}deg)` }}>
      {/* 종이 그림자: 벽에서 살짝 떠 있는 느낌 */}
      <div
        className="relative px-[64px] pt-[70px] pb-[64px]"
        style={{
          backgroundColor: '#fdfbf6',
          backgroundImage:
            'linear-gradient(115deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0.025) 100%), radial-gradient(rgba(120,90,60,0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 6px 6px',
          boxShadow:
            '0 1px 1px rgba(60,40,25,0.08), 0 4px 8px rgba(60,40,25,0.08), 0 18px 36px rgba(60,40,25,0.12), 0 40px 80px rgba(60,40,25,0.10)',
        }}
      >
        {children}
      </div>
      <Tape className="-top-[18px] -left-[42px] w-[150px] rotate-[-38deg]" color="#e4d3b8" />
      <Tape className="-top-[18px] -right-[42px] w-[150px] rotate-[38deg]" color="#c9d6c0" />
      <Tape className="-bottom-[20px] -left-[38px] w-[140px] rotate-[34deg]" color="#c9d6c0" />
      <Tape className="-right-[40px] -bottom-[20px] w-[140px] rotate-[-36deg]" color="#e4d3b8" />
    </div>
  )
}

function Tape({ className, color }: { className: string; color: string }) {
  return (
    <div
      className={`tape absolute h-[52px] ${className}`}
      style={{
        backgroundColor: color,
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        opacity: 0.78,
      }}
    />
  )
}

function SheetHeader({ month, babyName, children }: { month: string; babyName: string; children: React.ReactNode }) {
  const d = parseISO(`${month}-01`)
  return (
    <div className="flex items-start justify-between gap-10">
      <div className="flex items-center gap-8">
        <div className="flex h-[150px] w-[150px] shrink-0 flex-col items-center justify-center rounded-full bg-[#e9e2da]">
          <span className="date-serif mb-2 text-[22px] leading-none text-ink-soft">{format(d, 'yyyy')}</span>
          <span className="date-serif text-[52px] leading-none">{format(d, 'M')}월</span>
        </div>
        <div>
          <p className="font-batang text-[52px] leading-none font-bold whitespace-nowrap">이유식 식단표</p>
          <p className="mt-3 text-[20px] text-ink-soft">{babyName} · 우리가 함께 기록한 한 달</p>
        </div>
      </div>
      <div className="w-[560px] pt-2">{children}</div>
    </div>
  )
}
