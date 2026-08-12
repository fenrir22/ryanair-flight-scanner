import React from 'react'

interface AirportAutocompleteProps {
  label: string
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
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>

      <div className="flex flex-wrap gap-1 mb-2">
        {selected.map(code => (
          <span
            key={code}
            className="inline-flex items-center gap-1 px-2 py-1 bg-ryanair-blue/30 text-ryanair-yellow text-xs rounded-md border border-ryanair-blue/50"
          >
            {code}
            <button
              onClick={() => onRemove(code)}
              className="text-gray-400 hover:text-red-400 ml-1"
            >
              &times;
            </button>
          </span>
        ))}
      </div>

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
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 focus:border-ryanair-yellow text-sm"
      />

      {isOpen && searchQuery.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {isSearching && (
            <div className="px-3 py-2 text-gray-500 text-sm">Ricerca in corso...</div>
          )}
          {!isSearching && searchResults.length === 0 && (
            <div className="px-3 py-2 text-gray-500 text-sm">Nessun aeroporto trovato</div>
          )}
          {searchResults.map(airport => (
            <button
              key={airport.code}
              onClick={() => {
                onAdd(airport.code)
                setSearchQuery('')
                setIsOpen(false)
              }}
              disabled={selected.includes(airport.code)}
              className="w-full text-left px-3 py-2 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm border-b border-gray-700/50 last:border-0"
            >
              <span className="font-mono text-ryanair-yellow">{airport.code}</span>
              <span className="text-gray-300 ml-2">{airport.name}</span>
              <span className="text-gray-500 ml-1">({airport.cityName})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
