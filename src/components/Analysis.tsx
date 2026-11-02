import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { PHRASE_LABELS } from '../lib/library.ts'
import type { Analysis as AnalysisData, Phrase, Unit } from '../lib/types.ts'

export function phraseColor(kind: Phrase['kind']): CSSProperties {
  return { '--c': `var(--color-ph-${kind})` } as CSSProperties
}

/** The short meaning under a unit, and how to colour it. */
export function meaningOf(unit: Unit): { text: string; tone: 'meaning' | 'grammar' | 'pattern' } | null {
  const grammar = unit.pattern?.entry ?? unit.grammar
  if (grammar) return { text: grammar.label, tone: unit.pattern ? 'pattern' : 'grammar' }
  const sense = unit.senses[0]
  // Dictionary senses of particles and endings are whole definitions: too long to show here.
  if (!sense || unit.kind !== 'content') return null
  const text = sense[0].split(/[;,]/)[0].trim()
  return { text, tone: 'meaning' }
}

const TONE = { meaning: 'text-meaning', grammar: 'text-grammar', pattern: 'text-grammar font-bold' }

// Vertical space under the units: bracket ticks, line, label (level 1), then
// the same again for clause brackets (level 2).
const TICK = 18
const LABEL_GAP = 9
const LABEL_HEIGHT = 22
const LEVEL1_SPACE = TICK + LABEL_GAP + LABEL_HEIGHT + 6
const LEVEL2_SPACE = 14 + LABEL_GAP + LABEL_HEIGHT + 6

const labelWidth = (p: Phrase) => PHRASE_LABELS[p.kind].length * 7.2 + 20

/**
 * The sentence wraps like text, one block per level-1 phrase, so a phrase and
 * its bracket always stay on one line. Eojeols outside any phrase get their own block.
 */
function toBlocks(analysis: AnalysisData): { phrase?: Phrase; eojeols: number[] }[] {
  const level1 = analysis.phrases.filter((p) => p.level === 1)
  const blocks: { phrase?: Phrase; eojeols: number[] }[] = []
  for (let e = 0; e < analysis.eojeols.length; e++) {
    if (!analysis.eojeols[e].units.some((u) => u.kind !== 'punct')) continue
    const phrase = level1.find((p) => p.eojeolFrom === e)
    if (phrase) {
      blocks.push({ phrase, eojeols: Array.from({ length: phrase.eojeolTo - e + 1 }, (_, i) => e + i) })
      e = phrase.eojeolTo
    } else {
      blocks.push({ eojeols: [e] })
    }
  }
  return blocks
}

interface Bracket {
  phrase: Phrase
  path: string
  /** Where the dot and label sit. */
  mid: number
  y: number
  labelY: number
}

interface Measured {
  /** The blocks these measurements belong to; a new sentence renders before it is re-measured. */
  for: ReturnType<typeof toBlocks>
  /** Unit centre and bottom, relative to the container. */
  units: Map<number, { x: number; bottom: number }>
  /** Block extents and the line each block wrapped onto. */
  blocks: { left: number; right: number; row: number }[]
  rowBottoms: number[]
  width: number
  height: number
}

function bracketPath(points: { x: number; top: number }[], y: number, open: { start?: boolean; end?: boolean } = {}) {
  const first = points[0]
  const last = points.at(-1)!
  if (points.length === 1 && !open.start && !open.end) return `M ${first.x} ${first.top} V ${y}`
  const r = 6
  let d = open.start ? `M ${first.x} ${y}` : `M ${first.x} ${first.top} V ${y - r} Q ${first.x} ${y} ${first.x + r} ${y}`
  d += open.end ? ` H ${last.x}` : ` H ${last.x - r} Q ${last.x} ${y} ${last.x} ${y - r} V ${last.top}`
  for (const p of points.slice(open.start ? 0 : 1, open.end ? undefined : -1)) d += ` M ${p.x} ${p.top} V ${y}`
  return d
}

function layoutBrackets(analysis: AnalysisData, blocks: ReturnType<typeof toBlocks>, m: Measured): Bracket[] {
  const items: Bracket[] = []
  const rowOf = new Map<Phrase, number>()
  blocks.forEach((b, i) => b.phrase && rowOf.set(b.phrase, m.blocks[i].row))

  for (const phrase of analysis.phrases.filter((p) => p.level === 1)) {
    const row = rowOf.get(phrase)
    if (row === undefined) continue
    const points = analysis.units
      .slice(phrase.from, phrase.to + 1)
      .flatMap((u) => {
        const pos = m.units.get(u.index)
        return pos ? [{ x: pos.x, top: pos.bottom + 4 }] : []
      })
    if (!points.length) continue
    const y = m.rowBottoms[row] + TICK
    const mid = (points[0].x + points.at(-1)!.x) / 2
    items.push({ phrase, path: bracketPath(points, y), mid, y, labelY: y + LABEL_GAP })
  }

  // Clause brackets hang under the labels of the phrases they contain. A clause
  // that wraps gets one open-ended segment per line; its label goes on the first.
  const level1 = items.slice()
  for (const clause of analysis.phrases.filter((p) => p.level === 2)) {
    const children = level1.filter((b) => b.phrase.eojeolFrom >= clause.eojeolFrom && b.phrase.eojeolTo <= clause.eojeolTo)
    const rows = [...new Set(children.map((b) => rowOf.get(b.phrase)!))].sort((a, b) => a - b)
    rows.forEach((row, i) => {
      const onRow = children.filter((b) => rowOf.get(b.phrase) === row)
      const rowBlocks = m.blocks.filter((b) => b.row === row)
      const y = onRow[0].labelY + LABEL_HEIGHT + 14
      const points = onRow.map((b) => ({ x: b.mid, top: b.labelY + LABEL_HEIGHT + 2 }))
      const open = { start: i > 0, end: i < rows.length - 1 }
      if (open.start) points.unshift({ x: Math.min(...rowBlocks.map((b) => b.left)), top: y })
      if (open.end) points.push({ x: Math.max(...rowBlocks.map((b) => b.right)), top: y })
      const mid = (points[0].x + points.at(-1)!.x) / 2
      const path = bracketPath(points, y, open)
      items.push({ phrase: clause, path, mid, y, labelY: i === 0 ? y + LABEL_GAP : Number.NaN })
    })
  }
  return items
}

interface Props {
  analysis: AnalysisData
  selected: number | null
  onSelect: (index: number | null) => void
}

export default function Analysis({ analysis, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const unitEls = useRef(new Map<number, HTMLElement>())
  const blockEls = useRef<(HTMLElement | null)[]>([])
  const blocks = useMemo(() => toBlocks(analysis), [analysis])
  const hasClauses = analysis.phrases.some((p) => p.level === 2)
  const [measured, setMeasured] = useState<Measured | null>(null)

  // Brackets are drawn from where the units actually landed, re-measured
  // whenever the layout changes (window size, fonts loading).
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => {
      const box = container.getBoundingClientRect()
      const units = new Map<number, { x: number; bottom: number }>()
      unitEls.current.forEach((el, i) => {
        const r = el.getBoundingClientRect()
        units.set(i, { x: r.left - box.left + r.width / 2, bottom: r.bottom - box.top })
      })
      const tops: number[] = []
      const measuredBlocks = blockEls.current.slice(0, blocks.length).map((el) => {
        const r = el!.getBoundingClientRect()
        const top = Math.round(r.top - box.top)
        let row = tops.findIndex((t) => Math.abs(t - top) < 4)
        if (row === -1) row = tops.push(top) - 1
        return { left: r.left - box.left, right: r.right - box.left, row }
      })
      const rowBottoms = tops.map(() => 0)
      blocks.forEach((block, i) => {
        for (const e of block.eojeols) {
          for (const u of analysis.eojeols[e].units) {
            const pos = units.get(u.index)
            if (pos) rowBottoms[measuredBlocks[i].row] = Math.max(rowBottoms[measuredBlocks[i].row], pos.bottom)
          }
        }
      })
      setMeasured({ for: blocks, units, blocks: measuredBlocks, rowBottoms, width: container.scrollWidth, height: container.scrollHeight })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    document.fonts?.ready.then(measure)
    return () => observer.disconnect()
  }, [analysis, blocks])

  const current = measured?.for === blocks ? measured : null
  const brackets = current ? layoutBrackets(analysis, blocks, current) : []

  return (
    <div className="overflow-x-auto">
      <div ref={containerRef} className="relative flex flex-wrap justify-center-safe gap-x-5 gap-y-1 px-1 sm:gap-x-7">
        {blocks.map((block, b) => (
          <div
            key={`${analysis.item.id}:${b}`}
            ref={(el) => {
              blockEls.current[b] = el
            }}
            className="flex justify-center-safe gap-2 sm:gap-5"
            style={{
              minWidth: block.phrase ? labelWidth(block.phrase) : undefined,
              paddingBottom: LEVEL1_SPACE + (hasClauses ? LEVEL2_SPACE : 0),
            }}
          >
            {block.eojeols.map((e) => {
              const eojeol = analysis.eojeols[e]
              return (
                <div key={e} className="flex flex-col items-stretch">
                  <div className="border-b border-divider px-1 pb-1 text-center text-lg font-medium text-eojeol sm:text-xl">
                    {eojeol.text}
                  </div>
                  <div className="flex justify-center gap-0.5 pt-2 sm:gap-1.5">
                    {eojeol.units
                      .filter((u) => u.kind !== 'punct')
                      .map((unit) => {
                        const meaning = meaningOf(unit)
                        return (
                          <button
                            key={unit.index}
                            ref={(el) => {
                              if (el) unitEls.current.set(unit.index, el)
                              else unitEls.current.delete(unit.index)
                            }}
                            type="button"
                            onClick={() => onSelect(selected === unit.index ? null : unit.index)}
                            aria-pressed={selected === unit.index}
                            className={`flex min-w-10 max-w-28 cursor-pointer flex-col items-center rounded-lg px-1 pt-1 pb-1.5 sm:px-1.5 transition-colors hover:bg-row ${
                              selected === unit.index ? 'bg-row ring-2 ring-accent/50' : ''
                            }`}
                          >
                            <span
                              className={`text-[24px] leading-tight font-bold whitespace-nowrap sm:text-[32px] ${unit.pattern ? 'text-meaning' : 'text-ink'}`}
                            >
                              {unit.text}
                            </span>
                            <span className={`mt-0.5 text-center text-xs leading-tight sm:whitespace-nowrap ${unit.pattern ? 'font-bold text-ink' : 'text-muted'}`}>
                              {unit.label}
                            </span>
                            {meaning && (
                              <span
                                title={meaning.text}
                                className={`line-clamp-2 text-center text-[13px] leading-tight text-balance ${TONE[meaning.tone]}`}
                              >
                                {meaning.text}
                              </span>
                            )}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {current && (
          <svg
            className="pointer-events-none absolute top-0 left-0 overflow-visible"
            width={current.width}
            height={current.height}
            aria-hidden
          >
            {brackets.map((b, i) => (
              <g key={i} style={phraseColor(b.phrase.kind)} className="text-(--c)">
                <path d={b.path} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.75} />
                {!Number.isNaN(b.labelY) && (
                  <>
                    <circle cx={b.mid} cy={b.y} r={4.5} fill="var(--color-panel)" stroke="currentColor" strokeWidth={2} />
                    <circle cx={b.mid} cy={b.y} r={1.6} fill="currentColor" />
                  </>
                )}
              </g>
            ))}
          </svg>
        )}
        {brackets
          .filter((b) => !Number.isNaN(b.labelY))
          .map((b, i) => (
            <div
              key={i}
              style={{ ...phraseColor(b.phrase.kind), left: b.mid, top: b.labelY }}
              className="absolute -translate-x-1/2 rounded-md bg-[color-mix(in_srgb,var(--c)_11%,transparent)] px-2 py-px text-[12.5px] font-medium whitespace-nowrap text-(--c)"
            >
              {PHRASE_LABELS[b.phrase.kind]}
            </div>
          ))}
      </div>
    </div>
  )
}
