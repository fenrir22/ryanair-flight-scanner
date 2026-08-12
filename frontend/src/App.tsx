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
    <div className="min-h-screen">
      {/* Header con gradiente */}
      <header className="sticky top-0 z-40 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Logo animato */}
            <div className="relative group">
              <div className="absolute inset-0 bg-ryanair-yellow/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-ryanair-yellow to-ryanair-light rounded-xl flex items-center justify-center shadow-glow">
                <svg className="w-6 h-6 text-ryanair-dark" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-gradient">
                Scanner Voli Ryanair
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Trova le combinazioni di date più economiche
              </p>
            </div>

            {/* Stats badge */}
            {results.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-ryanair-yellow/10 border border-ryanair-yellow/20 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-ryanair-yellow font-medium">
                  {results.length} risultati
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Form di ricerca */}
        <div className="animate-fade-in">
          <SearchForm onSearch={handleSearch} isSearching={isSearching} />
        </div>

        {/* Ricerche salvate */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <SavedSearches userId="default" />
        </div>

        {/* Errori */}
        {error && (
          <div className="animate-slide-up bg-red-500/10 border border-red-500/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-400">Errore</p>
                <p className="text-sm text-red-300/80 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {progress && progress.status !== 'pending' && (
          <div className="animate-slide-up">
            <ProgressBar progress={progress} onCancel={cancel} />
          </div>
        )}

        {/* Risultati */}
        {results.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            {/* Toggle grafico */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowChart(!showChart)}
                className="button-secondary px-4 py-2 rounded-xl text-sm text-gray-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {showChart ? 'Nascondi grafico' : 'Mostra grafico prezzi'}
              </button>
            </div>

            {/* Grafico */}
            {showChart && (
              <div className="animate-slide-up">
                <PriceChart results={results} />
              </div>
            )}

            {/* Lista risultati */}
            <ResultsList results={results} onRefresh={handleRefresh} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <span>Strumento non ufficiale. Non affiliato con Ryanair.</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>I prezzi possono cambiare</span>
              <span className="hidden sm:inline">•</span>
              <a href="https://github.com/2BAD/ryanair" target="_blank" rel="noopener noreferrer" className="hover:text-ryanair-yellow transition-colors">
                Powered by @2bad/ryanair
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
