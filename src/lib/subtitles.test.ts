import { describe, expect, it } from 'vitest'
import { decodeText, pairTranslations, parseSubtitles } from './subtitles.ts'

const SRT = `1
00:00:01,000 --> 00:00:03,500
<i>어디 가?</i>

2
00:00:04,000 --> 00:00:06,000
- 학교 가.
- 같이 가자!

3
00:00:07,000 --> 00:00:08,000
♪♪
`

const VTT = `WEBVTT

NOTE made up

intro
00:01.100 --> 00:03.400 position:10%
Where are you going?

00:04.200 --> 00:05.000
To school.

00:05.000 --> 00:05.900
{\\an8}Let's go together!
`

describe('subtitles', () => {
  it('reads SRT, dropping tags and speaker dashes', () => {
    expect(parseSubtitles(SRT)).toEqual([
      { start: 1000, end: 3500, text: '어디 가?' },
      { start: 4000, end: 6000, text: '학교 가. 같이 가자!' },
      { start: 7000, end: 8000, text: '♪♪' },
    ])
  })

  it('reads VTT, skipping the header, notes and cue settings', () => {
    expect(parseSubtitles(VTT).map((c) => [c.start, c.end, c.text])).toEqual([
      [1100, 3400, 'Where are you going?'],
      [4200, 5000, 'To school.'],
      [5000, 5900, "Let's go together!"],
    ])
  })

  it('pairs translations by time, even when the cues are split differently', () => {
    const ko = parseSubtitles(SRT)
    expect(pairTranslations(ko, parseSubtitles(VTT))).toEqual([
      'Where are you going?',
      "To school. Let's go together!",
      undefined,
    ])
  })

  it('decodes EUC-KR files', () => {
    const eucKr = new Uint8Array([0xc7, 0xd1, 0xb1, 0xb9, 0xbe, 0xee]) // 한국어
    expect(decodeText(eucKr.buffer)).toBe('한국어')
    expect(decodeText(new TextEncoder().encode('한국어').buffer as ArrayBuffer)).toBe('한국어')
  })
})
