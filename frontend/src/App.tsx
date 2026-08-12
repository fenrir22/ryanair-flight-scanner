import React, { useState, useCallback } from 'react'
import type { SearchRequest } from './types'
import { SearchForm } from './components/search/SearchForm'
import { SavedSearches } from './components/search/SavedSearches'
import { ProgressBar } from './components/results/ProgressBar'
import { ResultsList } from './components/results/ResultsList'
import { PriceChart } from './components/charts/PriceChart'
import { useSearch } from './hooks/useSearch'

const App: React.FC = () => {
  const { search, cancel, progress, results, isSearching, error } = useSearch()
  const [lastRequest, setLastRequest] = useState<SearchRequest | null>(null)
  const [showChart, setShowChart] = useState(false)

  const handleSearch = useCallback((request: SearchRequest) => {
    setLastRequest(request)
    search(request)
  }, [search])

  const handleRefresh = useCallback(() => {
    if (lastRequest) {
      search(lastRequest)
    }
  }, [lastRequest, search])

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-ryanair-yellow rounded-lg flex items-center justify-center">
            <span className="text-ryanair-dark font-bold text-sm">RF</span>
          </div>
          <h1 className="text-xl font-bold text-gray-100">
            Scanner Voli Ryanair
          </h1>
          <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
            Trova le combinazioni di date più economiche
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <SearchForm onSearch={handleSearch} isSearching={isSearching} />

        <SavedSearches userId="default" />

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {progress && progress.status !== 'pending' && (
          <ProgressBar progress={progress} onCancel={cancel} />
        )}

        {results.length > 0 && (
          <>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowChart(!showChart)}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
              >
                {showChart ? 'Nascondi grafico' : 'Mostra grafico prezzi'}
              </button>
            </div>

            {showChart && <PriceChart results={results} />}

            <ResultsList results={results} onRefresh={handleRefresh} />
          </>
        )}

        {!isSearching && results.length === 0 && !progress && (
          <div className="text-center py-16 text-gray-600">
            <div className="text-4xl mb-4">&#9992;</div>
            <p>Cerca voli per trovare le combinazioni di date più economiche</p>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-gray-600">
          <p>Strumento non ufficiale. Non affiliato con Ryanair. I prezzi possono cambiare.</p>
          <p className="mt-1">Powered by @2bad/ryanair</p>
        </div>
      </footer>
    </div>
  )
}

export default App
