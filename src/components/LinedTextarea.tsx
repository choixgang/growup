import { useLayoutEffect, useRef } from 'react'

interface Props extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style' | 'rows'> {
  value: string
  /** 줄 간격(px). 글자 줄과 밑줄이 이 간격으로 맞춰진다 */
  lineHeight: number
  /** 비어 있어도 보이는 최소 줄 수 */
  minLines: number
  lineColor?: string
}

/**
 * 줄 노트 같은 메모 칸. 내용이 늘면 칸이 줄 단위로 같이 늘어나서 스크롤이 생기지 않는다
 * (스크롤이 생기면 글자와 밑줄이 어긋나 보인다).
 */
export default function LinedTextarea({ value, lineHeight, minLines, lineColor = 'var(--color-line-strong)', className = '', ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    const lines = Math.max(minLines, Math.ceil(el.scrollHeight / lineHeight))
    el.style.height = `${lines * lineHeight}px`
  }, [value, lineHeight, minLines])

  return (
    <textarea
      ref={ref}
      rows={minLines}
      value={value}
      className={`block w-full resize-none overflow-hidden bg-transparent p-0 outline-none ${className}`}
      style={{
        lineHeight: `${lineHeight}px`,
        minHeight: minLines * lineHeight,
        backgroundImage: `linear-gradient(transparent calc(100% - 1px), ${lineColor} 1px)`,
        backgroundSize: `100% ${lineHeight}px`,
      }}
      {...rest}
    />
  )
}
