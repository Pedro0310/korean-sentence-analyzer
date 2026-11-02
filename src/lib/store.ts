import { useCallback, useEffect, useState } from 'react'
import type { Collection } from './types.ts'

// Collections live in IndexedDB, in this browser only: localStorage would run out
// of room after a few subtitle files.

const DB = 'ksa'
const STORE = 'collections'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const newId = () => crypto.randomUUID().slice(0, 8)

export function useLibrary() {
  const [collections, setCollections] = useState<Collection[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    run('readonly', (s) => s.getAll() as IDBRequest<Collection[]>)
      .then((all) => setCollections(all.sort((a, b) => a.createdAt - b.createdAt)))
      .catch(() => {
        // Private windows can block IndexedDB; the app still works for this visit.
        setError("Your sentences can't be saved in this browser window, so they will be lost when you close it.")
        setCollections([])
      })
  }, [])

  const save = useCallback((collection: Collection) => {
    setCollections((all) => {
      const rest = (all ?? []).filter((c) => c.id !== collection.id)
      return [...rest, collection].sort((a, b) => a.createdAt - b.createdAt)
    })
    run('readwrite', (s) => s.put(collection)).catch(() => setError('Saving failed; changes last until you close this window.'))
  }, [])

  const remove = useCallback((id: string) => {
    setCollections((all) => (all ?? []).filter((c) => c.id !== id))
    run('readwrite', (s) => s.delete(id)).catch(() => {})
  }, [])

  return { collections, error, save, remove }
}
