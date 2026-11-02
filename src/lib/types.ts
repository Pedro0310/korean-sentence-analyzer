import type { Grammar, GrammarPattern } from '../data/grammar.ts'
import type { Kind } from '../data/tags.ts'

/** Kiwi's output, compacted: form, Sejong tag, start, length, dictionary form (when it differs). */
export type Morpheme = [form: string, tag: string, start: number, length: number, lemma?: string]

/** One dictionary sense: English equivalent, part of speech, English definition. */
export type Sense = [en: string, pos: string | null, definition?: string | null]

export type Dictionary = Record<string, Sense[]>

/** One sentence the user added, or one subtitle line. */
export interface Item {
  id: string
  text: string
  /** Typed by the user, or taken from a matching subtitle file. */
  translation?: string
  /** Subtitle timing, in milliseconds. */
  start?: number
  end?: number
  morphemes: Morpheme[]
}

/** A group of items: "My sentences", or one imported subtitle file. */
export interface Collection {
  id: string
  title: string
  kind: 'sentences' | 'subtitles'
  createdAt: number
  items: Item[]
}

/** A column in the breakdown: one morpheme, or a noun + 하다 style merge (공부하). */
export interface Unit {
  /** Position among all units of the sentence. */
  index: number
  eojeol: number
  text: string
  /** Sejong tag; merged noun + 하 units count as VV or VA. */
  tag: string
  /** Dictionary form used to look the unit up (공부하다, 먹다, 은). */
  lemma: string
  kind: Kind
  label: string
  /** Dictionary senses, best fit first. */
  senses: Sense[]
  grammar?: Grammar
  pattern?: { entry: GrammarPattern; group: number }
  /** Where its first morpheme starts in the sentence. */
  start: number
  /** Conjugates irregularly (듣다 → 들어요, 덥다 → 더워요). */
  irregular?: boolean
}

/** A space-separated word of the sentence. */
export interface Eojeol {
  text: string
  units: Unit[]
}

export type PhraseKind =
  | 'object'
  | 'subject'
  | 'topic'
  | 'adverbial'
  | 'complement'
  | 'quote'
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'predicate'
  | 'interjection'
  | 'subordinate'
  | 'main'

export interface Phrase {
  kind: PhraseKind
  /** 1 sits right under the units; 2 groups level-1 phrases into clauses. */
  level: 1 | 2
  /** First and last unit index (punctuation excluded). */
  from: number
  to: number
  eojeolFrom: number
  eojeolTo: number
}

export interface Analysis {
  item: Item
  eojeols: Eojeol[]
  units: Unit[]
  phrases: Phrase[]
}
