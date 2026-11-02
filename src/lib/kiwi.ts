import { useSyncExternalStore } from 'react'
import type { Request, Response } from './kiwi.worker.ts'
import type { Morpheme } from './types.ts'

// One Kiwi worker for the whole app, started on first import.

export type KiwiState =
  | { status: 'loading'; loaded: number; total: number }
  | { status: 'ready' }
  | { status: 'error'; message: string }

let state: KiwiState = { status: 'loading', loaded: 0, total: 0 }
const listeners = new Set<() => void>()
const pending = new Map<number, (response: Response) => void>()
let nextId = 1

const worker = new Worker(new URL('./kiwi.worker.ts', import.meta.url), { type: 'module' })
worker.onmessage = (event: MessageEvent<Response>) => {
  const message = event.data
  if ('id' in message) {
    pending.get(message.id)?.(message)
    pending.delete(message.id)
    return
  }
  state =
    message.type === 'progress'
      ? { status: 'loading', loaded: message.loaded, total: message.total }
      : message.type === 'ready'
        ? { status: 'ready' }
        : { status: 'error', message: message.message }
  listeners.forEach((notify) => notify())
}
worker.onerror = (e) => {
  state = { status: 'error', message: e.message || 'The analyzer failed to start.' }
  listeners.forEach((notify) => notify())
}

// Omit applied to each member of the union, not to the union as a whole.
type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never

function ask<T extends Response>(request: WithoutId<Request>): Promise<T> {
  const id = nextId++
  return new Promise((resolve) => {
    pending.set(id, (response) => resolve(response as T))
    worker.postMessage({ ...request, id } as Request)
  })
}

/** Splits pasted text into sentences and analyses each. */
export async function analyzeText(text: string): Promise<{ text: string; morphemes: Morpheme[] }[]> {
  const response = await ask<Extract<Response, { type: 'sentences' }>>({ type: 'sentences', text })
  return response.sentences
}

/** Analyses each line as it is (subtitle cues stay whole). */
export async function analyzeLines(lines: string[]): Promise<Morpheme[][]> {
  const response = await ask<Extract<Response, { type: 'lines' }>>({ type: 'lines', lines })
  return response.lines
}

export function useKiwi(): KiwiState {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => state,
  )
}
