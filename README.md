# 문장 분석기 · Korean sentence analyzer

A Mirinae-style breakdown of any Korean sentence you give it: each word split into
morphemes with part of speech and meaning, brackets grouping phrases and clauses,
grammar notes with examples from your other sentences, and text-to-speech.

- **Type or paste** a sentence or a whole paragraph (it is split into sentences).
- **Import subtitles** (.srt or .vtt, UTF-8 or EUC-KR). Add the same episode's English
  subtitles and each line gets its translation, matched by timing.
- Everything is analysed in the browser and saved there (IndexedDB). Nothing is sent anywhere.

## Setup

```sh
npm install
npm run dev        # http://localhost:5174
```

Two data folders are git-ignored and need fetching once:

**The Kiwi model** (`public/model/`, ~88 MB). Kiwi is the morphological analyzer; it runs in the
browser as WebAssembly (`kiwi-nlp`), and the browser keeps the model in Cache Storage after the
first visit. The model version must match `kiwi-nlp` in package.json (0.24.1):

```sh
curl -LO https://github.com/bab2min/Kiwi/releases/download/v0.24.1/kiwi_model_v0.24.1_base.tgz
mkdir -p public/model && tar xzf kiwi_model_v0.24.1_base.tgz -C public/model --strip-components=3
rm public/model/multi.dict public/model/nounchr.mdl kiwi_model_v0.24.1_base.tgz   # not used, 22 MB
```

**The dictionary** (`public/data/dictionary.json`, 9 MB, built from the 350 MB XML dump in
`data/krdict-xml/`): 한국어기초사전, 54,828 entries, 50,031 of them single words.

```sh
mkdir -p data/krdict-xml && cd data/krdict-xml
for f in 5000 10000 15000 20000 25000 30000 35000 40000 45000 50000 51947; do
  curl -LO https://raw.githubusercontent.com/spellcheck-ko/korean-dict-nikl-krdict/master/$f.xml
done
cd ../.. && npm run dictionary
```

(or download a newer dump from [krdict.korean.go.kr](https://krdict.korean.go.kr), "사전 내려받기", XML).

Keys: ← / → previous and next sentence, R random, Esc closes the grammar panel.

## How it works

- `src/lib/kiwi.worker.ts`: loads Kiwi and its model in a Web Worker, splits text into sentences and
  morphemes. Each saved sentence keeps its morphemes, so it reopens without Kiwi.
- `src/lib/analyze.ts`: groups morphemes into display units (공부 + 하 → 공부하, 하다-Verb), looks up
  meanings in the dictionary, matches grammar notes and multi-word patterns (-고 있다, -ㄹ 수 있다,
  -잖아요), and chunks the sentence into phrases (particles name the phrase they close; connectors
  end subordinate clauses).
- `src/data/grammar.ts`: hand-written grammar notes, keyed by canonical form so 았/었/였 share one.
  Forms without a note fall back to the dictionary's own entry for the particle or ending.
- `src/lib/subtitles.ts`: SRT/VTT parsing, translation pairing by time, EUC-KR decoding.
- `npm test` runs the analyzer on real Kiwi output (needs `public/model/` and the dictionary) and
  reports how much of a sample of spoken Korean it can explain.

Known limit: Kiwi picks one reading of ambiguous words, and is sometimes wrong (들어요 as 들다
"lift" rather than 듣다 "listen"; 사는 as 사다 "buy" rather than 살다 "live").

## Credits

Meanings come from 한국어기초사전 (Korean Learners' Dictionary), National Institute of Korean
Language, under CC BY-SA 2.0 KR. Morphological analysis by [Kiwi](https://github.com/bab2min/Kiwi)
(LGPL-3.0). Grammar notes were written for this project.
