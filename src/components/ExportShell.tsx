import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { renderNodeToImage } from '../lib/exportImage'

export const SCENE_W = 1500
/** 장면(배경 포함) 세로 패딩. 나눌 높이를 계산할 때 쓴다 */
export const SCENE_PAD_Y = 120

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

/**
 * 이미지 내보내기 화면: 배경을 고르고, 미리보기를 보고, 저장·공유한다.
 * pages 가 여러 개면 한 장씩 따로 이미지로 만든다 (파일 이름 뒤에 -1, -2 …)
 */
export default function ExportShell({
  fileName,
  shareTitle,
  pages,
}: {
  fileName: string
  shareTitle: string
  pages: React.ReactNode[]
}) {
  const navigate = useNavigate()
  const [backdrop, setBackdrop] = useState<Backdrop>('wall')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(0.25)
  const wrapRef = useRef<HTMLDivElement>(null)
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([])
  const multi = pages.length > 1

  useLayoutEffect(() => {
    const update = () => wrapRef.current && setScale(wrapRef.current.clientWidth / SCENE_W)
    update()
    const ro = new ResizeObserver(update)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator
  const nameOf = (i: number) => (multi ? fileName.replace(/\.jpg$/, `-${i + 1}.jpg`) : fileName)

  async function make(): Promise<File[] | null> {
    setError(null)
    try {
      const files: File[] = []
      for (let i = 0; i < pages.length; i++) {
        const node = sceneRefs.current[i]
        if (!node) return null
        setBusy(multi ? `만드는 중… ${i + 1}/${pages.length}` : '만드는 중…')
        const blob = await renderNodeToImage(node, 1.6)
        files.push(new File([blob], nameOf(i), { type: 'image/jpeg' }))
      }
      return files
    } catch (e) {
      setError((e as Error).message || '이미지를 만들지 못했어요')
      return null
    } finally {
      setBusy(null)
    }
  }

  function save(files: File[]) {
    files.forEach((file, i) => {
      // 여러 장을 한꺼번에 받으면 브라우저가 막는 경우가 있어 조금씩 띄운다
      setTimeout(() => {
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      }, i * 400)
    })
  }

  async function download() {
    const files = await make()
    if (files) save(files)
  }

  async function share() {
    const files = await make()
    if (!files) return
    if (navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files, title: shareTitle })
      } catch {
        // 사용자가 공유 창을 닫음
      }
    } else {
      save(files)
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

      <div ref={wrapRef} className="mx-3 flex flex-col gap-3">
        {pages.map((page, i) => (
          <ScenePreview
            key={i}
            scale={scale}
            sceneRef={(el) => {
              sceneRefs.current[i] = el
            }}
            style={BACKDROPS[backdrop].style}
          >
            {page}
          </ScenePreview>
        ))}
      </div>
      {multi && (
        <p className="mt-2 text-center text-[12px] text-paper/60">세로로 길어서 {pages.length}장으로 나눴어요</p>
      )}

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
          <button className="btn flex-1 bg-paper text-ink" onClick={download} disabled={!!busy}>
            <Download size={17} /> {busy ?? (multi ? `이미지 ${pages.length}장 저장` : '이미지 저장')}
          </button>
          {canShare && (
            <button className="btn flex-1 border border-paper/40 text-paper" onClick={share} disabled={!!busy}>
              <Share2 size={17} /> 공유
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** 장면 하나의 축소 미리보기. 장면 높이에 맞춰 틀 높이를 잡는다 */
function ScenePreview({
  scale,
  sceneRef,
  style,
  children,
}: {
  scale: number
  sceneRef: (el: HTMLDivElement | null) => void
  style: React.CSSProperties
  children: React.ReactNode
}) {
  const [h, setH] = useState(2000)
  const ref = useRef<HTMLDivElement | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setH(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="overflow-hidden rounded-md shadow-2xl" style={{ height: h * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: SCENE_W }}>
        <div
          ref={(el) => {
            ref.current = el
            sceneRef(el)
          }}
          style={{ width: SCENE_W, paddingTop: SCENE_PAD_Y, paddingBottom: SCENE_PAD_Y, ...style }}
          className="relative px-[110px] text-ink"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/** 마스킹테이프로 벽에 붙인 종이 한 장. seed 마다 살짝 다르게 기울어진다 */
/** 종이 그림자 층: [아래로 밀림, 번짐, 진하기] */
const PAPER_SHADOW: [number, number, number][] = [
  [1, 1, 0.08],
  [4, 8, 0.08],
  [18, 36, 0.12],
  [40, 80, 0.1],
]
const SHADOW_PAD = 140

/**
 * 종이 그림자를 캔버스로 미리 그려 이미지로 쓴다. CSS box-shadow는 html-to-image로 저장할 때
 * 브라우저(특히 휴대폰)에 따라 번짐이 네모나게 잘리거나 어긋나서, 어디서나 똑같이 나오는 그림으로 바꿨다
 */
function usePaperShadow(ref: React.RefObject<HTMLDivElement | null>) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let last = ''
    const draw = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h || `${w}x${h}` === last) return
      last = `${w}x${h}`
      const c = document.createElement('canvas')
      c.width = w + SHADOW_PAD * 2
      c.height = h + SHADOW_PAD * 2
      const g = c.getContext('2d')!
      // 종이 자체는 캔버스 밖에 그리고 그림자만 안으로 옮겨 온다
      const away = c.width + 1000
      g.fillStyle = '#000'
      for (const [y, blur, a] of PAPER_SHADOW) {
        g.shadowColor = `rgba(60,40,25,${a})`
        g.shadowBlur = blur
        g.shadowOffsetX = away
        g.shadowOffsetY = y
        g.fillRect(SHADOW_PAD - away, SHADOW_PAD, w, h)
      }
      setUrl(c.toDataURL('image/png'))
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return url
}

export function PaperSheet({ seed, children }: { seed: number; children: React.ReactNode }) {
  const tilt = ((seed * 7) % 5) * 0.15 - 0.3
  const ref = useRef<HTMLDivElement>(null)
  const shadow = usePaperShadow(ref)
  return (
    <div ref={ref} className="relative">
      {/* 종이 그림자: 벽에서 살짝 떠 있는 느낌. 기울이지 않은 층에 따로 깐다 (기울기가 작아 어긋남은 안 보인다) */}
      {shadow && (
        <img
          src={shadow}
          alt=""
          className="pointer-events-none absolute max-w-none"
          style={{ left: -SHADOW_PAD, top: -SHADOW_PAD, width: `calc(100% + ${SHADOW_PAD * 2}px)`, height: `calc(100% + ${SHADOW_PAD * 2}px)` }}
        />
      )}
      <div className="relative" style={{ transform: `rotate(${tilt}deg)` }}>
        <div
          className="relative px-[64px] pt-[70px] pb-[64px]"
          style={{
            backgroundColor: '#fdfbf6',
            backgroundImage:
              'linear-gradient(115deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0.025) 100%), radial-gradient(rgba(120,90,60,0.03) 1px, transparent 1px)',
            backgroundSize: '100% 100%, 6px 6px',
          }}
        >
          {children}
        </div>
        <Tape className="-top-[18px] -left-[42px] w-[150px] rotate-[-38deg]" color="#e4d3b8" />
        <Tape className="-top-[18px] -right-[42px] w-[150px] rotate-[38deg]" color="#c9d6c0" />
        <Tape className="-bottom-[20px] -left-[38px] w-[140px] rotate-[34deg]" color="#c9d6c0" />
        <Tape className="-right-[40px] -bottom-[20px] w-[140px] rotate-[-36deg]" color="#e4d3b8" />
      </div>
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
