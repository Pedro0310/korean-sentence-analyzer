import { useEffect, useState } from 'react'
import Analysis, { phraseColor } from './components/Analysis.tsx'
import CollectionBar from './components/CollectionBar.tsx'
import Composer from './components/Composer.tsx'
import DetailPanel from './components/DetailPanel.tsx'
import ImportPanel, { type SubtitleImport } from './components/ImportPanel.tsx'
import { analyzeLines, analyzeText, useKiwi, type KiwiState } from './lib/kiwi.ts'
import { analysisOf, useDictionary } from './lib/library.ts'
import { newId, useLibrary } from './lib/store.ts'
import { formatTime, pairTranslations } from './lib/subtitles.ts'
import type { Analysis as AnalysisData, Collection, Item, PhraseKind } from './lib/types.ts'
import { useTheme } from './theme.ts'

/** Where you are: #collectionId/itemId */
function useLocation(): [{ collection?: string; item?: string }, (collection: string, item: string) => void] {
  const read = () => {
    const [collection, item] = decodeURIComponent(location.hash.slice(1)).split('/')
    return { collection, item }
  }
  const [where, setWhere] = useState(read)
  useEffect(() => {
    const onChange = () => setWhere(read())
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return [where, (collection, item) => (location.hash = `${encodeURIComponent(collection)}/${encodeURIComponent(item)}`)]
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith('ko'))
  if (voice) utterance.voice = voice
  speechSynthesis.speak(utterance)
}

const MY_SENTENCES = 'mine'

/** The whole sentence, each word coloured by the phrase it belongs to. */
function SentencePill({ analysis }: { analysis: AnalysisData }) {
  const kindOf = new Map<number, PhraseKind>()
  for (const p of analysis.phrases.filter((p) => p.level === 1)) {
    for (let e = p.eojeolFrom; e <= p.eojeolTo; e++) kindOf.set(e, p.kind)
  }
  return (
    <div className="flex items-center gap-2 rounded-full border border-divider bg-panel py-2 pr-2 pl-5">
      <p className="min-w-0 flex-1 text-center text-lg leading-snug font-medium sm:text-xl">
        {analysis.eojeols.map((e, i) => {
          const kind = kindOf.get(i)
          return (
            <span key={i} style={kind ? phraseColor(kind) : undefined} className={kind ? 'text-(--c)' : ''}>
              {e.text}
              {i < analysis.eojeols.length - 1 ? ' ' : ''}
            </span>
          )
        })}
      </p>
      <button
        type="button"
        onClick={() => speak(analysis.item.text)}
        aria-label="Listen"
        title="Listen"
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-eojeol hover:bg-row"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
        </svg>
      </button>
    </div>
  )
}

/** The translation under the breakdown; the user can add or correct it. */
function TranslationField({ item, onSave }: { item: Item; onSave: (translation: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.translation ?? '')
  useEffect(() => {
    setEditing(false)
    setDraft(item.translation ?? '')
  }, [item])

  if (editing) {
    const save = () => {
      onSave(draft.trim())
      setEditing(false)
    }
    return (
      <div className="mx-auto mt-4 flex max-w-xl gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder="Your translation"
          className="h-11 min-w-0 flex-1 rounded-lg border border-divider bg-panel px-3 placeholder:text-muted"
        />
        <button type="button" onClick={save} className="h-11 cursor-pointer rounded-lg bg-navy px-4 text-sm font-bold text-on-navy">
          Save
        </button>
      </div>
    )
  }
  return (
    <div className="mx-auto mt-4 flex max-w-xl items-baseline justify-center gap-2 text-[15px] text-body">
      {item.translation ? (
        <>
          <span>{item.translation}</span>
          <button type="button" onClick={() => setEditing(true)} className="cursor-pointer text-xs text-accent-text underline hover:text-ink">
            edit
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="cursor-pointer text-sm text-accent-text hover:underline">
          + Add a translation
        </button>
      )}
    </div>
  )
}

function KiwiStatus({ kiwi }: { kiwi: KiwiState }) {
  if (kiwi.status === 'ready') return null
  if (kiwi.status === 'error') {
    return (
      <p className="rounded-lg border border-divider bg-panel px-4 py-3 text-sm text-danger">
        {"The analyzer couldn't load: "}
        {kiwi.message}
      </p>
    )
  }
  const pct = kiwi.total ? Math.round((100 * kiwi.loaded) / kiwi.total) : 0
  return (
    <div className="rounded-lg border border-divider bg-panel px-4 py-3 text-sm text-body" role="status">
      <div className="flex justify-between gap-3">
        <span>
          Loading the Korean analyzer
          <span className="text-muted"> · first time only, about 88 MB</span>
        </span>
        <span className="font-mono text-xs text-muted">{kiwi.total ? `${pct}%` : '…'}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-chip">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EmptyState({ ready, onTry }: { ready: boolean; onTry: (text: string) => void }) {
  const samples = ['한국어를 공부해요.', '어제 친구랑 영화를 봤는데 진짜 재미있었어.', '비가 와서 집에 있을 수밖에 없었잖아요.']
  return (
    <div className="mt-6 rounded-panel border border-dashed border-divider px-5 py-10 text-center">
      <p className="text-lg font-bold">Break down any Korean sentence</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Type or paste it above (a whole paragraph works too), or import the subtitles of a show. Everything is saved in this browser.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {samples.map((s) => (
          <button
            key={s}
            type="button"
            disabled={!ready}
            onClick={() => onTry(s)}
            className="cursor-pointer rounded-full border border-divider bg-panel px-4 py-2 text-[15px] hover:bg-row disabled:cursor-default disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useTheme()
  const kiwi = useKiwi()
  const { dictionary, error: dictionaryError } = useDictionary()
  const { collections, error: storageError, save, remove } = useLibrary()
  const [where, open] = useLocation()
  const [selected, setSelected] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)

  const nonEmpty = (collections ?? []).filter((c) => c.items.length)
  const collection = nonEmpty.find((c) => c.id === where.collection) ?? nonEmpty.at(-1)
  const position = collection ? Math.max(0, collection.items.findIndex((i) => i.id === where.item)) : -1
  const item = collection?.items[position]
  const analysis = item && dictionary ? analysisOf(item, dictionary) : null
  const unit = analysis && selected !== null ? analysis.units[selected] : null

  useEffect(() => setSelected(null), [item?.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey || e.altKey) return
      if (!collection) return
      const items = collection.items
      if (e.key === 'ArrowRight') open(collection.id, items[(position + 1) % items.length].id)
      else if (e.key === 'ArrowLeft') open(collection.id, items[(position - 1 + items.length) % items.length].id)
      else if (e.key === 'r') open(collection.id, items[Math.floor(Math.random() * items.length)].id)
      else if (e.key === 'Escape') setSelected(null)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  /** Adds typed or pasted text to "My sentences", one item per sentence. */
  const addText = async (text: string) => {
    const mine: Collection = collections?.find((c) => c.id === MY_SENTENCES) ?? {
      id: MY_SENTENCES,
      title: 'My sentences',
      kind: 'sentences',
      createdAt: Date.now(),
      items: [],
    }
    const sentences = (await analyzeText(text)).filter((s) => /[가-힣]/.test(s.text))
    if (!sentences.length) return
    const existing = new Map(mine.items.map((i) => [i.text, i]))
    const added = sentences.filter((s) => !existing.has(s.text)).map((s) => ({ id: newId(), ...s }))
    save({ ...mine, items: [...mine.items, ...added] })
    // Show the first sentence of what was pasted, whether it was new or already there.
    open(MY_SENTENCES, (existing.get(sentences[0].text) ?? added[0]).id)
  }

  const importSubtitles = async ({ title, cues, translations }: SubtitleImport) => {
    const morphemes = await analyzeLines(cues.map((c) => c.text))
    const paired = translations.length ? pairTranslations(cues, translations) : []
    const items: Item[] = cues.map((cue, i) => ({
      id: newId(),
      text: cue.text,
      start: cue.start,
      end: cue.end,
      morphemes: morphemes[i],
      ...(paired[i] && { translation: paired[i] }),
    }))
    const created: Collection = { id: newId(), title, kind: 'subtitles', createdAt: Date.now(), items }
    save(created)
    setImporting(false)
    open(created.id, items[0].id)
  }

  const updateItem = (changed: Item) => {
    if (!collection) return
    save({ ...collection, items: collection.items.map((i) => (i.id === changed.id ? changed : i)) })
  }

  const deleteItem = () => {
    if (!collection || !item) return
    const items = collection.items.filter((i) => i.id !== item.id)
    save({ ...collection, items })
    const next = items[Math.min(position, items.length - 1)]
    if (next) open(collection.id, next.id)
  }

  const deleteCollection = () => {
    if (!collection) return
    const message = `Delete “${collection.title}” and its ${collection.items.length} sentences?`
    if (confirm(message)) remove(collection.id)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-3 py-5 sm:px-6">
      <header className="mb-5 flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">문장 분석기</h1>
          <p className="text-xs text-muted">Korean sentence analyzer</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex size-11 cursor-pointer items-center justify-center rounded-lg border border-divider bg-panel text-lg hover:bg-row"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <KiwiStatus kiwi={kiwi} />
        {[dictionaryError, storageError].filter(Boolean).map((message) => (
          <p key={message} className="rounded-lg border border-divider bg-panel px-4 py-2 text-sm text-muted">
            {message}
          </p>
        ))}
        <Composer kiwi={kiwi} onAnalyze={addText} onImport={() => setImporting((v) => !v)} />
        {importing && (
          <ImportPanel ready={kiwi.status === 'ready'} onImport={importSubtitles} onClose={() => setImporting(false)} />
        )}
      </div>

      {collections === null ? null : !collection || !item ? (
        <EmptyState ready={kiwi.status === 'ready'} onTry={addText} />
      ) : (
        <>
          <div className="mt-6">
            <CollectionBar
              collections={nonEmpty}
              collection={collection}
              position={position}
              onOpen={open}
              onDeleteItem={deleteItem}
              onDeleteCollection={deleteCollection}
            />
          </div>

          <main className="mt-3 rounded-panel border border-divider bg-panel px-2 py-5 shadow-panel sm:px-6 sm:py-7">
            {analysis ? (
              <>
                <SentencePill analysis={analysis} />
                <p className="mt-2 text-center text-xs text-muted">
                  {collection.title}
                  {item.start !== undefined && <> · {formatTime(item.start)}</>}
                  {' · '}
                  tap a part to see its grammar
                </p>
                <div className="mt-6">
                  <Analysis analysis={analysis} selected={selected} onSelect={setSelected} />
                </div>
                <TranslationField item={item} onSave={(translation) => updateItem({ ...item, translation: translation || undefined })} />
              </>
            ) : (
              <p className="py-10 text-center text-muted">Loading the dictionary…</p>
            )}
          </main>

          {unit && dictionary && (
            <div className="mt-4">
              <DetailPanel
                key={`${item.id}:${unit.index}`}
                unit={unit}
                itemId={item.id}
                collections={nonEmpty}
                dictionary={dictionary}
                onOpen={open}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </>
      )}

      <footer className="mt-auto pt-10 text-center text-[11px] leading-relaxed text-muted">
        Meanings: 한국어기초사전, National Institute of Korean Language (CC BY-SA 2.0 KR). Morphological analysis by{' '}
        <a className="underline" href="https://github.com/bab2min/Kiwi">
          Kiwi
        </a>
        . Grammar notes written for this project. Your sentences stay in this browser.
      </footer>
    </div>
  )
}
