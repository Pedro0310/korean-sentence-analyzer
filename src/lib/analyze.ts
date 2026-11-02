import { FORMS, PATTERNS, type GrammarForm } from '../data/grammar.ts'
import { PREDICATE_TAGS, tagInfo } from '../data/tags.ts'
import { canonical, toCompat } from './hangul.ts'
import type { Analysis, Dictionary, Eojeol, Item, Phrase, PhraseKind, Sense, Unit } from './types.ts'

const FORM_INDEX = new Map<string, GrammarForm>()
for (const entry of FORMS) for (const key of entry.keys) FORM_INDEX.set(key, entry)

// Longest first, so 다고 해서 wins over 다고 하다; contractions (잖 = 지 + 않) before
// the spelled-out pattern they are made of.
const PATTERN_STEPS = PATTERNS.map((entry) => ({
  entry,
  steps: entry.seq.map((step) => {
    const [forms, tags] = step.split('/')
    return { forms: forms.split('|'), tags: tags.split('|') }
  }),
})).sort((a, b) => b.steps.length - a.steps.length || Number(!!b.entry.contracted) - Number(!!a.entry.contracted))

/** Units that a following 하다/되다 suffix turns into a verb or adjective. */
const DERIVABLE = new Set(['NNG', 'NNP', 'XR'])
const NOUNISH = new Set(['NNG', 'NNP', 'NNB', 'NP'])

type Glosses = Dictionary

/** Dictionary parts of speech that can gloss a grammatical tag, by its first letter. */
const GRAMMAR_POS: Record<string, string[]> = {
  J: ['particle'],
  E: ['ending', 'expression'],
  X: ['affix'],
  V: ['expression'],
}

/** Senses for a dictionary form, the ones whose part of speech fits the tag first. */
function sensesFor(glosses: Glosses, lemma: string, tag: string): Sense[] {
  const senses = glosses[lemma]
  if (!senses) return []
  const fits = tagInfo(tag).pos ?? []
  const rank = (s: Sense) => {
    const i = fits.indexOf(s[1] ?? '')
    return i === -1 ? fits.length : i
  }
  return [...senses].sort((a, b) => rank(a) - rank(b))
}

/** Splits the sentence at spaces and groups each eojeol's morphemes into units. */
function buildEojeols(item: Item, glosses: Glosses): Eojeol[] {
  const eojeols: (Eojeol & { start: number; end: number })[] = []
  for (const match of item.text.matchAll(/\S+/g)) {
    eojeols.push({ text: match[0], start: match.index, end: match.index + match[0].length, units: [] })
  }

  // Merged units remember the base noun, so 공부하다 can fall back to 공부.
  const bases = new Map<Unit, string>()
  for (const [form, rawTag, start, , lemma] of item.morphemes) {
    // Kiwi marks how a stem conjugates: VV-I irregular (듣다 → 들어), VV-R regular.
    const tag = rawTag.replace(/-[IR]$/, '')
    const irregular = rawTag.endsWith('-I')
    const e = eojeols.findIndex((w) => start < w.end) // morphemes are in order; Kiwi never starts one in a gap
    const eojeol = eojeols[e === -1 ? eojeols.length - 1 : e]
    const text = toCompat(form)
    const prev = eojeol.units.at(-1)

    // 조용 + 히 → 조용히, an adverb
    if (prev && tag === 'XSM' && DERIVABLE.has(prev.tag)) {
      bases.set(prev, prev.lemma)
      prev.text += text
      prev.lemma = prev.text
      prev.tag = 'MAG'
      Object.assign(prev, { kind: 'content', label: tagInfo('MAG').label })
      continue
    }
    if (prev && (tag === 'XSV' || tag === 'XSA') && DERIVABLE.has(prev.tag)) {
      bases.set(prev, prev.lemma)
      prev.text += text
      prev.lemma += `${text}다`
      prev.tag = tag === 'XSV' ? 'VV' : 'VA'
      if (irregular) prev.irregular = true
      const info = tagInfo(prev.tag)
      prev.label = `${text}다-${info.label}`
      continue
    }
    if (prev && tag === 'XSN' && NOUNISH.has(prev.tag) && glosses[prev.lemma + text]) {
      prev.text += text
      prev.lemma += text
      continue
    }
    if (prev?.tag === 'XPN' && NOUNISH.has(tag) && glosses[prev.text + text]) {
      prev.text += text
      prev.lemma = prev.text
      prev.tag = tag
      Object.assign(prev, { kind: 'content', label: tagInfo(tag).label })
      continue
    }

    const info = tagInfo(tag)
    eojeol.units.push({
      index: 0,
      eojeol: eojeols.indexOf(eojeol),
      text,
      tag,
      lemma: lemma ?? text,
      kind: info.kind,
      label: info.label,
      senses: [],
      start,
      ...(irregular && { irregular }),
    })
  }

  // Nothing can follow a connector at the very end, so it is ending the sentence:
  // Kiwi sometimes tags the question 듣니? as 니/EC ("since") instead of 니/EF.
  const last = eojeols.flatMap((e) => e.units).findLast((u) => u.kind !== 'punct')
  if (last?.tag === 'EC') Object.assign(last, { tag: 'EF', label: tagInfo('EF').label })

  let index = 0
  for (const eojeol of eojeols) {
    for (const unit of eojeol.units) {
      unit.index = index++
      if (unit.kind === 'punct') continue
      unit.grammar =
        FORM_INDEX.get(`${canonical(unit.text, unit.tag)}/${unit.tag}`) ??
        // A sentence that trails off on a connector (비가 오는데…) keeps the connector's note.
        (unit === last ? FORM_INDEX.get(`${canonical(unit.text, 'EC')}/EC`) : undefined)
      if (unit.kind === 'content') {
        unit.senses = sensesFor(glosses, unit.lemma, unit.tag)
        const base = bases.get(unit)
        if (!unit.senses.length && base) unit.senses = sensesFor(glosses, base, 'NNG')
      } else if (!unit.grammar) {
        // No note of our own: fall back to the dictionary's entry for the particle or ending,
        // keeping only grammatical senses (이 the particle, not 이 "tooth").
        const pos = GRAMMAR_POS[unit.tag[0]] ?? []
        unit.senses = (glosses[canonical(unit.text, unit.tag)] ?? glosses[unit.text] ?? []).filter((s) => pos.includes(s[1] ?? ''))
      }
    }
  }
  return eojeols.map(({ text, units }) => ({ text, units }))
}

/** Marks multi-unit grammar (고 + 있다, ㄹ + 수 + 있다), across spaces too. */
function applyPatterns(units: Unit[]) {
  const words = units.filter((u) => u.kind !== 'punct')
  let group = 0
  for (let i = 0; i < words.length; i++) {
    for (const { entry, steps } of PATTERN_STEPS) {
      if (i + steps.length > words.length) continue
      const fits =
        steps.every(({ forms, tags }, j) => {
          const u = words[i + j]
          return tags.includes(u.tag) && forms.includes(canonical(u.text, u.tag))
        }) &&
        // A contraction is written as one syllable, so Kiwi starts both parts at the same place.
        (!entry.contracted || words[i].start === words[i + 1].start)
      if (!fits) continue
      group++
      for (let j = 0; j < steps.length; j++) words[i + j].pattern = { entry, group }
      i += steps.length - 1
      break
    }
  }
}

type Role = PhraseKind | 'forward' | 'connective' | 'final' | 'skip'

/** What the last unit of an eojeol says about the phrase it closes, if any. */
function roleOf(eojeols: Eojeol[], i: number, isLast: boolean): Role {
  const words = eojeols[i].units.filter((u) => u.kind !== 'punct')
  const last = words.at(-1)
  if (!last) return 'skip'
  const next = eojeols.slice(i + 1).map((e) => e.units.find((u) => u.kind !== 'punct')).find(Boolean)
  if (last.pattern && next?.pattern?.group === last.pattern.group) return 'forward'

  const role = ((): Role => {
    switch (last.tag) {
      case 'JKO':
        return 'object'
      case 'JKS':
        return 'subject'
      case 'JKC':
        return 'complement'
      case 'JKB':
        return 'adverbial'
      case 'JKQ':
        return 'quote'
      case 'JX': {
        if (['은', '는', 'ㄴ'].includes(last.text)) return 'topic'
        const before = new Set(words.slice(0, -1).map((u) => u.tag))
        if (before.has('JKB')) return 'adverbial'
        if (before.has('JKO')) return 'object'
        if (before.has('JKS')) return 'subject'
        return 'noun'
      }
      case 'JKG':
      case 'JC':
      case 'ETM':
      case 'MM':
      case 'ETN':
        return 'forward'
      case 'EC':
        return next?.tag === 'VX' ? 'forward' : 'connective'
      case 'EF':
        return 'final'
      case 'IC':
        return 'interjection'
    }
    if (PREDICATE_TAGS.has(last.tag)) return isLast ? 'final' : 'forward'
    return 'forward'
  })()

  if (role === 'forward' && isLast) {
    return words.some((u) => PREDICATE_TAGS.has(u.tag)) ? 'final' : 'noun'
  }
  return role
}

function predicateKind(eojeol: Eojeol): PhraseKind {
  const head = eojeol.units.find((u) => PREDICATE_TAGS.has(u.tag))
  if (!head) return 'verb'
  if (head.tag === 'VA' || head.tag === 'VCN') return 'adjective'
  if (head.tag === 'VCP') return 'predicate'
  return 'verb'
}

/**
 * Groups eojeols into phrases. Particles close a phrase and name it (를 →
 * object); words that modify what follows (의, -는, adverbs, bare nouns) join
 * the next phrase. Connectors (-고, -어서) end subordinate clauses, which become
 * a second level of brackets.
 */
function chunk(eojeols: Eojeol[]): Phrase[] {
  const words = (i: number) => eojeols[i].units.filter((u) => u.kind !== 'punct')
  const lastWord = eojeols.findLastIndex((_, i) => words(i).length > 0)
  const span = (kind: PhraseKind, level: 1 | 2, from: number, to: number): Phrase => ({
    kind,
    level,
    from: words(from)[0].index,
    to: words(to).at(-1)!.index,
    eojeolFrom: from,
    eojeolTo: to,
  })

  const phrases: Phrase[] = []
  const connectives: number[] = []
  let pending: number | null = null
  for (let i = 0; i <= lastWord; i++) {
    const role = roleOf(eojeols, i, i === lastWord)
    if (role === 'skip') continue
    pending ??= i
    if (role === 'forward') continue
    if (role === 'connective') connectives.push(i)
    const kind = role === 'connective' || role === 'final' ? predicateKind(eojeols[i]) : role
    phrases.push(span(kind, 1, pending, i))
    pending = null
  }

  if (connectives.length) {
    const segments: [PhraseKind, number, number][] = []
    let start = 0
    for (const c of connectives) {
      segments.push(['subordinate', start, c])
      start = c + 1
    }
    if (start <= lastWord) segments.push(['main', start, lastWord])
    for (const [kind, from, to] of segments) {
      if (!words(from).length) continue
      const inside = phrases.filter((p) => p.eojeolFrom >= from && p.eojeolTo <= to)
      if (inside.length === 1 && inside[0].eojeolFrom === from && inside[0].eojeolTo === to) {
        inside[0].kind = kind // one phrase is the whole clause: label it once
      } else if (inside.length) {
        phrases.push(span(kind, 2, inside[0].eojeolFrom, to))
      }
    }
  }
  return phrases
}

export function analyze(item: Item, glosses: Glosses): Analysis {
  const eojeols = buildEojeols(item, glosses)
  const units = eojeols.flatMap((e) => e.units)
  applyPatterns(units)
  return { item, eojeols, units, phrases: chunk(eojeols) }
}
