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

  return (
    <div className="relative">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
        {icon}
        {label}
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
                className="text-gray-500 hover:text-red-400 transition-colors"
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
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="input-modern w-full px-4 py-3 rounded-xl text-gray-100 placeholder-gray-500 text-sm"
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
        <div className="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-card overflow-hidden animate-slide-up">
          <div className="max-h-64 overflow-y-auto">
            {!isSearching && searchResults.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                Nessun aeroporto trovato
              </div>
            )}
            {searchResults.map((airport, index) => (
              <button
                key={airport.code}
                onClick={() => {
                  onAdd(airport.code)
                  setSearchQuery('')
                  setIsOpen(false)
                }}
                disabled={selected.includes(airport.code)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-sm border-b border-white/5 last:border-0 transition-colors flex items-center gap-3"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="font-mono font-bold text-ryanair-yellow text-base">{airport.code}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-200 truncate">{airport.name}</div>
                  <div className="text-gray-500 text-xs">{airport.cityName}</div>
                </div>
                {selected.includes(airport.code) && (
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
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
