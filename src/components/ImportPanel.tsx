import { useState } from 'react'
import { decodeText, hasHangul, parseSubtitles, type Cue } from '../lib/subtitles.ts'

export interface SubtitleImport {
  title: string
  cues: Cue[]
  translations: Cue[]
}

interface Props {
  ready: boolean
  onImport: (data: SubtitleImport) => Promise<void>
  onClose: () => void
}

async function readCues(file: File): Promise<Cue[]> {
  return parseSubtitles(decodeText(await file.arrayBuffer()))
}

const fileClass =
  'block w-full text-sm text-body file:mr-3 file:h-10 file:cursor-pointer file:rounded-lg file:border-0 file:bg-chip file:px-3 file:font-medium file:text-chip-text'

export default function ImportPanel({ ready, onImport, onClose }: Props) {
  const [korean, setKorean] = useState<File | null>(null)
  const [translation, setTranslation] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!korean) return
    setBusy(true)
    setStatus(null)
    try {
      const cues = (await readCues(korean)).filter((c) => hasHangul(c.text))
      if (!cues.length) {
        setStatus('No Korean lines found in that file. Is it an .srt or .vtt?')
        return
      }
      const translations = translation ? await readCues(translation) : []
      await onImport({ title: title.trim() || korean.name.replace(/\.(srt|vtt)$/i, ''), cues, translations })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-panel border border-divider bg-panel p-4 shadow-panel sm:p-5" aria-label="Import subtitles">
      <div className="mb-3 flex items-center">
        <h2 className="text-base font-bold">Import subtitles</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto flex size-9 cursor-pointer items-center justify-center rounded-md text-xl text-muted hover:bg-row"
        >
          ×
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Korean subtitles (.srt, .vtt)</span>
          <input type="file" accept=".srt,.vtt" className={fileClass} onChange={(e) => setKorean(e.target.files?.[0] ?? null)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Translation (optional)
            <span className="ml-1 font-normal text-muted">same video, other language</span>
          </span>
          <input type="file" accept=".srt,.vtt" className={fileClass} onChange={(e) => setTranslation(e.target.files?.[0] ?? null)} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Name</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={korean?.name.replace(/\.(srt|vtt)$/i, '') ?? ('e.g. Episode 1')}
            className="h-11 rounded-lg border border-divider bg-panel px-3 placeholder:text-muted"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <p className="text-xs text-muted">
          Every line is analysed and saved in this browser. Lines with no Korean (♪, sound effects) are skipped.
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={!korean || !ready || busy}
          className="ml-auto h-10 shrink-0 cursor-pointer rounded-lg bg-navy px-4 text-sm font-bold text-on-navy disabled:cursor-default disabled:opacity-40"
        >
          {busy ? ('Analysing…') : 'Import'}
        </button>
      </div>
      {status && <p className="mt-2 text-sm text-danger">{status}</p>}
    </section>
  )
}
