import React, { useState } from 'react'
import type { SearchRequest } from '../../types'
import { AirportAutocomplete } from './AirportAutocomplete'
import { useAirportSearch } from '../../hooks/useAirportSearch'

interface SearchFormProps {
  onSearch: (request: SearchRequest) => void
  isSearching: boolean
}

const CURRENCIES = ['EUR', 'GBP', 'PLN', 'SEK', 'NOK', 'DKK', 'CZK', 'HUF', 'CHF']

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isSearching }) => {
  const [origins, setOrigins] = useState<string[]>([])
  const [destinations, setDestinations] = useState<string[]>([])
  const [departureFrom, setDepartureFrom] = useState('')
  const [departureTo, setDepartureTo] = useState('')
  const [minStay, setMinStay] = useState(3)
  const [maxStay, setMaxStay] = useState(7)
  const [passengers, setPassengers] = useState(1)
  const [currency, setCurrency] = useState('EUR')
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip')

  const originSearch = useAirportSearch()
  const destSearch = useAirportSearch()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (origins.length === 0 || destinations.length === 0) return
    if (!departureFrom || !departureTo) return
    if (tripType === 'round-trip' && minStay > maxStay) return

    onSearch({
      origins,
      destinations,
      departureFrom,
      departureTo,
      minStay,
      maxStay,
      passengers,
      currency,
      tripType
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-6">
      <div className="flex gap-4 mb-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="tripType"
            value="round-trip"
            checked={tripType === 'round-trip'}
            onChange={() => setTripType('round-trip')}
            className="w-4 h-4 text-ryanair-yellow bg-gray-800 border-gray-600 focus:ring-ryanair-yellow"
          />
          <span className="text-sm text-gray-300">Andata e ritorno</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="tripType"
            value="one-way"
            checked={tripType === 'one-way'}
            onChange={() => setTripType('one-way')}
            className="w-4 h-4 text-ryanair-yellow bg-gray-800 border-gray-600 focus:ring-ryanair-yellow"
          />
          <span className="text-sm text-gray-300">Solo andata</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AirportAutocomplete
          label="Da"
          selected={origins}
          onAdd={(code) => setOrigins(prev => [...prev, code])}
          onRemove={(code) => setOrigins(prev => prev.filter(c => c !== code))}
          searchQuery={originSearch.query}
          setSearchQuery={originSearch.setQuery}
          searchResults={originSearch.results}
          isSearching={originSearch.isLoading}
          placeholder="Cerca aeroporto di partenza..."
        />

        <AirportAutocomplete
          label="A"
          selected={destinations}
          onAdd={(code) => setDestinations(prev => [...prev, code])}
          onRemove={(code) => setDestinations(prev => prev.filter(c => c !== code))}
          searchQuery={destSearch.query}
          setSearchQuery={destSearch.setQuery}
          searchResults={destSearch.results}
          isSearching={destSearch.isLoading}
          placeholder="Cerca aeroporto di destinazione..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Partenza dal</label>
          <input
            type="date"
            value={departureFrom}
            onChange={(e) => setDepartureFrom(e.target.value)}
            min={today}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 focus:border-ryanair-yellow text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Partenza al</label>
          <input
            type="date"
            value={departureTo}
            onChange={(e) => setDepartureTo(e.target.value)}
            min={departureFrom || today}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 focus:border-ryanair-yellow text-sm"
          />
        </div>
      </div>

      {tripType === 'round-trip' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Soggiorno minimo (giorni)</label>
            <input
              type="number"
              value={minStay}
              onChange={(e) => setMinStay(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={30}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Soggiorno massimo (giorni)</label>
            <input
              type="number"
              value={maxStay}
              onChange={(e) => setMaxStay(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={30}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Passeggeri</label>
          <input
            type="number"
            value={passengers}
            onChange={(e) => setPassengers(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))}
            min={1}
            max={9}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Valuta</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          >
            {CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSearching || origins.length === 0 || destinations.length === 0 || !departureFrom || !departureTo}
        className="w-full py-3 px-6 bg-ryanair-yellow text-ryanair-dark font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
      >
        {isSearching ? 'Scansione in corso...' : 'CERCA VOLI'}
      </button>
    </form>
  )
}
