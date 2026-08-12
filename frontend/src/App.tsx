import React, { useState, useCallback, useEffect } from 'react'
import type { SearchRequest } from './types'
import { SearchForm } from './components/search/SearchForm'
import { SavedSearches } from './components/search/SavedSearches'
import { SearchHistory } from './components/search/SearchHistory'
import { PriceAlertManager } from './components/search/PriceAlertManager'
import { ProgressBar } from './components/results/ProgressBar'
import { ResultsList } from './components/results/ResultsList'
import { PriceChart } from './components/charts/PriceChart'
import { PriceCalendar } from './components/charts/PriceCalendar'
import { FlightMap } from './components/charts/FlightMap'
import { PriceHistoryChart } from './components/charts/PriceHistoryChart'
import { ExportCSV } from './components/results/ExportCSV'
import { ShareResults } from './components/results/ShareResults'
import { ResultsSkeleton } from './components/ui/Skeleton'
import { KeyboardShortcutsHelp } from './components/ui/KeyboardShortcutsHelp'
import { useSearch } from './hooks/useSearch'
import { useTheme } from './hooks/useTheme'
import { useSearchHistory } from './hooks/useSearchHistory'
import { usePriceAlert } from './hooks/usePriceAlert'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { SearchHistoryEntry } from './hooks/useSearchHistory'

const App: React.FC = () => {
  const { search, cancel, progress, results, isSearching, error } = useSearch()
  const { theme, toggleTheme } = useTheme()
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const { alerts, permissionGranted, requestPermission, addAlert, removeAlert, checkAlerts, resetAlert } = usePriceAlert()
  const [lastRequest, setLastRequest] = useState<SearchRequest | null>(null)
  const [showChart, setShowChart] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleSearch = useCallback((request: SearchRequest) => {
    setLastRequest(request)
    search(request)
  }, [search])

  const handleSearchComplete = useCallback(() => {
    if (lastRequest && results.length > 0) {
      addToHistory(lastRequest, results.length)
    }
  }, [lastRequest, results, addToHistory])

  const handleHistorySelect = useCallback((entry: SearchHistoryEntry) => {
    setLastRequest(entry.request)
    search(entry.request)
  }, [search])

  useEffect(() => {
    if (progress?.status === 'completed' && results.length > 0) {
      handleSearchComplete()
      checkAlerts(results)
    }
  }, [progress?.status, results.length, handleSearchComplete, checkAlerts])

  useKeyboardShortcuts([
    {
      key: '?',
      action: () => document.querySelector('[aria-label="Scorciatoie tastiera"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })),
      description: 'Mostra aiuto scorciatoie'
    },
    {
      key: 'Escape',
      action: () => {
        const openModal = document.querySelector('.fixed.inset-0')
        if (openModal) {
          const closeBtn = openModal.querySelector('[aria-label="Chiudi"]') as HTMLButtonElement
          closeBtn?.click()
        }
      },
      description: 'Chiudi modali'
    }
  ])

  const handleRefresh = useCallback(() => {
    if (lastRequest) {
      search(lastRequest)
    }
  }, [lastRequest, search])

  return (
    <div className="min-h-screen">
      {/* Header con gradiente */}
      <header className="sticky top-0 z-40 glass-effect border-b dark:border-white/10 border-gray-200">
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
              <p className="text-xs dark:text-gray-400 text-gray-600 mt-0.5">
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

            {/* Theme toggle */}
            <KeyboardShortcutsHelp />
            <button
              onClick={toggleTheme}
              className="button-secondary p-2 rounded-xl"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-ryanair-yellow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                </svg>
              )}
            </button>
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

        {/* Cronologia ricerche */}
        {history.length > 0 && !isSearching && results.length === 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <SearchHistory
              history={history}
              onSelect={handleHistorySelect}
              onRemove={removeFromHistory}
              onClear={clearHistory}
            />
          </div>
        )}

        {/* Alert prezzo */}
        {!isSearching && results.length === 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <PriceAlertManager
              alerts={alerts}
              permissionGranted={permissionGranted}
              onAdd={addAlert}
              onRemove={removeAlert}
              onRequestPermission={requestPermission}
              onReset={resetAlert}
            />
          </div>
        )}

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
                <p className="text-sm dark:text-red-300/80 text-red-600 mt-1">{error}</p>
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

        {/* Skeleton loading */}
        {isSearching && results.length === 0 && (
          <div className="animate-fade-in">
            <ResultsSkeleton count={4} />
          </div>
        )}

        {/* Risultati */}
        {results.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            {/* Toggle viste e azioni */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowChart(!showChart)}
                className={`button-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${showChart ? 'border-ryanair-yellow/50 text-ryanair-yellow' : 'dark:text-gray-300 text-gray-700'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Grafico
              </button>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`button-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${showCalendar ? 'border-ryanair-yellow/50 text-ryanair-yellow' : 'dark:text-gray-300 text-gray-700'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendario
              </button>
              <button
                onClick={() => setShowMap(!showMap)}
                className={`button-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${showMap ? 'border-ryanair-yellow/50 text-ryanair-yellow' : 'dark:text-gray-300 text-gray-700'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mappa
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`button-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${showHistory ? 'border-ryanair-yellow/50 text-ryanair-yellow' : 'dark:text-gray-300 text-gray-700'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Storico
              </button>
              <div className="flex-1"></div>
              <ExportCSV results={results} />
              <ShareResults request={lastRequest} />
            </div>

            {/* Grafico */}
            {showChart && (
              <div className="animate-slide-up">
                <PriceChart results={results} />
              </div>
            )}

            {/* Calendario */}
            {showCalendar && (
              <div className="animate-slide-up">
                <PriceCalendar results={results} />
              </div>
            )}

            {/* Mappa */}
            {showMap && (
              <div className="animate-slide-up">
                <FlightMap results={results} />
              </div>
            )}

            {/* Storico prezzi */}
            {showHistory && (
              <div className="animate-slide-up">
                <PriceHistoryChart
                  origin={lastRequest?.origins[0]}
                  destination={lastRequest?.destinations[0]}
                  days={30}
                />
              </div>
            )}

            {/* Lista risultati */}
            <ResultsList results={results} onRefresh={handleRefresh} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t dark:border-white/5 border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs dark:text-gray-500 text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <span>Strumento non ufficiale. Non affiliato con Ryanair.</span>
            </div>
            <div className="flex items-center gap-4 text-xs dark:text-gray-500 text-gray-500">
              <span>I prezzi possono cambiare</span>
              <span className="hidden sm:inline">•</span>
              <a href="https://github.com/2BAD/ryanair" target="_blank" rel="noopener noreferrer" className="dark:hover:text-ryanair-yellow hover:text-ryanair-yellow transition-colors">
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
