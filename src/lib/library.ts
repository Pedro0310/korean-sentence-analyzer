import { useEffect, useState } from 'react'
import { analyze } from './analyze.ts'
import type { Analysis, Collection, Dictionary, Item, Unit } from './types.ts'

/** Loads the 한국어기초사전 meanings (public/data/dictionary.json, built by `npm run dictionary`). */
export function useDictionary(): { dictionary: Dictionary | null; error: string | null } {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/dictionary.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<Dictionary>
      })
      .then(setDictionary)
      .catch((e: Error) => {
        // Still usable without it: units show their part of speech and grammar notes.
        setError(`Word meanings are unavailable (${e.message}). Run \`npm run dictionary\`.`)
        setDictionary({})
      })
  }, [])
  return { dictionary, error }
}

// Items never change their text or morphemes once added, so analyses are cached by object.
const cache = new WeakMap<Item, { dictionary: Dictionary; analysis: Analysis }>()

export function analysisOf(item: Item, dictionary: Dictionary): Analysis {
  const hit = cache.get(item)
  if (hit?.dictionary === dictionary) return hit.analysis
  const analysis = analyze(item, dictionary)
  cache.set(item, { dictionary, analysis })
  return analysis
}

export interface Example {
  collection: Collection
  analysis: Analysis
  units: Unit[]
}

/** Other sentences, across all collections, that use the same grammar point or word as `unit`. */
export function findExamples(unit: Unit, collections: Collection[], dictionary: Dictionary, exclude: string, limit = 8): Example[] {
  const same = (u: Unit) => {
    if (unit.pattern) return u.pattern?.entry.id === unit.pattern.entry.id
    if (unit.kind === 'content') return u.kind === 'content' && u.lemma === unit.lemma
    return unit.grammar ? u.grammar?.id === unit.grammar.id : u.text === unit.text && u.tag === unit.tag
  }
  // Shortest first: short sentences show a point most clearly.
  const candidates = collections
    .flatMap((collection) => collection.items.map((item) => ({ collection, item })))
    .filter(({ item }) => item.id !== exclude)
    .sort((a, b) => a.item.text.length - b.item.text.length)
  const found: Example[] = []
  for (const { collection, item } of candidates) {
    const analysis = analysisOf(item, dictionary)
    const units = analysis.units.filter(same)
    if (units.length) found.push({ collection, analysis, units })
    if (found.length === limit) break
  }
  return found
}

/** Phrase type labels; colours are the --color-ph-* tokens in index.css. */
export const PHRASE_LABELS = {
  object: 'Object Phrase',
  subject: 'Subject Phrase',
  topic: 'Topic Phrase',
  adverbial: 'Adverbial Phrase',
  complement: 'Complement',
  quote: 'Quotation',
  noun: 'Noun Phrase',
  verb: 'Verb Phrase',
  adjective: 'Adjective Phrase',
  predicate: 'Predicate',
  interjection: 'Interjection',
  subordinate: 'Subordinate Clause',
  main: 'Main Clause',
} as const
