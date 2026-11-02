import type { Morpheme } from './types.ts'

/** Kiwi's tokens (kiwi-nlp) in the compact form stored with each item. */
export function toMorphemes(tokens: { str: string; tag: string; position: number; length: number }[], offset = 0): Morpheme[] {
  return tokens.map((t) => {
    const m: Morpheme = [t.str, t.tag, t.position - offset, t.length]
    // Verbs and adjectives are looked up in their dictionary form: 먹 → 먹다.
    if (/^V/.test(t.tag)) m.push(`${t.str}다`)
    return m
  })
}
