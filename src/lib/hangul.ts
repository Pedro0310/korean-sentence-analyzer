// Kiwi writes contracted endings with conjoining final consonants (ᆫ, ᆯ, ᆸ…),
// which render oddly on their own. These are swapped for the compatibility
// jamo learners know (ㄴ, ㄹ, ㅂ…).
const FINALS = 'ᆨᆩᆪᆫᆬᆭᆮᆯᆰᆱᆲᆳᆴᆵᆶᆷᆸᆹᆺᆻᆼᆽᆾᆿᇀᇁᇂ'
const COMPAT = 'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'

export function toCompat(form: string): string {
  return [...form].map((ch) => {
    const i = FINALS.indexOf(ch)
    return i === -1 ? ch : COMPAT[i]
  }).join('')
}

/**
 * One spelling per grammar form, for looking up notes: endings change shape
 * with the stem (먹었다/갔다, 먹으면/가면, 먹습니다/갑니다) but are the same
 * grammar. Particles keep their spelling; their notes list both shapes.
 */
export function canonical(form: string, tag: string): string {
  let f = toCompat(form)
  if (tag.startsWith('E')) {
    if (f.length > 1 && f.startsWith('으')) f = f.slice(1)
    f = f.replace(/^[아여]/, '어').replace(/^[았였]/, '었')
    f = f.replace(/^습니/, 'ㅂ니').replace(/^읍시/, 'ㅂ시')
    if (tag === 'ETM' || tag === 'ETN') {
      f = { 은: 'ㄴ', 을: 'ㄹ', 음: 'ㅁ', 는다는: 'ㄴ다는' }[f] ?? f
    } else {
      // 은데/는데 → ㄴ데, 을까 → ㄹ까, 는다고 → ㄴ다고 (a lone 은/는 is left alone).
      f = f.replace(/^은(?=.)/, 'ㄴ').replace(/^을(?=.)/, 'ㄹ').replace(/^는(?=.)/, 'ㄴ')
    }
  } else if (tag === 'JKB' && f.startsWith('으로')) {
    f = f.slice(1)
  }
  return f
}
