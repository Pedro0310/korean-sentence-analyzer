import { useMemo, useState } from 'react'
import type { Grammar } from '../data/grammar.ts'
import { findExamples } from '../lib/library.ts'
import type { Collection, Dictionary, Unit } from '../lib/types.ts'

interface Props {
  unit: Unit
  itemId: string
  collections: Collection[]
  dictionary: Dictionary
  onOpen: (collectionId: string, itemId: string) => void
  onClose: () => void
}

function GrammarNote({ grammar, part }: { grammar: Grammar; part?: boolean }) {
  return (
    <div className={part ? 'mt-4 border-t border-divider pt-3' : ''}>
      {part && <div className="mb-1 text-xs text-muted">This part on its own</div>}
      <p className="flex flex-wrap items-baseline gap-x-2 text-[15px]">
        <span className="text-muted">{grammar.category}</span>
        <span className="text-muted">~</span>
        <span className="font-bold text-eojeol">{grammar.title}</span>
        <span className="font-medium text-meaning">{grammar.label}</span>
      </p>
      <p className="mt-2 text-sm leading-relaxed text-body">{grammar.note}</p>
    </div>
  )
}

function Senses({ unit }: { unit: Unit }) {
  return (
    <ol className="mt-2 space-y-2 text-sm text-body">
      {unit.senses.slice(0, 6).map(([en, pos, definition], i) => (
        <li key={i} className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className={unit.kind === 'content' ? 'font-medium text-meaning' : ''}>{en}</span>
            {pos && unit.kind === 'content' && <span className="text-xs text-muted">({pos})</span>}
          </div>
          {definition && definition !== en && <div className="text-[13px] text-muted">{definition}</div>}
        </li>
      ))}
    </ol>
  )
}

function Definition({ unit }: { unit: Unit }) {
  const main = unit.pattern?.entry ?? unit.grammar
  return (
    <div>
      {main && <GrammarNote grammar={main} />}
      {unit.pattern && unit.grammar && <GrammarNote grammar={unit.grammar} part />}
      {unit.kind === 'content' && (
        <div className={main ? 'mt-4 border-t border-divider pt-3' : ''}>
          <p className="flex flex-wrap items-baseline gap-x-2 text-[15px]">
            <span className="text-muted">{unit.label}</span>
            <span className="text-muted">~</span>
            <span className="font-bold text-eojeol">{unit.lemma}</span>
            {unit.irregular && (
              <span className="rounded-full bg-warn px-2 py-px text-[11px] font-medium text-warn-ink">
                irregular conjugation
              </span>
            )}
          </p>
          {unit.senses.length ? <Senses unit={unit} /> : <p className="mt-2 text-sm text-muted">Not in the dictionary.</p>}
        </div>
      )}
      {!main && unit.kind === 'grammar' &&
        (unit.senses.length ? (
          <div>
            <p className="text-[15px] text-muted">
              {unit.label} ~ <span className="font-bold text-eojeol">{unit.text}</span>
              <span className="ml-2 text-xs">(한국어기초사전)</span>
            </p>
            <Senses unit={unit} />
          </div>
        ) : (
          <p className="text-sm text-muted">No note for this form yet.</p>
        ))}
    </div>
  )
}

function Examples({ unit, itemId, collections, dictionary, onOpen }: Omit<Props, 'onClose'>) {
  const examples = useMemo(
    () => findExamples(unit, collections, dictionary, itemId),
    [unit, collections, dictionary, itemId],
  )
  if (!examples.length) {
    return (
      <p className="text-sm text-muted">
        None of your other sentences use this yet. Add more, or import subtitles, and they will show up here.
      </p>
    )
  }
  return (
    <ul className="divide-y divide-divider">
      {examples.map(({ collection, analysis, units }) => {
        const marked = new Set(units.map((u) => u.eojeol))
        const translation = analysis.item.translation
        return (
          <li key={analysis.item.id}>
            <button
              type="button"
              onClick={() => onOpen(collection.id, analysis.item.id)}
              className="w-full cursor-pointer rounded-md px-2 py-2 text-left hover:bg-row"
            >
              <span className="text-[15px]">
                {analysis.eojeols.map((e, i) => (
                  <span key={i} className={marked.has(i) ? 'bg-highlight font-bold' : ''}>
                    {e.text}
                    {i < analysis.eojeols.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </span>
              <span className="block text-[13px] text-muted">
                {translation && <>{translation} · </>}
                {collection.title}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default function DetailPanel(props: Props) {
  const [tab, setTab] = useState<'definition' | 'examples'>('definition')
  const tabs = [
    ['definition', 'Definition'],
    ['examples', 'Examples'],
  ] as const
  return (
    <section className="rounded-panel border border-divider bg-panel p-4 shadow-panel sm:p-5" aria-label="Details">
      <div className="mb-3 flex items-center gap-1">
        <span className="mr-2 text-2xl font-bold">{props.unit.text}</span>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`cursor-pointer rounded-md px-2.5 py-1.5 text-sm ${tab === id ? 'bg-chip font-medium text-chip-text' : 'text-muted hover:bg-row'}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={props.onClose}
          aria-label="Close"
          className="ml-auto flex size-9 cursor-pointer items-center justify-center rounded-md text-xl text-danger hover:bg-row"
        >
          ×
        </button>
      </div>
      {tab === 'definition' ? (
        <Definition unit={props.unit} />
      ) : (
        <Examples {...props} />
      )}
    </section>
  )
}
