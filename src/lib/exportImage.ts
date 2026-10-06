import { toCanvas } from 'html-to-image'

/** unicode-range 문자열("U+AC00-D7A3, U+0041")이 text 안의 글자를 하나라도 포함하는지 */
function rangeHits(unicodeRange: string, codepoints: Set<number>): boolean {
  if (!unicodeRange) return true
  for (const part of unicodeRange.split(',')) {
    const m = part.trim().replace(/^U\+/i, '')
    let lo: number
    let hi: number
    if (m.includes('-')) {
      const [a, b] = m.split('-')
      lo = parseInt(a, 16)
      hi = parseInt(b, 16)
    } else if (m.includes('?')) {
      lo = parseInt(m.replace(/\?/g, '0'), 16)
      hi = parseInt(m.replace(/\?/g, 'F'), 16)
    } else {
      lo = hi = parseInt(m, 16)
    }
    for (const cp of codepoints) if (cp >= lo && cp <= hi) return true
  }
  return false
}

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/**
 * 한글 웹폰트는 수십~수백 개의 unicode-range 조각으로 나뉘어 있어서
 * 기본 html-to-image처럼 전부 내장하면 느리다. 실제로 쓰인 글자가 들어 있는 조각만 내장한다.
 */
async function buildFontCss(node: HTMLElement): Promise<string> {
  const codepoints = new Set<number>()
  for (const ch of node.innerText + ' 0123456789/+-·①②③④⑤gD') codepoints.add(ch.codePointAt(0)!)

  const jobs: Promise<string>[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue // 다른 출처 스타일시트
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const range = rule.style.getPropertyValue('unicode-range')
      if (!rangeHits(range, codepoints)) continue
      const src = rule.style.getPropertyValue('src')
      const m = src.match(/url\(["']?([^"')]+\.woff2)["']?\)/)
      if (!m) continue
      const url = new URL(m[1], sheet.href ?? location.href).href
      jobs.push(
        toDataUrl(url).then(
          (data) =>
            `@font-face{font-family:${rule.style.getPropertyValue('font-family')};font-style:${
              rule.style.getPropertyValue('font-style') || 'normal'
            };font-weight:${rule.style.getPropertyValue('font-weight') || '400'};src:url(${data}) format('woff2');${
              range ? `unicode-range:${range};` : ''
            }}`,
        ),
      )
    }
  }
  return (await Promise.all(jobs)).join('\n')
}

/** 노드를 JPEG로 그린다. 카톡 공유를 생각해서 PNG(수 MB) 대신 JPEG(약 1MB)로 */
export async function renderNodeToImage(node: HTMLElement, pixelRatio = 2): Promise<Blob> {
  await document.fonts.ready
  const fontEmbedCSS = await buildFontCss(node)
  const opts = {
    pixelRatio,
    fontEmbedCSS,
    cacheBust: false,
    width: node.offsetWidth,
    height: node.offsetHeight,
  }
  // iOS Safari는 첫 렌더에서 이미지·폰트가 빠지는 경우가 있어 한 번 미리 그려둔다
  await toCanvas(node, opts)
  const canvas = await toCanvas(node, opts)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  if (!blob) throw new Error('이미지를 만들지 못했어요')
  return blob
}
