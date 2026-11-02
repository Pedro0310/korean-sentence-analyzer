/// <reference lib="webworker" />
// Runs Kiwi (kiwi-nlp, WebAssembly) off the main thread. The model (~88 MB) is
// downloaded once and kept in Cache Storage, so later visits start offline.

import { KiwiBuilder, type Kiwi, type TokenInfo } from 'kiwi-nlp'
import wasmUrl from 'kiwi-nlp/dist/kiwi-wasm.wasm?url'
import { toMorphemes } from './morphemes.ts'
import type { Morpheme } from './types.ts'

// The model release matching kiwi-nlp 0.24.1. multi.dict and nounchr.mdl are left
// out: they made no difference on test sentences and would add 22 MB.
const MODEL_FILES = ['combiningRule.txt', 'cong.mdl', 'default.dict', 'dialect.dict', 'extract.mdl', 'sj.morph', 'typo.dict']
const CACHE = 'kiwi-model-0.24.1'

export type Request =
  | { id: number; type: 'sentences'; text: string }
  | { id: number; type: 'lines'; lines: string[] }

export type Response =
  | { type: 'progress'; loaded: number; total: number }
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { id: number; type: 'sentences'; sentences: { text: string; morphemes: Morpheme[] }[] }
  | { id: number; type: 'lines'; lines: Morpheme[][] }

const post = (message: Response) => self.postMessage(message)

async function download(): Promise<Record<string, Uint8Array>> {
  // Without Cache Storage (some private windows) the model is simply downloaded each visit.
  const cache = await caches.open(CACHE).catch((e) => {
    console.warn('Kiwi model cache unavailable:', String(e))
    return null
  })
  const base = new URL(`${import.meta.env.BASE_URL}model/`, self.location.origin)
  const responses = await Promise.all(
    MODEL_FILES.map(async (name) => {
      const url = new URL(name, base).href
      const cached = await cache?.match(url)
      if (cached) return { name, url, response: cached, fromCache: true }
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${name}: HTTP ${response.status}. Is public/model/ there? See README.`)
      return { name, url, response, fromCache: false }
    }),
  )

  const total = responses.reduce((sum, r) => sum + Number(r.response.headers.get('content-length') ?? 0), 0)
  let loaded = 0
  const files: Record<string, Uint8Array> = {}
  await Promise.all(
    responses.map(async ({ name, url, response, fromCache }) => {
      const reader = response.body!.getReader()
      const chunks: Uint8Array[] = []
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        loaded += value.length
        post({ type: 'progress', loaded, total })
      }
      const data = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
      let offset = 0
      for (const c of chunks) {
        data.set(c, offset)
        offset += c.length
      }
      files[name] = data
      if (!fromCache) await cache?.put(url, new Response(data)).catch((e) => console.warn(`Couldn't cache ${name}:`, e))
    }),
  )
  return files
}

const kiwiReady: Promise<Kiwi> = (async () => {
  const [builder, modelFiles] = await Promise.all([KiwiBuilder.create(wasmUrl), download()])
  return builder.build({ modelFiles, modelType: 'cong', loadMultiDict: false })
})()

kiwiReady.then(
  () => post({ type: 'ready' }),
  (e: Error) => post({ type: 'error', message: e.message }),
)

/** Splits text into sentences with Kiwi; each keeps morphemes relative to its own text. */
function sentences(kiwi: Kiwi, text: string) {
  const groups = new Map<number, TokenInfo[]>()
  for (const token of kiwi.tokenize(text)) {
    const key = token.lineNumber * 100_000 + token.sentPosition
    groups.set(key, [...(groups.get(key) ?? []), token])
  }
  return [...groups.values()].map((tokens) => {
    const start = tokens[0].position
    const end = Math.max(...tokens.map((t) => t.position + t.length))
    return { text: text.slice(start, end), morphemes: toMorphemes(tokens, start) }
  })
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data
  const kiwi = await kiwiReady
  if (request.type === 'sentences') {
    post({ id: request.id, type: 'sentences', sentences: sentences(kiwi, request.text) })
  } else {
    post({ id: request.id, type: 'lines', lines: request.lines.map((line) => toMorphemes(kiwi.tokenize(line))) })
  }
}
