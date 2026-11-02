import { useState } from 'react'
import type { KiwiState } from '../lib/kiwi.ts'

interface Props {
  kiwi: KiwiState
  onAnalyze: (text: string) => Promise<void>
  onImport: () => void
}

/** The text box at the top: type or paste Korean, one sentence or many. */
export default function Composer({ kiwi, onAnalyze, onImport }: Props) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = kiwi.status === 'ready'
  const hasKorean = /[가-힣]/.test(text)

  const submit = async () => {
    if (!ready || !hasKorean || busy) return
    setBusy(true)
    try {
      await onAnalyze(text)
      setText('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-panel border border-divider bg-panel p-2 shadow-panel">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
        rows={text.includes('\n') || text.length > 60 ? 4 : 1}
        placeholder="Type or paste Korean… (오늘 날씨가 정말 좋네요)"
        aria-label="Korean text"
        className="block w-full resize-none rounded-lg bg-transparent px-3 py-2.5 text-lg leading-snug placeholder:text-base placeholder:text-muted focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2 border-t border-divider px-1 pt-2">
        <button
          type="button"
          onClick={onImport}
          className="h-10 cursor-pointer rounded-lg px-3 text-sm font-medium text-body hover:bg-row"
        >
          Import subtitles
        </button>
        <span className="hidden text-xs text-muted sm:inline">
          Enter to analyze · Shift+Enter for a new line
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!ready || !hasKorean || busy}
          className="ml-auto h-10 cursor-pointer rounded-lg bg-navy px-4 text-sm font-bold text-on-navy disabled:cursor-default disabled:opacity-40"
        >
          {busy ? '…' : 'Analyze'}
        </button>
      </div>
    </div>
  )
}
