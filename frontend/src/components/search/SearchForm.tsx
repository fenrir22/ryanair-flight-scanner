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
    <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-2xl">
      {/* Background gradiente */}
      <div className="absolute inset-0 dark:from-gray-900/90 dark:to-gray-800/90 from-white/90 to-gray-50/90 backdrop-blur-xl"></div>
      <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>
      
      <div className="relative p-6 space-y-6">
        {/* Tipo viaggio */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTripType('round-trip')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              tripType === 'round-trip'
                ? 'bg-ryanair-yellow/20 text-ryanair-yellow border border-ryanair-yellow/30 shadow-glow'
                : 'dark:bg-gray-800/50 bg-gray-100 dark:text-gray-400 text-gray-600 dark:border-gray-700/50 border-gray-300 hover:dark:bg-gray-700/50 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              Andata e ritorno
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTripType('one-way')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              tripType === 'one-way'
                ? 'bg-ryanair-yellow/20 text-ryanair-yellow border border-ryanair-yellow/30 shadow-glow'
                : 'dark:bg-gray-800/50 bg-gray-100 dark:text-gray-400 text-gray-600 dark:border-gray-700/50 border-gray-300 hover:dark:bg-gray-700/50 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
              Solo andata
            </span>
          </button>
        </div>

        {/* Aeroporti */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AirportAutocomplete
            label="Da"
            icon={
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
            }
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
            icon={
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
            }
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

        {/* Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Partenza dal
            </label>
            <input
              type="date"
              value={departureFrom}
              onChange={(e) => setDepartureFrom(e.target.value)}
              min={today}
              className="input-modern w-full px-4 py-3 rounded-xl text-gray-100 text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {tripType === 'round-trip' ? 'Ritorno dal' : 'Partenza al'}
            </label>
            <input
              type="date"
              value={departureTo}
              onChange={(e) => setDepartureTo(e.target.value)}
              min={departureFrom || today}
              className="input-modern w-full px-4 py-3 rounded-xl text-gray-100 text-sm"
            />
          </div>
        </div>

        {/* Soggiorno */}
        {tripType === 'round-trip' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Soggiorno minimo (giorni)
            </label>
              <input
                type="number"
                value={minStay}
                onChange={(e) => setMinStay(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={30}
                className="input-modern w-full px-4 py-3 rounded-xl text-gray-100 text-sm"
              />
            </div>

            <div>
            <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Soggiorno massimo (giorni)
            </label>
              <input
                type="number"
                value={maxStay}
                onChange={(e) => setMaxStay(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={30}
                className="input-modern w-full px-4 py-3 rounded-xl text-gray-100 text-sm"
              />
            </div>
          </div>
        )}

        {/* Passeggeri e valuta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              Passeggeri
            </label>
            <input
              type="number"
              value={passengers}
              onChange={(e) => setPassengers(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))}
              min={1}
              max={9}
              className="input-modern w-full px-4 py-3 rounded-xl text-gray-100 text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Valuta
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-modern w-full px-4 py-3 rounded-xl text-gray-100 text-sm"
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSearching || origins.length === 0 || destinations.length === 0 || !departureFrom || !departureTo}
          className="button-primary w-full py-4 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3"
        >
          {isSearching ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scansione in corso...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              CERCA VOLI
            </>
          )}
        </button>
      </div>
    </form>
  )
}
