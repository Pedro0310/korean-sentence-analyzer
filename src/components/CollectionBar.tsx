import type { Collection } from '../lib/types.ts'

interface Props {
  collections: Collection[]
  collection: Collection
  position: number
  onOpen: (collectionId: string, itemId: string) => void
  onDeleteItem: () => void
  onDeleteCollection: () => void
}

const buttonClass =
  'flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-divider bg-panel px-3 text-sm font-medium text-body hover:bg-row'

/** Which collection is open, and moving through its sentences. */
export default function CollectionBar({ collections, collection, position, onOpen, onDeleteItem, onDeleteCollection }: Props) {
  const items = collection.items
  const step = (delta: number) => onOpen(collection.id, items[(position + delta + items.length) % items.length].id)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={collection.id}
        onChange={(e) => {
          const next = collections.find((c) => c.id === e.target.value)
          if (next?.items[0]) onOpen(next.id, next.items[0].id)
        }}
        aria-label="Collection"
        className="h-11 max-w-[60vw] min-w-0 cursor-pointer truncate rounded-lg border border-divider bg-panel px-3 text-sm font-medium sm:max-w-xs"
      >
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title} ({c.items.length})
          </option>
        ))}
      </select>
      <details className="relative">
        <summary
          className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-lg text-muted hover:bg-row"
          aria-label="More"
        >
          ⋯
        </summary>
        <div className="absolute left-0 z-20 mt-1 flex w-56 flex-col rounded-lg border border-divider bg-panel p-1 shadow-panel">
          <button type="button" onClick={onDeleteItem} className="cursor-pointer rounded-md px-3 py-2 text-left text-sm hover:bg-row">
            Delete this sentence
          </button>
          <button
            type="button"
            onClick={onDeleteCollection}
            className="cursor-pointer rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-row"
          >
            {`Delete “${collection.title}”`}
          </button>
        </div>
      </details>
      <div className="ml-auto flex items-center gap-2">
        <button type="button" className={buttonClass} onClick={() => step(-1)} aria-label="Previous" title="←">
          ‹
        </button>
        <span className="min-w-16 text-center font-mono text-xs text-muted">
          {position + 1} / {items.length}
        </span>
        <button type="button" className={buttonClass} onClick={() => step(1)} aria-label="Next" title="→">
          ›
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onOpen(collection.id, items[Math.floor(Math.random() * items.length)].id)}
          title="R"
        >
          Random
        </button>
      </div>
    </div>
  )
}
