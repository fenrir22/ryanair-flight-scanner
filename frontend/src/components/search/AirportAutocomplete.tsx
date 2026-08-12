import React from 'react'

interface AirportAutocompleteProps {
  label: string
  icon?: React.ReactNode
  selected: string[]
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchResults: { code: string; name: string; cityName: string }[]
  isSearching: boolean
  placeholder?: string
}

export const AirportAutocomplete: React.FC<AirportAutocompleteProps> = ({
  label,
  icon,
  selected,
  onAdd,
  onRemove,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  placeholder = 'Cerca aeroporto...'
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Placeholder dinamico
  const dynamicPlaceholder = selected.length > 0 
    ? 'Aggiungi un altro aeroporto...' 
    : placeholder

  return (
    <div className="relative">
      <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600 mb-2">
        {icon}
        {label}
        {selected.length > 0 && (
          <span className="text-xs text-ryanair-yellow/60">
            ({selected.length} selezionat{selected.length === 1 ? 'o' : 'i'})
          </span>
        )}
      </label>

      {/* Tag aeroporti selezionati */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map(code => (
            <div
              key={code}
              className="group flex items-center gap-2 px-3 py-1.5 bg-ryanair-yellow/10 border border-ryanair-yellow/20 rounded-lg text-sm animate-slide-up"
            >
              <span className="font-mono font-bold text-ryanair-yellow">{code}</span>
              <button
                onClick={() => onRemove(code)}
                className="dark:text-gray-500 text-gray-400 hover:text-red-400 transition-colors"
                aria-label={`Rimuovi ${code}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input di ricerca */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={dynamicPlaceholder}
          className="input-modern w-full px-4 py-3 rounded-xl dark:text-gray-100 text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 text-sm"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 animate-spin text-ryanair-yellow" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown risultati */}
      {isOpen && searchQuery.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 dark:bg-gray-900/95 bg-white/95 backdrop-blur-xl border dark:border-white/10 border-gray-200 rounded-xl shadow-card overflow-hidden animate-slide-up">
          <div className="max-h-64 overflow-y-auto">
            {!isSearching && searchResults.length === 0 && (
              <div className="px-4 py-3 dark:text-gray-500 text-gray-400 text-sm text-center">
                Nessun aeroporto trovato
              </div>
            )}
            {searchResults.map((airport, index) => (
              <button
                key={airport.code}
                onClick={() => {
                  onAdd(airport.code)
                  setSearchQuery('')
                  setTimeout(() => {
                    inputRef.current?.focus()
                  }, 0)
                }}
                disabled={selected.includes(airport.code)}
                className="w-full text-left px-4 py-3 dark:hover:bg-white/5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm border-b dark:border-white/5 border-gray-100 last:border-0 transition-colors flex items-center gap-3"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="font-mono font-bold text-ryanair-yellow text-base">{airport.code}</span>
                <div className="flex-1 min-w-0">
                  <div className="dark:text-gray-200 text-gray-800 truncate">{airport.name}</div>
                  <div className="dark:text-gray-500 text-gray-500 text-xs">{airport.cityName}</div>
                </div>
                {selected.includes(airport.code) && (
                  <svg className="w-5 h-5 dark:text-gray-600 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
