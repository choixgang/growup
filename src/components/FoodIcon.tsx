import type { ReactElement } from 'react'

/**
 * 식재료 일러스트. 48×48 안에 납작한 도형 몇 개로 그린다.
 * 먹기 전에는 화면에서 흑백으로 바꿔 보여준다 (FoodsPage).
 */

type El = ReactElement

// ── 자주 쓰는 모양 ──────────────────────────────────────────

/** 곡물 낟알 하나 */
const kernel = (cx: number, cy: number, rx: number, ry: number, fill: string, rot = 0, line?: string) => (
  <g transform={`rotate(${rot} ${cx} ${cy})`}>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />
    {line && <path d={`M${cx} ${cy - ry * 0.7} Q${cx + rx * 0.25} ${cy} ${cx} ${cy + ry * 0.7}`} stroke={line} strokeWidth={1} fill="none" strokeLinecap="round" />}
  </g>
)

/** 낟알 세 개 묶음 */
const grains = (fill: string, line?: string, rx = 6, ry = 10) => (
  <>
    {kernel(16, 26, rx, ry, fill, -18, line)}
    {kernel(32, 26, rx, ry, fill, 18, line)}
    {kernel(24, 22, rx, ry, fill, 0, line)}
  </>
)

/** 잎채소 한 장 (줄기 + 잎맥) */
const leaf = (fill: string, vein: string, stem = vein, d = 'M24 41 C10 34 8 15 23 5 C39 14 39 33 24 41 Z') => (
  <>
    <path d="M24 46 L24 34" stroke={stem} strokeWidth={3} strokeLinecap="round" />
    <path d={d} fill={fill} />
    <path d="M24 39 L24 12 M24 30 L16 23 M24 30 L32 23 M24 22 L18 16 M24 22 L30 16" stroke={vein} strokeWidth={1.2} fill="none" strokeLinecap="round" />
  </>
)

/** 버섯 */
const mushroom = (cap: string, stem: string, capD = 'M8 24 C8 10 40 10 40 24 Z', stemD = 'M19 24 L18 40 Q24 43 30 40 L29 24 Z', gill?: string) => (
  <>
    <path d={stemD} fill={stem} />
    <path d={capD} fill={cap} />
    {gill && <path d="M11 24 L37 24" stroke={gill} strokeWidth={1.5} strokeLinecap="round" />}
  </>
)

/** 둥근 결구 채소 (양배추·양상추·적채) */
const head = (fill: string, vein: string, inner: string) => (
  <>
    <circle cx={24} cy={26} r={17} fill={fill} />
    <path d="M24 9 C14 16 14 36 24 43" stroke={vein} strokeWidth={1.3} fill="none" />
    <path d="M24 9 C34 16 34 36 24 43" stroke={vein} strokeWidth={1.3} fill="none" />
    <path d="M12 18 C18 22 18 32 12 36 M36 18 C30 22 30 32 36 36" stroke={vein} strokeWidth={1} fill="none" />
    <ellipse cx={24} cy={24} rx={5} ry={7} fill={inner} opacity={0.5} />
  </>
)

/** 가는 줄기 묶음 (부추·파·숙주·콩나물·팽이) */
const strands = (color: string, tip?: string, tipR = 2.2, n = 5) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const x = 14 + (i * 20) / (n - 1)
      const top = 8 + (i % 2) * 4
      const bend = (i - (n - 1) / 2) * 1.5
      return (
        <g key={i}>
          <path d={`M${x} 44 Q${x + bend} 26 ${x + bend * 2} ${top}`} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          {tip && <circle cx={x + bend * 2} cy={top} r={tipR} fill={tip} />}
        </g>
      )
    })}
  </>
)

/** 생선 토막 */
const fillet = (fill: string, skin: string, stripe: string) => (
  <>
    <path d="M6 30 C10 14 34 10 43 18 C44 28 30 38 10 38 Z" fill={fill} />
    <path d="M30 13 C38 13 43 16 43 18 C44 24 39 30 33 33 C37 26 36 18 30 13 Z" fill={skin} />
    <path d="M14 33 C18 26 24 20 32 17 M11 27 C16 21 22 17 28 15 M18 36 C22 30 28 25 35 22" stroke={stripe} strokeWidth={1.2} fill="none" strokeLinecap="round" />
  </>
)

/** 동그란 열매 + 꼭지 + 잎 */
const fruit = (fill: string, shade: string, leafFill = '#7d9a5c', r = 15, cy = 27) => (
  <>
    <circle cx={24} cy={cy} r={r} fill={fill} />
    <path d={`M${24 - r * 0.7} ${cy + r * 0.3} A${r} ${r} 0 0 0 ${24 + r * 0.6} ${cy + r * 0.75} A${r * 1.1} ${r * 1.1} 0 0 1 ${24 - r * 0.7} ${cy + r * 0.3} Z`} fill={shade} opacity={0.5} />
    <path d={`M24 ${cy - r + 2} L25 ${cy - r - 4}`} stroke="#7a5a3c" strokeWidth={2} strokeLinecap="round" />
    <path d={`M25 ${cy - r - 2} C30 ${cy - r - 8} 36 ${cy - r - 4} 34 ${cy - r - 1} C31 ${cy - r + 1} 27 ${cy - r} 25 ${cy - r - 2} Z`} fill={leafFill} />
  </>
)

/** 기름병 */
const bottle = (oil: string, glass = '#eef0e8', cap = '#8b6b4e') => (
  <>
    <rect x={20} y={4} width={8} height={6} rx={1.5} fill={cap} />
    <path d="M20 10 L28 10 L28 16 C34 19 35 22 35 26 L35 42 Q35 45 32 45 L16 45 Q13 45 13 42 L13 26 C13 22 14 19 20 16 Z" fill={glass} />
    <path d="M14 27 L34 27 L34 42 Q34 44 32 44 L16 44 Q14 44 14 42 Z" fill={oil} />
    <rect x={17} y={31} width={14} height={8} rx={1.5} fill="#fffaf0" opacity={0.85} />
  </>
)

/** 견과·콩 알 */
const bean = (cx: number, cy: number, rx: number, ry: number, fill: string, rot = 0, mark?: string) => (
  <g transform={`rotate(${rot} ${cx} ${cy})`}>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />
    {mark && <ellipse cx={cx - rx * 0.45} cy={cy} rx={rx * 0.18} ry={ry * 0.35} fill={mark} />}
  </g>
)

// ── 재료별 그림 ────────────────────────────────────────────

const ICONS: Record<string, El> = {
  // 곡물
  쌀: grains('#f7f3ea', '#e2d9c6'),
  현미: grains('#e3cfa4', '#c9ae7a'),
  찹쌀: grains('#ffffff', '#e6e0d6', 6.5, 9),
  오트밀: (
    <>
      {[[14, 18, -20], [30, 16, 25], [22, 30, 5], [36, 32, -30], [12, 34, 40]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={7.5} ry={5.5} transform={`rotate(${r} ${x} ${y})`} fill={i % 2 ? '#e8d6b0' : '#dcc497'} />
      ))}
    </>
  ),
  차조: (
    <>
      {[[16, 18], [26, 14], [34, 22], [20, 28], [30, 32], [14, 36], [38, 36], [24, 40]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill={i % 3 === 0 ? '#b98a3e' : '#d8b25a'} />
      ))}
    </>
  ),
  퀴노아: (
    <>
      {[[14, 20], [24, 16], [34, 20], [18, 30], [30, 30], [24, 38], [12, 38], [36, 38]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={4.6} fill="#ecd9b0" />
          <circle cx={x} cy={y} r={4.6} fill="none" stroke="#cfa96a" strokeWidth={1} />
        </g>
      ))}
    </>
  ),
  보리: (
    <>
      {kernel(17, 25, 7, 12, '#d9b77a', -14, '#a8803f')}
      {kernel(31, 25, 7, 12, '#cfa964', 14, '#a8803f')}
    </>
  ),
  메밀: (
    <>
      <path d="M10 34 L18 12 L26 34 Z" fill="#8a6a4a" />
      <path d="M22 38 L32 14 L41 38 Z" fill="#a6835c" />
      <path d="M18 14 L18 33 M32 16 L32 37" stroke="#6b4f35" strokeWidth={1} />
    </>
  ),
  참깨: (
    <>
      {[[14, 16, -30], [26, 12, 10], [36, 20, 40], [18, 28, 15], [30, 30, -20], [22, 40, 30], [36, 38, -10], [10, 38, 5]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y - 5} C${x + 4} ${y - 1} ${x + 3} ${y + 4} ${x} ${y + 5} C${x - 3} ${y + 4} ${x - 4} ${y - 1} ${x} ${y - 5} Z`} transform={`rotate(${r} ${x} ${y})`} fill="#f3e6c8" stroke="#d8c39a" strokeWidth={0.8} />
      ))}
    </>
  ),
  밀: (
    <>
      <path d="M24 46 L24 10" stroke="#c99a45" strokeWidth={2} strokeLinecap="round" />
      {[12, 19, 26, 33].map((y) => (
        <g key={y}>
          <ellipse cx={19} cy={y} rx={4} ry={6.5} transform={`rotate(-30 19 ${y})`} fill="#e3b85e" />
          <ellipse cx={29} cy={y} rx={4} ry={6.5} transform={`rotate(30 29 ${y})`} fill="#d9a948" />
        </g>
      ))}
      <ellipse cx={24} cy={7} rx={3.5} ry={5.5} fill="#e3b85e" />
    </>
  ),
  빵: (
    <>
      <path d="M8 22 C8 10 40 10 40 22 C40 25 38 26 37 26 L37 41 Q37 43 35 43 L13 43 Q11 43 11 41 L11 26 C10 26 8 25 8 22 Z" fill="#c98a4b" />
      <path d="M12 22 C12 15 36 15 36 22 C36 24 34 25 33 25 L33 39 L15 39 L15 25 C14 25 12 24 12 22 Z" fill="#f4dfb8" />
    </>
  ),
  파스타: (
    <>
      <path d="M6 14 L22 22 L6 32 C9 26 9 20 6 14 Z" fill="#f0c860" />
      <path d="M42 14 L26 22 L42 32 C39 26 39 20 42 14 Z" fill="#f0c860" />
      <path d="M8 17 L14 22 L8 28 M40 17 L34 22 L40 28" stroke="#d6a63a" strokeWidth={1} fill="none" />
      <rect x={20} y={18} width={8} height={9} rx={3} fill="#e2b445" />
    </>
  ),

  // 고기·콩·달걀
  소고기: (
    <>
      <path d="M7 24 C7 12 22 7 34 10 C44 13 44 26 38 34 C32 42 16 42 10 36 C8 33 7 29 7 24 Z" fill="#c4554f" />
      <path d="M10 25 C10 15 22 11 33 13 C41 16 41 26 36 32 C31 38 18 38 13 33 C11 31 10 28 10 25 Z" fill="#d86c63" />
      <path d="M15 22 C20 20 22 26 27 24 M19 30 C24 28 28 32 33 28 M26 17 C29 16 32 19 35 18" stroke="#f2c9c0" strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </>
  ),
  닭고기: (
    <>
      <path d="M30 30 L38 40" stroke="#f3ebe0" strokeWidth={5} strokeLinecap="round" />
      <circle cx={39} cy={42} r={3} fill="#f3ebe0" />
      <circle cx={42} cy={39} r={3} fill="#f3ebe0" />
      <path d="M8 18 C8 7 24 4 31 12 C37 19 35 30 28 33 C20 36 8 30 8 18 Z" fill="#e9b07a" />
      <path d="M13 17 C14 11 22 9 27 13" stroke="#f6d3ad" strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  ),
  대두: (
    <>
      {bean(16, 18, 7.5, 6.5, '#e8cf94', 10, '#c7a865')}
      {bean(31, 17, 7.5, 6.5, '#e2c684', -15, '#c7a865')}
      {bean(23, 31, 7.5, 6.5, '#ecd5a0', 5, '#c7a865')}
      {bean(36, 34, 6.5, 5.5, '#dfc07c', 30, '#c7a865')}
    </>
  ),
  돼지고기: (
    <>
      <path d="M5 30 L38 8 L44 17 L11 39 Z" fill="#f2c4b4" />
      <path d="M7 32 L39 11 L41 14 L9 35 Z" fill="#fbe8df" />
      <path d="M10 37 L42 16 L44 18 L12 40 Z" fill="#d98f80" />
      <path d="M5 30 L38 8 L39 10 L6 32 Z" fill="#d98f80" />
    </>
  ),
  오리고기: (
    <>
      <path d="M6 30 C10 16 30 12 42 20 C42 30 30 38 12 38 C9 37 6 34 6 30 Z" fill="#e8a99a" />
      <path d="M6 30 C10 16 30 12 42 20 C36 18 22 18 12 26 C9 28 7 30 6 30 Z" fill="#c9786a" />
      <path d="M14 32 L34 24" stroke="#f4cfc6" strokeWidth={1.5} strokeLinecap="round" />
    </>
  ),
  양고기: (
    <>
      <path d="M26 24 L40 8" stroke="#f3ebe0" strokeWidth={4} strokeLinecap="round" />
      <path d="M6 30 C6 18 18 14 28 20 C34 24 32 38 22 42 C12 45 6 38 6 30 Z" fill="#b8504a" />
      <path d="M10 30 C10 22 18 19 25 23 C29 26 28 35 21 38 C14 40 10 36 10 30 Z" fill="#cf6a60" />
      <path d="M14 28 C17 26 21 30 24 28" stroke="#f2ccc3" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </>
  ),
  두부: (
    <>
      <path d="M8 18 L22 11 L41 16 L27 23 Z" fill="#ffffff" />
      <path d="M8 18 L27 23 L27 40 L8 35 Z" fill="#f4efe4" />
      <path d="M27 23 L41 16 L41 33 L27 40 Z" fill="#e6dfd0" />
    </>
  ),
  강낭콩: (
    <>
      {[[16, 18, -25], [32, 20, 20], [22, 33, 10]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x - 9} ${y} C${x - 9} ${y - 8} ${x + 9} ${y - 8} ${x + 9} ${y} C${x + 9} ${y + 6} ${x + 3} ${y + 6} ${x} ${y + 3} C${x - 3} ${y + 6} ${x - 9} ${y + 6} ${x - 9} ${y} Z`} fill={i === 1 ? '#8e2f36' : '#a63a3f'} />
        </g>
      ))}
    </>
  ),
  완두콩: (
    <>
      <path d="M6 30 C10 16 34 10 42 16 C40 26 22 36 6 30 Z" fill="#8db86a" />
      {[[15, 27], [22, 23.5], [29, 20.5], [36, 18]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={4.2} fill="#b4d98a" />
      ))}
    </>
  ),
  달걀: (
    <>
      <path d="M24 6 C34 6 40 22 40 30 C40 39 33 44 24 44 C15 44 8 39 8 30 C8 22 14 6 24 6 Z" fill="#f2dfc3" />
      <ellipse cx={18} cy={20} rx={3} ry={5} fill="#fbf1e2" />
    </>
  ),
  메추리알: (
    <>
      <path d="M24 8 C32 8 37 21 37 28 C37 36 31 41 24 41 C17 41 11 36 11 28 C11 21 16 8 24 8 Z" fill="#efe1c8" />
      {[[19, 18, 2.5], [28, 15, 1.8], [30, 25, 3], [18, 30, 2.2], [26, 34, 2.6], [33, 33, 1.6], [22, 24, 1.4]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#6b5640" />
      ))}
    </>
  ),

  // 해산물
  흰살생선: fillet('#f6f1ea', '#cfd3d6', '#e3dbd0'),
  등푸른생선: fillet('#d9dde2', '#4f6f8f', '#3c5a78'),
  연어: fillet('#f29a6b', '#d77a4c', '#fbd2b8'),
  새우: (
    <>
      <path d="M30 8 C42 12 44 30 32 38 C26 42 16 40 14 34 C20 36 26 34 29 29 C33 22 30 14 24 12 Z" fill="#ef8a5c" />
      <path d="M33 13 C37 18 37 26 33 31 M28 11 C32 16 33 23 30 28" stroke="#fbc6a8" strokeWidth={1.4} fill="none" />
      <path d="M14 34 L6 30 L9 38 Z" fill="#e2734a" />
      <path d="M26 9 L14 4 M28 9 L20 2" stroke="#e2734a" strokeWidth={1.2} strokeLinecap="round" />
    </>
  ),
  게: (
    <>
      <path d="M10 22 L4 30 M10 26 L5 36 M38 22 L44 30 M38 26 L43 36" stroke="#d9503f" strokeWidth={2.2} strokeLinecap="round" />
      <ellipse cx={24} cy={27} rx={15} ry={10} fill="#e8604c" />
      <path d="M14 18 L9 9 M34 18 L39 9" stroke="#d9503f" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M5 9 C5 4 13 4 13 9 C11 8 9 9 9 11 Z M35 9 C35 4 43 4 43 9 C41 8 39 9 39 11 Z" fill="#e8604c" />
      <circle cx={20} cy={21} r={1.6} fill="#4a2a24" />
      <circle cx={28} cy={21} r={1.6} fill="#4a2a24" />
    </>
  ),
  잔멸치: (
    <>
      {[[8, 14, 8], [12, 26, -10], [16, 38, 4]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x + 14} ${y})`}>
          <path d={`M${x} ${y} C${x + 8} ${y - 4} ${x + 20} ${y - 3} ${x + 26} ${y} C${x + 20} ${y + 3} ${x + 8} ${y + 4} ${x} ${y} Z`} fill="#d7dade" />
          <path d={`M${x + 26} ${y} L${x + 31} ${y - 3} L${x + 31} ${y + 3} Z`} fill="#c0c5cb" />
          <circle cx={x + 4} cy={y - 0.5} r={1.1} fill="#4a4f55" />
        </g>
      ))}
    </>
  ),
  전복: (
    <>
      <ellipse cx={24} cy={26} rx={18} ry={14} fill="#8c8a7c" />
      <ellipse cx={25} cy={25} rx={13} ry={9.5} fill="#e9dccb" />
      <ellipse cx={25} cy={25} rx={8} ry={5.5} fill="#d8c3a8" />
      {[10, 14, 18, 22].map((x) => (
        <circle key={x} cx={x + 2} cy={14 + (x - 10) * 0.2} r={1.2} fill="#5f5c50" />
      ))}
    </>
  ),
  바지락: (
    <>
      <path d="M6 30 C6 14 42 14 42 30 C38 38 10 38 6 30 Z" fill="#b8a48c" />
      <path d="M10 22 C18 18 30 18 38 22 M8 27 C18 23 30 23 40 27 M9 32 C18 29 30 29 39 32" stroke="#8c7a64" strokeWidth={1.2} fill="none" />
      <path d="M18 18 L22 26 M26 17 L26 26 M33 19 L30 26" stroke="#d9cbb5" strokeWidth={1} />
    </>
  ),
  홍합: (
    <>
      <path d="M8 38 C4 30 14 8 30 6 C42 6 44 16 36 26 C30 34 18 44 8 38 Z" fill="#2f3a48" />
      <path d="M12 34 C10 28 18 14 29 11 C37 10 38 17 33 24 C28 30 20 37 12 34 Z" fill="#e89a6c" />
      <path d="M16 30 C20 24 26 18 32 15" stroke="#f6c3a1" strokeWidth={1.5} fill="none" />
    </>
  ),
  오징어: (
    <>
      <path d="M24 3 L33 12 L31 28 L17 28 L15 12 Z" fill="#e6c3d6" />
      <path d="M15 12 L9 18 L16 20 Z M33 12 L39 18 L32 20 Z" fill="#d7a8c2" />
      {[17, 21, 25, 29].map((x, i) => (
        <path key={x} d={`M${x + 1} 28 Q${x + (i % 2 ? 3 : -2)} 37 ${x + 1} 45`} stroke="#e0b7cd" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      ))}
      <circle cx={20} cy={24} r={1.5} fill="#5a3f4c" />
      <circle cx={28} cy={24} r={1.5} fill="#5a3f4c" />
    </>
  ),
  김: (
    <>
      <rect x={9} y={8} width={30} height={32} rx={2} transform="rotate(-6 24 24)" fill="#27352b" />
      <path d="M14 14 L33 12 M15 22 L35 20 M15 30 L34 28" stroke="#3c5243" strokeWidth={1} transform="rotate(-6 24 24)" />
    </>
  ),
  미역: (
    <>
      <path d="M14 44 C6 34 22 28 14 18 C8 10 16 6 18 4 C20 12 28 14 22 24 C16 32 26 38 20 44 Z" fill="#3f5a3a" />
      <path d="M30 44 C24 36 36 30 30 22 C26 16 32 10 34 8 C36 16 42 20 36 28 C32 34 38 40 34 44 Z" fill="#4e6c45" />
    </>
  ),

  // 견과
  땅콩: (
    <>
      <path d="M24 4 C32 4 33 12 30 17 C28 20 28 24 31 28 C35 34 31 44 24 44 C17 44 13 34 17 28 C20 24 20 20 18 17 C15 12 16 4 24 4 Z" fill="#d8b07a" transform="rotate(-25 24 24)" />
      <path d="M20 10 L28 12 M18 34 L28 36 M19 26 L27 27" stroke="#b88d55" strokeWidth={1} transform="rotate(-25 24 24)" />
    </>
  ),
  밤: (
    <>
      <path d="M24 6 C30 10 42 20 42 30 C42 38 34 42 24 42 C14 42 6 38 6 30 C6 20 18 10 24 6 Z" fill="#7a4a2e" />
      <path d="M8 32 C12 38 36 38 40 32 C40 39 34 42 24 42 C14 42 8 39 8 32 Z" fill="#d9c09a" />
      <path d="M16 18 C18 14 21 11 24 9" stroke="#a36e4c" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),
  호두: (
    <>
      <path d="M24 6 C36 6 42 16 40 28 C38 38 30 43 24 43 C18 43 10 38 8 28 C6 16 12 6 24 6 Z" fill="#c69a64" />
      <path d="M24 7 L24 42 M15 14 C19 18 17 22 13 24 C17 27 19 31 15 36 M33 14 C29 18 31 22 35 24 C31 27 29 31 33 36" stroke="#9c7244" strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </>
  ),
  잣: (
    <>
      {[[14, 18, -30], [28, 14, 15], [20, 32, 10], [34, 30, -25]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y - 8} C${x + 6} ${y - 4} ${x + 5} ${y + 6} ${x} ${y + 7} C${x - 5} ${y + 6} ${x - 6} ${y - 4} ${x} ${y - 8} Z`} transform={`rotate(${r} ${x} ${y})`} fill="#f5e7c4" stroke="#d9c08a" strokeWidth={0.8} />
      ))}
    </>
  ),
  아몬드: (
    <>
      <path d="M24 4 C34 12 38 26 34 36 C31 43 17 43 14 36 C10 26 14 12 24 4 Z" fill="#b57a4c" />
      <path d="M22 12 C20 20 20 30 22 38 M27 14 C28 22 28 30 26 37" stroke="#94603a" strokeWidth={1} fill="none" />
    </>
  ),

  // 채소
  가지: (
    <>
      <path d="M30 12 C40 18 40 30 32 38 C24 45 10 44 8 36 C6 28 16 26 22 20 C25 16 26 12 30 12 Z" fill="#5d3f7a" />
      <path d="M14 36 C16 32 22 30 26 26" stroke="#8a6aa8" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M26 14 C28 8 36 8 38 14 C34 12 30 13 26 14 Z" fill="#6f9a52" />
      <path d="M32 10 L35 4" stroke="#6f9a52" strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  감자: (
    <>
      <path d="M10 22 C10 10 30 6 38 14 C44 22 40 38 28 41 C16 44 10 34 10 22 Z" fill="#d4a86a" />
      {[[18, 18], [30, 15], [34, 28], [22, 32], [16, 26]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={1.3} fill="#a87d45" />
      ))}
    </>
  ),
  고구마: (
    <>
      <path d="M4 30 C8 18 26 10 38 14 C44 16 46 22 40 28 C32 36 16 40 8 36 Z" fill="#9c4a5a" />
      <path d="M38 14 C44 16 46 22 40 28 C42 22 41 17 38 14 Z" fill="#f2cf8a" />
      <path d="M12 30 C18 28 24 24 30 22" stroke="#c07383" strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </>
  ),
  고사리: (
    <>
      {[14, 24, 34].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 44 L${x} 16 C${x} 8 ${x + 8} 8 ${x + 7} 14 C${x + 6} 18 ${x + 2} 17 ${x + 3} 14`} stroke={i === 1 ? '#7a6a3a' : '#8c7c46'} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  근대: leaf('#5e8a4a', '#d8505a', '#d8505a', 'M24 40 C8 34 6 14 22 4 C40 12 40 32 24 40 Z'),
  느타리버섯: mushroom('#9a9187', '#efe8dc', 'M6 20 C10 8 34 6 42 16 C40 22 28 22 24 26 C18 22 8 24 6 20 Z', 'M20 22 L22 42 Q25 44 28 42 L28 22 Z', undefined),
  단호박: (
    <>
      <path d="M8 26 C8 14 18 10 24 12 C30 10 40 14 40 26 C40 38 30 42 24 40 C18 42 8 38 8 26 Z" fill="#3d6a42" />
      <path d="M24 12 C20 20 20 32 24 40 M16 13 C12 20 12 32 16 39 M32 13 C36 20 36 32 32 39" stroke="#5c8a5c" strokeWidth={1.4} fill="none" />
      <path d="M24 12 L25 5" stroke="#7a5a3c" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  당근: (
    <>
      <path d="M30 14 C36 16 36 22 32 26 L12 44 C10 45 9 44 10 42 L24 18 C26 14 28 13 30 14 Z" fill="#ec8a3c" />
      <path d="M20 26 L24 28 M16 33 L19 35 M24 21 L28 23" stroke="#c96a24" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M32 15 C34 6 38 4 40 4 C40 8 37 12 33 16 M33 16 C38 12 44 12 45 14 C42 17 38 18 34 18" fill="#76a352" />
    </>
  ),
  마늘: (
    <>
      <path d="M24 6 C26 12 40 18 40 30 C40 39 32 43 24 43 C16 43 8 39 8 30 C8 18 22 12 24 6 Z" fill="#f4eee4" />
      <path d="M24 8 C20 18 18 30 22 42 M24 8 C28 18 30 30 26 42 M16 18 C12 26 13 36 18 41 M32 18 C36 26 35 36 30 41" stroke="#ddd2c0" strokeWidth={1.2} fill="none" />
      <path d="M18 43 L30 43" stroke="#c9b9a0" strokeWidth={1.5} strokeLinecap="round" />
    </>
  ),
  무: (
    <>
      <path d="M14 18 C14 14 34 14 34 18 L32 34 C30 42 26 46 24 46 C22 46 18 42 16 34 Z" fill="#f6f3ec" />
      <path d="M14 18 C14 14 34 14 34 18 L33 24 C28 22 20 22 15 24 Z" fill="#c8de9a" />
      <path d="M20 16 C16 8 18 3 22 2 C24 6 24 10 23 15 M26 15 C26 8 30 3 34 4 C34 9 31 13 28 16" fill="#6f9a52" />
    </>
  ),
  배추: (
    <>
      <path d="M14 44 C8 34 8 14 20 6 C28 4 38 12 38 26 C38 36 34 44 30 44 Z" fill="#c9e09a" />
      <path d="M14 44 C10 34 12 20 18 12 C14 24 16 36 20 44 Z" fill="#f4f6e6" />
      <path d="M22 44 C20 32 22 18 28 10 C30 22 28 36 26 44 Z" fill="#f7f7ea" />
      <path d="M18 6 C26 2 38 8 38 20 C34 14 26 10 18 12 Z" fill="#9fc46a" />
    </>
  ),
  부추: strands('#4f8a3e', undefined, 0, 6),
  브로콜리: (
    <>
      <path d="M20 28 L18 44 L30 44 L28 28 Z" fill="#a9c97c" />
      <circle cx={14} cy={22} r={8} fill="#4e8a46" />
      <circle cx={34} cy={22} r={8} fill="#4e8a46" />
      <circle cx={24} cy={15} r={10} fill="#5a9a50" />
      <circle cx={24} cy={26} r={7} fill="#4e8a46" />
      {[[20, 12], [28, 13], [14, 21], [34, 20], [24, 20]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={1.6} fill="#77b06a" />
      ))}
    </>
  ),
  비타민: (
    <>
      {[[16, -18], [32, 18], [24, 0]].map(([x, r]) => (
        <g key={x} transform={`rotate(${r} 24 44)`}>
          <path d="M24 44 L24 30" stroke="#b6cf8f" strokeWidth={2.4} strokeLinecap="round" />
          <ellipse cx={24} cy={20} rx={9} ry={12} fill="#3f7a3a" />
          <path d="M24 31 L24 11" stroke="#6ea65e" strokeWidth={1} />
        </g>
      ))}
    </>
  ),
  비트: (
    <>
      <path d="M24 18 C34 18 40 24 38 32 C36 40 28 44 24 44 C20 44 12 40 10 32 C8 24 14 18 24 18 Z" fill="#8c2347" />
      <path d="M16 30 C18 26 22 24 26 24" stroke="#b44a6c" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <path d="M22 18 C18 10 14 6 12 4 C18 4 22 10 24 18 M26 18 C28 10 32 4 38 4 C36 8 30 12 26 18" fill="#5e8a4a" stroke="#a83a5e" strokeWidth={1} />
    </>
  ),
  새송이버섯: mushroom('#b59a7c', '#f3ecdf', 'M12 16 C12 6 36 6 36 16 C36 19 12 19 12 16 Z', 'M17 17 C16 28 16 38 18 44 L30 44 C32 38 32 28 31 17 Z'),
  새싹채소: (
    <>
      {[12, 20, 28, 36].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 44 Q${x + (i % 2 ? 2 : -2)} 30 ${x} 20`} stroke="#e5ecd2" strokeWidth={2} fill="none" />
          <ellipse cx={x - 3.5} cy={18 - (i % 2) * 3} rx={4} ry={2.6} transform={`rotate(-25 ${x - 3.5} ${18 - (i % 2) * 3})`} fill="#7cb55a" />
          <ellipse cx={x + 3.5} cy={18 - (i % 2) * 3} rx={4} ry={2.6} transform={`rotate(25 ${x + 3.5} ${18 - (i % 2) * 3})`} fill="#8cc466" />
        </g>
      ))}
    </>
  ),
  숙주: strands('#f1eedf', '#d8d39a', 2, 5),
  시금치: (
    <>
      <path d="M24 46 L24 30" stroke="#d4646e" strokeWidth={3} strokeLinecap="round" />
      <path d="M24 32 C10 30 4 16 12 8 C20 10 26 20 24 32 Z" fill="#2f6a34" />
      <path d="M24 32 C38 30 44 16 36 8 C28 10 22 20 24 32 Z" fill="#3a7a3c" />
      <path d="M24 30 C22 18 26 8 24 4 C30 10 30 22 24 30 Z" fill="#45884a" />
    </>
  ),
  아스파라거스: (
    <>
      {[16, 24, 32].map((x, i) => (
        <g key={x} transform={`rotate(${(i - 1) * 8} ${x} 44)`}>
          <path d={`M${x} 44 L${x} 12`} stroke="#7caa52" strokeWidth={5} strokeLinecap="round" />
          <path d={`M${x - 3} 12 C${x - 3} 6 ${x + 3} 6 ${x + 3} 12 Z`} fill="#5f8c3e" />
          <path d={`M${x - 2.5} 22 L${x} 20 L${x + 2.5} 22 M${x - 2.5} 32 L${x} 30 L${x + 2.5} 32`} stroke="#5f8c3e" strokeWidth={1.2} fill="none" />
        </g>
      ))}
    </>
  ),
  아욱: leaf('#5b8f4a', '#8dbb72', '#7aa85e', 'M24 40 C14 40 4 30 8 18 C12 20 12 12 18 10 C20 12 22 6 24 6 C26 6 28 12 30 10 C36 12 36 20 40 18 C44 30 34 40 24 40 Z'),
  애호박: (
    <>
      <path d="M10 40 C6 36 8 30 14 26 L32 10 C36 7 40 8 41 12 C42 16 40 19 36 22 L18 38 C14 42 12 42 10 40 Z" fill="#9cc26a" />
      <path d="M14 34 L34 15 M18 37 L37 19" stroke="#c7df9a" strokeWidth={1.4} />
      <path d="M38 10 L43 5" stroke="#7a8a4a" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  양배추: head('#a9cf7a', '#e6f2cc', '#f4f8e4'),
  양상추: head('#d4e8a6', '#f6fae6', '#ffffff'),
  양송이버섯: mushroom('#efe7da', '#f8f3ea', 'M7 26 C7 10 41 10 41 26 C41 28 7 28 7 26 Z', 'M18 27 L18 40 Q24 43 30 40 L30 27 Z', '#d9cbb6'),
  양파: (
    <>
      <path d="M24 6 C26 12 40 18 40 30 C40 39 32 43 24 43 C16 43 8 39 8 30 C8 18 22 12 24 6 Z" fill="#e2b06c" />
      <path d="M24 8 C18 18 16 30 22 42 M24 8 C30 18 32 30 26 42" stroke="#c48c48" strokeWidth={1.2} fill="none" />
      <path d="M24 6 L22 2 M24 6 L27 2" stroke="#b07a3a" strokeWidth={1.4} strokeLinecap="round" />
    </>
  ),
  연근: (
    <>
      <circle cx={24} cy={24} r={18} fill="#efe2cc" />
      <circle cx={24} cy={24} r={18} fill="none" stroke="#d6c2a0" strokeWidth={1.5} />
      <circle cx={24} cy={24} r={4} fill="#c8b08a" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={24 + 10 * Math.cos((a * Math.PI) / 180)} cy={24 + 10 * Math.sin((a * Math.PI) / 180)} r={3.6} fill="#c8b08a" />
      ))}
    </>
  ),
  오이: (
    <>
      <path d="M8 38 C4 34 6 28 12 24 L32 10 C37 6 42 8 42 13 C42 17 40 19 36 22 L16 38 C13 40 10 40 8 38 Z" fill="#4f8a44" />
      {[[16, 30], [24, 24], [32, 18], [20, 34], [29, 26], [36, 14]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={1.1} fill="#a6d08a" />
      ))}
      <path d="M40 10 L44 6" stroke="#b8c86a" strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  옥수수: (
    <>
      <path d="M24 4 C32 4 34 14 34 24 C34 34 30 42 24 42 C18 42 14 34 14 24 C14 14 16 4 24 4 Z" fill="#f4c94c" />
      {[10, 16, 22, 28, 34].map((y) => (
        <path key={y} d={`M16 ${y} L32 ${y}`} stroke="#e0ad2c" strokeWidth={1} />
      ))}
      <path d="M20 6 L20 40 M24 4 L24 42 M28 6 L28 40" stroke="#e0ad2c" strokeWidth={1} />
      <path d="M14 22 C8 30 10 40 22 46 C18 38 16 30 18 24 Z" fill="#8cb25a" />
      <path d="M34 22 C40 30 38 40 26 46 C30 38 32 30 30 24 Z" fill="#7aa24a" />
    </>
  ),
  적채: head('#7a4a8c', '#c9a8d6', '#e6d4ee'),
  청경채: (
    <>
      <path d="M18 44 C14 36 14 28 18 22 L30 22 C34 28 34 36 30 44 Z" fill="#e4efd2" />
      <path d="M24 44 C22 36 22 28 24 22" stroke="#cbdcb0" strokeWidth={1.4} />
      <ellipse cx={16} cy={14} rx={8} ry={11} transform="rotate(-20 16 14)" fill="#4e8a46" />
      <ellipse cx={32} cy={14} rx={8} ry={11} transform="rotate(20 32 14)" fill="#4e8a46" />
      <ellipse cx={24} cy={12} rx={7} ry={10} fill="#5f9a54" />
    </>
  ),
  케일: (
    <>
      <path d="M24 46 L24 30" stroke="#5a7a4a" strokeWidth={3} strokeLinecap="round" />
      <path d="M24 34 C18 34 10 30 10 24 C6 22 8 18 10 16 C6 12 10 8 14 9 C14 4 20 4 22 6 C24 2 28 4 28 7 C32 4 38 8 36 12 C40 14 40 20 36 22 C40 26 34 32 24 34 Z" fill="#2f5a3a" />
      <path d="M24 32 L24 10 M24 24 L16 18 M24 24 L32 18 M24 16 L19 12 M24 16 L29 12" stroke="#6a9a6a" strokeWidth={1.1} fill="none" />
    </>
  ),
  콜라비: (
    <>
      <circle cx={24} cy={30} r={13} fill="#7d4a96" />
      <path d="M16 26 C16 20 22 18 26 19" stroke="#b07fc6" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M20 18 L14 6 M24 17 L24 4 M28 18 L34 6" stroke="#8a6aa0" strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={13} cy={6} rx={4} ry={2.5} fill="#6f9a52" />
      <ellipse cx={24} cy={4} rx={3} ry={2.5} fill="#6f9a52" />
      <ellipse cx={35} cy={6} rx={4} ry={2.5} fill="#6f9a52" />
    </>
  ),
  콜리플라워: (
    <>
      <path d="M6 30 C10 40 38 40 42 30 C40 36 36 40 24 42 C12 40 8 36 6 30 Z" fill="#7aa85e" />
      {[[14, 24, 7], [24, 18, 8], [34, 24, 7], [19, 30, 6], [29, 30, 6]].map(([x, y, r]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#f6f1e4" />
      ))}
      {[[14, 22], [24, 16], [33, 22], [22, 26]].map(([x, y]) => (
        <circle key={`d${x}${y}`} cx={x} cy={y} r={1.6} fill="#e8dfc8" />
      ))}
    </>
  ),
  콩나물: strands('#f3efdc', '#efcf52', 3, 5),
  토마토: fruit('#e2483c', '#a8261e', '#5e8a3e', 16, 28),
  파: (
    <>
      <path d="M20 44 L20 26 M28 44 L28 26" stroke="#f3f1e6" strokeWidth={5} strokeLinecap="round" />
      <path d="M20 28 C18 18 14 10 10 4 M24 28 C24 16 24 10 24 3 M28 28 C30 18 34 10 38 4" stroke="#6faa52" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <path d="M17 44 L31 44" stroke="#e2dccb" strokeWidth={1.5} strokeLinecap="round" />
    </>
  ),
  파프리카: (
    <>
      <path d="M24 12 C30 8 40 12 40 22 C40 34 34 42 28 42 C26 42 25 40 24 40 C23 40 22 42 20 42 C14 42 8 34 8 22 C8 12 18 8 24 12 Z" fill="#e5492f" />
      <path d="M24 13 C22 22 22 32 24 40" stroke="#b53220" strokeWidth={1.4} fill="none" />
      <path d="M24 12 C24 8 26 5 30 4" stroke="#5e8a3e" strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  ),
  팽이버섯: strands('#f6f2e6', '#ece2c4', 3, 6),
  표고버섯: mushroom('#6e4a32', '#efe5d4', 'M6 24 C6 8 42 8 42 24 C42 26 6 26 6 24 Z', 'M20 25 L20 42 Q24 44 28 42 L28 25 Z'),

  // 과일
  감: (
    <>
      <path d="M8 26 C8 14 18 10 24 10 C30 10 40 14 40 26 C40 38 32 42 24 42 C16 42 8 38 8 26 Z" fill="#ec7a2e" />
      <path d="M14 14 L24 10 L34 14 L28 16 L24 13 L20 16 Z" fill="#5e7a3a" />
      <path d="M24 10 L24 5" stroke="#5e4a2e" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={17} cy={22} rx={3} ry={4} fill="#f6a970" opacity={0.7} />
    </>
  ),
  귤: (
    <>
      <circle cx={24} cy={27} r={16} fill="#f59a2a" />
      {[[16, 22], [28, 18], [32, 30], [20, 34], [24, 26]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={0.9} fill="#d77d14" />
      ))}
      <circle cx={24} cy={11.5} r={2} fill="#6f8a3a" />
      <path d="M25 11 C30 6 36 8 36 10 C32 13 28 12 25 11 Z" fill="#6f9a52" />
    </>
  ),
  대추: (
    <>
      {[[16, 26, -20], [30, 22, 15], [26, 36, 5]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx={7} ry={9} fill={i === 1 ? '#a3302c' : '#b53a33'} />
          <ellipse cx={x - 2} cy={y - 3} rx={1.6} ry={3} fill="#d7685e" />
        </g>
      ))}
    </>
  ),
  딸기: (
    <>
      <path d="M24 44 C14 38 8 26 10 18 C12 12 20 12 24 14 C28 12 36 12 38 18 C40 26 34 38 24 44 Z" fill="#e23c48" />
      {[[18, 22], [24, 20], [30, 22], [21, 29], [27, 29], [24, 36], [16, 28], [32, 28]].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx={0.9} ry={1.4} fill="#f6d36a" />
      ))}
      <path d="M12 15 L18 10 L20 14 L24 8 L28 14 L30 10 L36 15 C30 17 18 17 12 15 Z" fill="#5e9a46" />
    </>
  ),
  레몬: (
    <>
      <path d="M6 24 C6 22 8 20 9 20 C12 12 20 9 26 9 C34 9 40 14 41 20 C42 20 43 22 43 24 C43 26 42 28 41 28 C40 34 34 39 26 39 C18 39 12 36 9 28 C8 28 6 26 6 24 Z" fill="#f6dc4c" />
      <ellipse cx={20} cy={18} rx={5} ry={2.5} transform="rotate(-15 20 18)" fill="#fbec98" />
    </>
  ),
  망고: (
    <>
      <path d="M14 10 C26 4 42 14 40 30 C38 42 24 46 14 40 C6 34 4 16 14 10 Z" fill="#f2b33c" />
      <path d="M14 10 C26 4 42 14 40 30 C36 18 24 12 14 10 Z" fill="#e6862e" opacity={0.6} />
      <path d="M16 9 C14 5 16 3 18 2" stroke="#6b4f35" strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  ),
  멜론: (
    <>
      <circle cx={24} cy={26} r={17} fill="#c2d58c" />
      <path d="M12 16 L36 38 M8 26 L28 44 M18 10 L40 30 M36 14 L14 38 M40 24 L22 42 M30 10 L8 32" stroke="#eef3d4" strokeWidth={1.2} />
      <path d="M24 9 L24 4" stroke="#7a8a4a" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  무화과: (
    <>
      <path d="M24 6 C28 10 30 14 34 18 C40 24 40 36 32 41 C26 44 22 44 16 41 C8 36 8 24 14 18 C18 14 20 10 24 6 Z" fill="#7a3a5c" />
      <path d="M24 6 L24 2" stroke="#5e7a3a" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M18 24 C20 22 22 23 22 26" stroke="#a65a82" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </>
  ),
  바나나: (
    <>
      <path d="M8 14 C10 30 22 40 40 36 C42 35 42 33 40 33 C26 34 16 26 13 13 C12 10 8 10 8 14 Z" fill="#f6d34c" />
      <path d="M12 18 C16 28 24 33 36 34" stroke="#e2b42c" strokeWidth={1.4} fill="none" />
      <path d="M8 14 L9 9" stroke="#6b5a35" strokeWidth={3} strokeLinecap="round" />
      <path d="M40 33 L44 34" stroke="#6b5a35" strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  배: (
    <>
      <circle cx={24} cy={27} r={16} fill="#e6c27a" />
      {[[16, 22], [28, 18], [32, 30], [20, 34], [26, 26], [14, 30], [34, 22]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={0.9} fill="#bf9a4c" />
      ))}
      <path d="M24 12 L25 5" stroke="#6b4f35" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M25 8 C30 3 36 5 36 7 C32 10 28 9 25 8 Z" fill="#6f9a52" />
    </>
  ),
  복숭아: (
    <>
      <path d="M24 12 C34 8 42 16 42 26 C42 36 34 42 24 42 C14 42 6 36 6 26 C6 16 14 8 24 12 Z" fill="#f7b5a0" />
      <path d="M24 12 C20 20 20 32 24 42" stroke="#e8907a" strokeWidth={1.6} fill="none" />
      <path d="M30 18 C36 20 38 28 34 34" stroke="#f9cfc0" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M24 12 C26 6 32 4 36 6 C34 10 28 12 24 12 Z" fill="#6f9a52" />
    </>
  ),
  블루베리: (
    <>
      {[[16, 20, 9], [32, 22, 8], [24, 34, 9]].map(([x, y, r]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r={r} fill="#3e4f8c" />
          <path d={`M${x - 2.5} ${y - r + 3} L${x} ${y - r + 1.5} L${x + 2.5} ${y - r + 3}`} stroke="#25305c" strokeWidth={1.4} fill="none" />
          <circle cx={x - r * 0.4} cy={y} r={1.6} fill="#7487c2" opacity={0.6} />
        </g>
      ))}
    </>
  ),
  사과: (
    <>
      <path d="M24 13 C30 8 42 10 42 24 C42 36 34 44 28 42 C26 41 22 41 20 42 C14 44 6 36 6 24 C6 10 18 8 24 13 Z" fill="#d9363c" />
      <path d="M24 13 L26 5" stroke="#6b4f35" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M26 9 C30 3 37 4 38 7 C34 11 29 11 26 9 Z" fill="#6f9a52" />
      <ellipse cx={15} cy={22} rx={2.5} ry={4.5} fill="#ec7a7a" opacity={0.7} />
    </>
  ),
  살구: fruit('#f4a54a', '#d97a24', '#7d9a5c', 15, 27),
  수박: (
    <>
      <ellipse cx={24} cy={26} rx={18} ry={16} fill="#3e7a3a" />
      <path d="M12 14 C14 22 14 30 12 38 M20 10 C22 20 22 32 20 42 M28 10 C26 20 26 32 28 42 M36 14 C34 22 34 30 36 38" stroke="#20481f" strokeWidth={2.2} fill="none" />
      <path d="M24 10 L24 5" stroke="#6b5a35" strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  아보카도: (
    <>
      <path d="M24 4 C32 4 34 14 38 24 C42 34 36 44 24 44 C12 44 6 34 10 24 C14 14 16 4 24 4 Z" fill="#3e5a2e" />
      <path d="M24 8 C30 8 31 16 34 25 C37 33 32 40 24 40 C16 40 11 33 14 25 C17 16 18 8 24 8 Z" fill="#cfe08a" />
      <circle cx={24} cy={29} r={7} fill="#8a5a34" />
      <circle cx={22} cy={27} r={2} fill="#a8774c" />
    </>
  ),
  오렌지: (
    <>
      <circle cx={24} cy={26} r={17} fill="#f38a1e" />
      {[[16, 20], [28, 16], [32, 30], [20, 34], [24, 25], [12, 28], [36, 22]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={0.9} fill="#d06c0c" />
      ))}
      <circle cx={24} cy={10} r={2} fill="#6f8a3a" />
    </>
  ),
  자두: (
    <>
      <path d="M24 12 C34 10 42 18 41 28 C40 38 32 42 24 42 C16 42 8 38 7 28 C6 18 14 10 24 12 Z" fill="#9a2a4c" />
      <path d="M24 13 C21 22 21 32 24 41" stroke="#741c38" strokeWidth={1.4} fill="none" />
      <ellipse cx={15} cy={24} rx={2.5} ry={4.5} fill="#c45a7a" opacity={0.7} />
      <path d="M24 12 L25 6" stroke="#6b4f35" strokeWidth={2.2} strokeLinecap="round" />
    </>
  ),
  참외: (
    <>
      <ellipse cx={24} cy={25} rx={14} ry={18} fill="#f4c62c" />
      {[14, 20, 28, 34].map((x) => (
        <path key={x} d={`M${x} ${x < 24 ? 12 : 12} Q${x + (x < 24 ? -3 : 3)} 25 ${x} 38`} stroke="#fbf0c8" strokeWidth={2.2} fill="none" />
      ))}
      <path d="M24 7 L24 3" stroke="#7a6a3a" strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  키위: (
    <>
      <ellipse cx={18} cy={24} rx={13} ry={15} fill="#8a6a3e" />
      <circle cx={30} cy={28} r={13} fill="#7a5a32" />
      <circle cx={30} cy={28} r={11} fill="#8cbf4a" />
      <circle cx={30} cy={28} r={4} fill="#eaf2c6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <circle key={a} cx={30 + 6.2 * Math.cos((a * Math.PI) / 180)} cy={28 + 6.2 * Math.sin((a * Math.PI) / 180)} r={0.9} fill="#2a2a1e" />
      ))}
    </>
  ),
  파인애플: (
    <>
      <ellipse cx={24} cy={32} rx={12} ry={13} fill="#e8b23a" />
      <path d="M14 24 L34 40 M12 32 L26 44 M18 20 L36 34 M34 24 L14 40 M36 32 L22 44 M30 20 L12 34" stroke="#c68a1e" strokeWidth={1.1} />
      <path d="M24 19 L18 4 L24 12 L26 2 L28 12 L34 5 L28 19 Z" fill="#5e9a46" />
    </>
  ),
  포도: (
    <>
      <path d="M24 8 L24 3 M24 6 C28 2 34 3 35 6" stroke="#6b5a35" strokeWidth={2} fill="none" strokeLinecap="round" />
      {[[16, 14], [24, 13], [32, 14], [20, 21], [28, 21], [12, 21], [36, 21], [16, 28], [24, 28], [32, 28], [20, 35], [28, 35], [24, 42]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={4.6} fill="#6a3a7a" stroke="#4e2a5c" strokeWidth={0.6} />
      ))}
    </>
  ),

  // 유제품·기름
  요거트: (
    <>
      <path d="M8 18 L40 18 L36 42 Q35 44 33 44 L15 44 Q13 44 12 42 Z" fill="#f2ede4" />
      <ellipse cx={24} cy={18} rx={16} ry={4} fill="#ffffff" />
      <path d="M14 18 C16 10 22 14 24 10 C26 14 32 10 34 18 Z" fill="#ffffff" />
      <path d="M14 28 L34 28" stroke="#e0d6c6" strokeWidth={1.2} />
    </>
  ),
  우유: (
    <>
      <path d="M14 14 L24 6 L34 14 Z" fill="#e6ece6" />
      <path d="M14 14 L34 14 L34 44 L14 44 Z" fill="#ffffff" stroke="#d8ddd6" strokeWidth={1} />
      <path d="M14 26 L34 26 L34 36 L14 36 Z" fill="#8cb5d8" />
      <path d="M20 31 C22 28 26 34 28 31" stroke="#ffffff" strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </>
  ),
  치즈: (
    <>
      <path d="M6 30 L38 14 L42 22 L42 38 L6 38 Z" fill="#f6cf5a" />
      <path d="M6 30 L38 14 L42 22 L10 34 Z" fill="#fbe08a" />
      <circle cx={16} cy={36} r={2.4} fill="#e2b03a" />
      <circle cx={30} cy={33} r={3} fill="#e2b03a" />
      <circle cx={38} cy={28} r={1.8} fill="#e2b03a" />
    </>
  ),
  버터: (
    <>
      <path d="M6 30 L30 30 L38 22 L14 22 Z" fill="#fbe7a0" />
      <path d="M6 30 L30 30 L30 40 L6 40 Z" fill="#f6d872" />
      <path d="M30 30 L38 22 L38 32 L30 40 Z" fill="#e8c452" />
      <path d="M26 20 L42 6" stroke="#c9c2b4" strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  올리브유: bottle('#c9c84a'),
  현미유: bottle('#f0dc8c'),
  참기름: bottle('#b8702e', '#efe6d8', '#6b4a2e'),
  들기름: bottle('#8a6a2e', '#ece6d8', '#4f3a22'),
}

export default function FoodIcon({ id, size = 48, className }: { id: string; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      {ICONS[id] ?? <circle cx={24} cy={24} r={14} fill="#d8c8b8" />}
    </svg>
  )
}
