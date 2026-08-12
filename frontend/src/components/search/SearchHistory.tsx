import React from 'react'
import type { SearchHistoryEntry } from '../../hooks/useSearchHistory'

interface SearchHistoryProps {
  history: SearchHistoryEntry[]
  onSelect: (entry: SearchHistoryEntry) => void
  onRemove: (id: string) => void
  onClear: () => void
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onSelect, onRemove, onClear }) => {
  if (history.length === 0) return null

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Adesso'
    if (hours < 24) return `${hours}h fa`
    if (days < 7) return `${days}g fa`
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
      <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-ryanair-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">Ricerche Recenti</h3>
              <p className="text-xs dark:text-gray-500 text-gray-500">Riapri una ricerca precedente</p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Cancella tutto
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {history.slice(0, 6).map(entry => (
            <div
              key={entry.id}
              className="group relative overflow-hidden rounded-xl cursor-pointer"
              onClick={() => onSelect(entry)}
            >
              <div className="absolute inset-0 dark:bg-gray-800/50 bg-gray-100 group-hover:dark:bg-gray-700/50 group-hover:bg-gray-200 transition-colors"></div>
              <div className="absolute inset-0 border dark:border-white/5 border-gray-200 rounded-xl group-hover:border-ryanair-yellow/30 transition-colors"></div>

              <div className="relative p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ryanair-yellow text-sm">
                      {entry.request.origins.join(',')}
                    </span>
                    <svg className="w-3 h-3 dark:text-gray-500 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="font-mono font-bold text-ryanair-yellow text-sm">
                      {entry.request.destinations.join(',')}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(entry.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                    aria-label="Rimuovi"
                  >
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs dark:text-gray-400 text-gray-600">
                  <span>{entry.request.departureFrom}</span>
                  {entry.request.tripType === 'round-trip' && (
                    <>
                      <span>→</span>
                      <span>{entry.request.departureTo}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs dark:text-gray-500 text-gray-500">
                    {formatDate(entry.timestamp)}
                  </span>
                  {entry.resultCount !== undefined && (
                    <span className="text-xs text-green-500">
                      {entry.resultCount} risultati
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
