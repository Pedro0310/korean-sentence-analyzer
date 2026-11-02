import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { KiwiBuilder, type Kiwi } from 'kiwi-nlp'
import { beforeAll, describe, expect, it } from 'vitest'
import { analyze } from './analyze.ts'
import { canonical } from './hangul.ts'
import { toMorphemes } from './morphemes.ts'
import type { Dictionary } from './types.ts'

// Real Kiwi output (the same WebAssembly build the app runs) and the real dictionary.
const dictionary: Dictionary = JSON.parse(readFileSync(new URL('../../public/data/dictionary.json', import.meta.url), 'utf8'))
const modelDir = fileURLToPath(new URL('../../public/model/', import.meta.url))
let kiwi: Kiwi

beforeAll(async () => {
  const builder = await KiwiBuilder.create(fileURLToPath(import.meta.resolve('kiwi-nlp/dist/kiwi-wasm.wasm')))
  const modelFiles = Object.fromEntries(readdirSync(modelDir).map((f) => [f, readFileSync(modelDir + f)]))
  kiwi = await builder.build({ modelFiles, modelType: 'cong', loadMultiDict: false })
}, 120_000)

const run = (text: string) => analyze({ id: 'test', text, morphemes: toMorphemes(kiwi.tokenize(text)) }, dictionary)

const shape = (a: ReturnType<typeof analyze>) =>
  a.phrases.map((p) => `${p.level}:${p.kind}:${a.eojeols.slice(p.eojeolFrom, p.eojeolTo + 1).map((e) => e.text).join(' ')}`)

const labelOf = (a: ReturnType<typeof analyze>, text: string) => {
  const u = a.units.find((u) => u.text === text)
  return u?.pattern?.entry.label ?? u?.grammar?.label
}

// Everyday spoken Korean, the kind found in dramas and chats.
const SPOKEN = [
  '어디 가?',
  '어제 친구랑 영화를 봤는데 진짜 재미있었어.',
  '너 왜 아직도 안 자?',
  '배고프면 라면이라도 끓여 먹어.',
  '그 사람 진짜 웃기지 않아?',
  '내일 시간 있으면 같이 밥 먹을래요?',
  '이거 얼마예요?',
  '미안해, 내가 잘못했어.',
  '비가 와서 집에 있을 수밖에 없었잖아요.',
  '엄마한테 전화해 봤어?',
  '괜찮아, 걱정하지 마.',
  '무슨 일이 있어도 포기하지 않을 거야.',
  '저는 커피보다 차를 더 좋아해요.',
  '그러니까 내 말을 들었어야지!',
  '오늘따라 왜 이렇게 피곤하지?',
  '혹시 이 근처에 지하철역이 있나요?',
  '그게 무슨 뜻이에요?',
  '네가 먼저 연락했으면 좋겠어.',
  '이 노래 들으면 옛날 생각이 나.',
  '선생님께서 내일 수업이 없다고 하셨어요.',
]

describe('canonical', () => {
  it('folds the shapes of an ending together', () => {
    expect(canonical('았', 'EP')).toBe('었')
    expect(canonical('아서', 'EC')).toBe('어서')
    expect(canonical('으면', 'EC')).toBe('면')
    expect(canonical('습니다', 'EF')).toBe('ㅂ니다')
    expect(canonical('ᆸ니다', 'EF')).toBe('ㅂ니다')
    expect(canonical('을', 'ETM')).toBe('ㄹ')
    expect(canonical('는', 'ETM')).toBe('는')
    expect(canonical('는데', 'EC')).toBe('ㄴ데')
    expect(canonical('으로', 'JKB')).toBe('로')
    expect(canonical('을', 'JKO')).toBe('을')
  })
})

describe('analyze', () => {
  it('splits 한국어를 공부해요 like Mirinae', () => {
    const a = run('한국어를 공부해요')
    expect(a.units.map((u) => u.text)).toEqual(['한국어', '를', '공부하', '어요'])
    expect(a.units[2]).toMatchObject({ tag: 'VV', lemma: '공부하다', label: '하다-Verb' })
    expect(a.units[2].senses[0][0]).toMatch(/study/)
    expect(labelOf(a, '를')).toBe('Object')
    expect(labelOf(a, '어요')).toBe('Polite Informal')
    expect(shape(a)).toEqual(['1:object:한국어를', '1:verb:공부해요'])
  })

  it('groups modifiers and particles into phrases', () => {
    const a = run('학생은 선생님의 질문에 대답을 했다.')
    expect(a.units.find((u) => u.text === '선생님')?.senses.length).toBeGreaterThan(0)
    expect(shape(a)).toEqual(['1:topic:학생은', '1:adverbial:선생님의 질문에', '1:object:대답을', '1:verb:했다.'])
  })

  it('reads 수 있다 as one grammar point and adds clauses', () => {
    const a = run('공부하셨다고 해서 다 이해할 수 있는 것은 아닙니다.')
    expect(labelOf(a, '다고')).toBe('Even Though / Just because')
    expect(labelOf(a, 'ㄹ')).toBe('Can Do')
    expect(labelOf(a, 'ㅂ니다')).toBe('Formal Statement')
    expect(shape(a)).toEqual([
      '1:subordinate:공부하셨다고 해서',
      '1:topic:다 이해할 수 있는 것은',
      '1:adjective:아닙니다.',
      '2:main:다 이해할 수 있는 것은 아닙니다.',
    ])
  })

  it('tells -잖아요 ("you know") from -지 않아요 ("not")', () => {
    // Kiwi keeps 잖아요 whole in some sentences and splits it into 지 + 않 + 어요 in others.
    const labels = (s: string) => run(s).units.map((u) => u.pattern?.entry.label ?? u.grammar?.label)
    expect(labels('내가 말했잖아요.')).toContain('You Know')
    expect(labels('민준 씨가 기다리잖아요.')).toContain('You Know')
    expect(labels('학교에 가지 않아요.')).toContain('Not')
    expect(labels('학교에 가지 않아요.')).not.toContain('You Know')
  })

  it('treats a connector at the very end as the end of the sentence', () => {
    const a = run('너는 무슨 음악을 주로 듣니?')
    expect(a.units.find((u) => u.text === '니')?.tag).toBe('EF')
    expect(a.phrases.some((p) => p.kind === 'subordinate')).toBe(false)
  })

  it('marks irregular stems and never labels a part "Other"', () => {
    expect(run('오늘 너무 더워요.').units.find((u) => u.lemma === '덥다')).toMatchObject({ irregular: true, label: 'Adjective' })
    expect(run('공원을 걸었어.').units.find((u) => u.lemma === '걷다')).toMatchObject({ irregular: true, label: 'Verb' })
    const others = SPOKEN.flatMap((s) => run(s).units.filter((u) => u.label === 'Other').map((u) => `${u.text}/${u.tag}`))
    expect(others).toEqual([])
  })

  it('explains everyday spoken Korean', () => {
    let grammar = 0
    let explained = 0
    let words = 0
    let glossed = 0
    const missing: string[] = []
    for (const s of SPOKEN) {
      for (const u of run(s).units) {
        if (u.kind === 'grammar') {
          grammar++
          if (u.grammar || u.pattern || u.senses.length) explained++
          else missing.push(`${u.text}/${u.tag}`)
        } else if (u.kind === 'content') {
          words++
          if (u.senses.length) glossed++
          else missing.push(`${u.lemma}/${u.tag}`)
        }
      }
    }
    console.log(
      `Spoken sample: ${explained}/${grammar} grammar parts explained, ${glossed}/${words} words with a meaning. Missing:`,
      missing,
    )
    expect(explained / grammar).toBeGreaterThan(0.9)
    expect(glossed / words).toBeGreaterThan(0.9)
  })
})
