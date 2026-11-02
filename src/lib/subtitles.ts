// SubRip (.srt) and WebVTT (.vtt) subtitle files.

export interface Cue {
  start: number
  end: number
  text: string
}

const TIME = /(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})/
const ARROW = new RegExp(`${TIME.source}\\s*-->\\s*${TIME.source}`)

const ms = (h: string | undefined, m: string, s: string, frac: string) =>
  ((Number(h ?? 0) * 60 + Number(m)) * 60 + Number(s)) * 1000 + Number(frac.padEnd(3, '0'))

/** Removes formatting: <i>, <font …>, <c.yellow>, {\an8}, and speaker dashes at line starts. */
function clean(line: string): string {
  return line
    .replace(/<[^>]*>/g, '')
    .replace(/\{\\[^}]*\}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/^\s*[-–]\s*/, '')
    .trim()
}

export function parseSubtitles(source: string): Cue[] {
  const cues: Cue[] = []
  for (const block of source.replace(/\r/g, '').replace(/^﻿/, '').split(/\n\s*\n/)) {
    const lines = block.split('\n')
    const timing = lines.findIndex((l) => ARROW.test(l))
    if (timing === -1) continue // WEBVTT header, NOTE, STYLE, stray numbers
    const [, h1, m1, s1, f1, h2, m2, s2, f2] = ARROW.exec(lines[timing])!
    const text = lines
      .slice(timing + 1)
      .map(clean)
      .filter(Boolean)
      .join(' ')
    if (text) cues.push({ start: ms(h1, m1, s1, f1), end: ms(h2, m2, s2, f2), text })
  }
  return cues
}

/**
 * The translation of each cue, from a second subtitle file of the same video:
 * the translated cues whose middle falls inside it, or failing that the one it
 * overlaps most. Timings of two files rarely match exactly.
 */
export function pairTranslations(cues: Cue[], translations: Cue[]): (string | undefined)[] {
  return cues.map((cue) => {
    const inside = translations.filter((t) => {
      const mid = (t.start + t.end) / 2
      return mid >= cue.start && mid <= cue.end
    })
    if (inside.length) return inside.map((t) => t.text).join(' ')
    let best: Cue | undefined
    let bestOverlap = 0
    for (const t of translations) {
      const overlap = Math.min(cue.end, t.end) - Math.max(cue.start, t.start)
      if (overlap > bestOverlap) {
        best = t
        bestOverlap = overlap
      }
    }
    return best?.text
  })
}

/** Subtitle files from Korean sites are often EUC-KR (CP949), not UTF-8. */
export function decodeText(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('euc-kr').decode(bytes)
  }
}

export const hasHangul = (text: string) => /[가-힣]/.test(text)

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}
