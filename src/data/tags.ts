// Kiwi uses the Sejong part-of-speech tags. Each gets a learner-friendly label
// and a kind, which decides how the unit is glossed and coloured.

export type Kind = 'content' | 'grammar' | 'punct'

interface TagInfo {
  label: string
  kind: Kind
  /** partOfSpeech values in the vocabulary that fit this tag, best first. */
  pos?: string[]
}

export const TAGS: Record<string, TagInfo> = {
  NNG: { label: 'Noun', kind: 'content', pos: ['noun', 'bound noun', 'pronoun'] },
  NNP: { label: 'Proper Noun', kind: 'content', pos: ['proper noun', 'noun'] },
  NNB: { label: 'Bound Noun', kind: 'content', pos: ['bound noun', 'noun'] },
  NP: { label: 'Pronoun', kind: 'content', pos: ['pronoun', 'noun'] },
  NR: { label: 'Numeral', kind: 'content', pos: ['numeral', 'determiner', 'noun'] },
  VV: { label: 'Verb', kind: 'content', pos: ['verb', 'auxiliary verb'] },
  VA: { label: 'Adjective', kind: 'content', pos: ['adjective', 'auxiliary adjective'] },
  VX: { label: 'Auxiliary', kind: 'content', pos: ['auxiliary verb', 'auxiliary adjective', 'verb'] },
  VCP: { label: 'Copula', kind: 'grammar' },
  VCN: { label: 'Adjective', kind: 'content', pos: ['adjective'] },
  MM: { label: 'Determiner', kind: 'content', pos: ['determiner', 'numeral'] },
  MAG: { label: 'Adverb', kind: 'content', pos: ['adverb'] },
  MAJ: { label: 'Conj. Adverb', kind: 'content', pos: ['adverb'] },
  IC: { label: 'Interjection', kind: 'content', pos: ['interjection'] },
  JKS: { label: 'Particle', kind: 'grammar' },
  JKC: { label: 'Particle', kind: 'grammar' },
  JKG: { label: 'Particle', kind: 'grammar' },
  JKO: { label: 'Particle', kind: 'grammar' },
  JKB: { label: 'Particle', kind: 'grammar' },
  JKV: { label: 'Particle', kind: 'grammar' },
  JKQ: { label: 'Particle', kind: 'grammar' },
  JX: { label: 'Particle', kind: 'grammar' },
  JC: { label: 'Particle', kind: 'grammar' },
  EP: { label: 'Suffix', kind: 'grammar' },
  EF: { label: 'Sentence End', kind: 'grammar' },
  EC: { label: 'Connector', kind: 'grammar' },
  ETN: { label: 'Nominalizer', kind: 'grammar' },
  ETM: { label: 'Modifier', kind: 'grammar' },
  XPN: { label: 'Prefix', kind: 'grammar' },
  XSN: { label: 'Suffix', kind: 'grammar' },
  XSV: { label: 'Verb Suffix', kind: 'grammar' },
  XSA: { label: 'Adj. Suffix', kind: 'grammar' },
  XR: { label: 'Root', kind: 'content', pos: ['noun', 'adjective'] },
  SN: { label: 'Number', kind: 'content' },
  SL: { label: 'Foreign Word', kind: 'content' },
  SH: { label: 'Hanja', kind: 'content' },
}

const PUNCT: TagInfo = { label: '', kind: 'punct' }
const OTHER: TagInfo = { label: 'Other', kind: 'content' }

export function tagInfo(tag: string): TagInfo {
  if (TAGS[tag]) return TAGS[tag]
  return /^S[FPSEOW]/.test(tag) ? PUNCT : OTHER
}

export const PREDICATE_TAGS = new Set(['VV', 'VA', 'VX', 'VCP', 'VCN'])
