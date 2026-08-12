import React, { useState, useMemo } from 'react'
import type { FlightResult, SortOption } from '../../types'
import { FlightCard } from './FlightCard'
import { FlightCompareModal } from './FlightCompareModal'

interface ResultsListProps {
  results: FlightResult[]
  onRefresh: () => void
}

interface Filters {
  priceMin: number | null
  priceMax: number | null
  durationMin: number | null
  durationMax: number | null
  departureDay: string | null
  returnDay: string | null
  departureTime: string | null
  fareType: string | null
  priority: 'total_price' | 'price_per_day'
}

export const ResultsList: React.FC<ResultsListProps> = ({ results, onRefresh }) => {
  const [sortBy, setSortBy] = useState<SortOption>('cheapest')
  const [filterAirport, setFilterAirport] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFlights, setSelectedFlights] = useState<Set<string>>(new Set())
  const [showCompare, setShowCompare] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    priceMin: null,
    priceMax: null,
    durationMin: null,
    durationMax: null,
    departureDay: null,
    returnDay: null,
    departureTime: null,
    fareType: null,
    priority: 'total_price'
  })

  const airports = useMemo(() => {
    const set = new Set<string>()
    results.forEach(r => {
      set.add(`${r.origin} - ${r.originName}`)
      set.add(`${r.destination} - ${r.destinationName}`)
    })
    return Array.from(set).sort()
  }, [results])

  const filteredAndSorted = useMemo(() => {
    let filtered = results

    // Filtro aeroporto
    if (filterAirport) {
      const code = filterAirport.split(' - ')[0]
      filtered = filtered.filter(r => r.origin === code || r.destination === code)
    }

    // Filtro prezzo
    if (filters.priceMin !== null) {
      filtered = filtered.filter(r => r.totalPrice !== null && r.totalPrice >= (filters.priceMin as number))
    }
    if (filters.priceMax !== null) {
      filtered = filtered.filter(r => r.totalPrice !== null && r.totalPrice <= (filters.priceMax as number))
    }

    // Filtro durata
    if (filters.durationMin !== null) {
      filtered = filtered.filter(r => r.duration !== null && r.duration >= (filters.durationMin as number))
    }
    if (filters.durationMax !== null) {
      filtered = filtered.filter(r => r.duration !== null && r.duration <= (filters.durationMax as number))
    }

    // Filtro giorno partenza
    if (filters.departureDay) {
      const dayMap: Record<string, number> = {
        'lun': 1, 'mar': 2, 'mer': 3, 'gio': 4, 'ven': 5, 'sab': 6, 'dom': 0
      }
      const targetDay = dayMap[filters.departureDay]
      filtered = filtered.filter(r => {
        const date = new Date(r.departureDate + 'T00:00:00')
        return date.getDay() === targetDay
      })
    }

    // Filtro giorno ritorno
    if (filters.returnDay && results[0]?.tripType !== 'one-way') {
      const dayMap: Record<string, number> = {
        'lun': 1, 'mar': 2, 'mer': 3, 'gio': 4, 'ven': 5, 'sab': 6, 'dom': 0
      }
      const targetDay = dayMap[filters.returnDay]
      filtered = filtered.filter(r => {
        if (!r.returnDate) return false
        const date = new Date(r.returnDate + 'T00:00:00')
        return date.getDay() === targetDay
      })
    }

    // Filtro orario partenza
    if (filters.departureTime && results[0]?.outboundDepartureTime) {
      filtered = filtered.filter(r => {
        if (!r.outboundDepartureTime) return false
        const hour = parseInt(r.outboundDepartureTime.split('T')[1].split(':')[0])
        switch (filters.departureTime) {
          case 'morning': return hour >= 5 && hour < 12
          case 'afternoon': return hour >= 12 && hour < 18
          case 'evening': return hour >= 18 && hour < 22
          case 'night': return hour >= 22 || hour < 5
          default: return true
        }
      })
    }

    // Filtro tipo tariffa (bagagli)
    if (filters.fareType) {
      filtered = filtered.filter(r => {
        const outboundMatch = !r.outboundFareType || r.outboundFareType.toLowerCase().includes(filters.fareType!.toLowerCase())
        const returnMatch = !r.returnFareType || r.returnFareType.toLowerCase().includes(filters.fareType!.toLowerCase())
        return outboundMatch && returnMatch
      })
    }

    // Ordinamento
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'cheapest':
          return (a.totalPrice ?? Infinity) - (b.totalPrice ?? Infinity)
        case 'most_expensive':
          return (b.totalPrice ?? -Infinity) - (a.totalPrice ?? -Infinity)
        case 'duration':
          return (a.duration ?? Infinity) - (b.duration ?? Infinity)
        case 'duration_desc':
          return (b.duration ?? -Infinity) - (a.duration ?? -Infinity)
        case 'departure':
          return a.departureDate.localeCompare(b.departureDate)
        case 'departure_desc':
          return b.departureDate.localeCompare(a.departureDate)
        case 'price_per_day': {
          const aPerDay = (a.totalPrice !== null && a.duration !== null) ? a.totalPrice / a.duration : Infinity
          const bPerDay = (b.totalPrice !== null && b.duration !== null) ? b.totalPrice / b.duration : Infinity
          return aPerDay - bPerDay
        }
        case 'price_per_day_desc': {
          const aPerDay = (a.totalPrice !== null && a.duration !== null) ? a.totalPrice / a.duration : -Infinity
          const bPerDay = (b.totalPrice !== null && b.duration !== null) ? b.totalPrice / b.duration : -Infinity
          return bPerDay - aPerDay
        }
        default:
          return 0
      }
    })

    return sorted
  }, [results, sortBy, filterAirport, filters])

  const resetFilters = () => {
    setFilters({
      priceMin: null,
      priceMax: null,
      durationMin: null,
      durationMax: null,
      departureDay: null,
      returnDay: null,
      departureTime: null,
      fareType: null,
      priority: 'total_price'
    })
    setFilterAirport('')
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.priceMin !== null) count++
    if (filters.priceMax !== null) count++
    if (filters.durationMin !== null) count++
    if (filters.durationMax !== null) count++
    if (filters.departureDay) count++
    if (filters.returnDay) count++
    if (filters.departureTime) count++
    if (filters.fareType) count++
    if (filterAirport) count++
    return count
  }, [filters, filterAirport])

  const getFlightKey = (result: FlightResult) => 
    `${result.origin}-${result.destination}-${result.departureDate}-${result.returnDate}`

  const toggleFlightSelection = (result: FlightResult) => {
    const key = getFlightKey(result)
    setSelectedFlights(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const selectedFlightsList = useMemo(() => {
    return filteredAndSorted.filter(r => selectedFlights.has(getFlightKey(r)))
  }, [filteredAndSorted, selectedFlights])

  return (
    <div className="space-y-6">
      {/* Header con controlli */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
        <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>
        
        <div className="relative p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-ryanair-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">
                {filteredAndSorted.length} risultati
              </h3>
            </div>
            
            <button
              onClick={onRefresh}
              className="button-secondary px-3 py-1.5 rounded-lg text-sm dark:text-gray-300 text-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Aggiorna
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="button-secondary px-3 py-1.5 rounded-lg text-sm dark:text-gray-300 text-gray-700 flex items-center gap-2 relative"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              Filtri
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-ryanair-yellow text-ryanair-dark text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors"
              >
                Resetta filtri
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input-modern flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm"
            >
              <option value="cheapest">Prezzo: più basso</option>
              <option value="most_expensive">Prezzo: più alto</option>
              <option value="duration">Durata: più breve</option>
              <option value="duration_desc">Durata: più lunga</option>
              <option value="departure">Data: più vicina</option>
              <option value="departure_desc">Data: più lontana</option>
              <option value="price_per_day">Prezzo/giorno: più basso</option>
              <option value="price_per_day_desc">Prezzo/giorno: più alto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtri avanzati */}
      {showFilters && (
        <div className="relative overflow-hidden rounded-2xl animate-slide-up">
          <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
          <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>
          
          <div className="relative p-6 space-y-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-ryanair-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              <h4 className="text-lg font-semibold dark:text-white text-gray-900">Filtri avanzati</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Filtro prezzo */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Range di prezzo
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin || ''}
                    onChange={(e) => setFilters({ ...filters, priceMin: e.target.value ? parseFloat(e.target.value) : null })}
                    className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax || ''}
                    onChange={(e) => setFilters({ ...filters, priceMax: e.target.value ? parseFloat(e.target.value) : null })}
                    className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Filtro durata */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Durata soggiorno (giorni)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.durationMin || ''}
                    onChange={(e) => setFilters({ ...filters, durationMin: e.target.value ? parseInt(e.target.value) : null })}
                    className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.durationMax || ''}
                    onChange={(e) => setFilters({ ...filters, durationMax: e.target.value ? parseInt(e.target.value) : null })}
                    className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Filtro aeroporto */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Aeroporto
                </label>
                <select
                  value={filterAirport}
                  onChange={(e) => setFilterAirport(e.target.value)}
                  className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">Tutti gli aeroporti</option>
                  {airports.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Filtro giorno partenza */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Giorno partenza
                </label>
                <select
                  value={filters.departureDay || ''}
                  onChange={(e) => setFilters({ ...filters, departureDay: e.target.value || null })}
                  className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">Qualsiasi giorno</option>
                  <option value="lun">Lunedì</option>
                  <option value="mar">Martedì</option>
                  <option value="mer">Mercoledì</option>
                  <option value="gio">Giovedì</option>
                  <option value="ven">Venerdì</option>
                  <option value="sab">Sabato</option>
                  <option value="dom">Domenica</option>
                </select>
              </div>

              {/* Filtro giorno ritorno */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Giorno ritorno
                </label>
                <select
                  value={filters.returnDay || ''}
                  onChange={(e) => setFilters({ ...filters, returnDay: e.target.value || null })}
                  className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">Qualsiasi giorno</option>
                  <option value="lun">Lunedì</option>
                  <option value="mar">Martedì</option>
                  <option value="mer">Mercoledì</option>
                  <option value="gio">Giovedì</option>
                  <option value="ven">Venerdì</option>
                  <option value="sab">Sabato</option>
                  <option value="dom">Domenica</option>
                </select>
              </div>

              {/* Filtro orario partenza */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Orario partenza
                </label>
                <select
                  value={filters.departureTime || ''}
                  onChange={(e) => setFilters({ ...filters, departureTime: e.target.value || null })}
                  className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">Qualsiasi orario</option>
                  <option value="morning">Mattina (05:00-12:00)</option>
                  <option value="afternoon">Pomeriggio (12:00-18:00)</option>
                  <option value="evening">Sera (18:00-22:00)</option>
                  <option value="night">Notte (22:00-05:00)</option>
                </select>
              </div>

              {/* Filtro tipo tariffa (bagagli) */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-400 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  Tipo tariffa / Bagagli
                </label>
                <select
                  value={filters.fareType || ''}
                  onChange={(e) => setFilters({ ...filters, fareType: e.target.value || null })}
                  className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">Qualsiasi tariffa</option>
                  <option value="value">Value (solo bagaglio a mano piccolo)</option>
                  <option value="regular">Regular (10kg bagaglio a mano + stiva)</option>
                  <option value="plus">Plus (2 bagagli da stiva)</option>
                  <option value="flex">Flex (prioritario + 2 bagagli)</option>
                  <option value="family">Family (tariffa familiare)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avviso prezzi */}
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
        <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
        </svg>
        <span className="text-xs text-yellow-500/80">I prezzi dei voli possono cambiare</span>
      </div>

      {/* Barra confronto - sticky bottom */}
      {selectedFlights.size >= 2 && (
        <div className="sticky bottom-4 z-30 mt-6">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <div className="absolute inset-0 dark:bg-gray-800 bg-white border-2 dark:border-blue-500/50 border-blue-500"></div>
            <div className="relative p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {Array.from(selectedFlights).slice(0, 3).map((_, idx) => (
                    <div key={idx} className="w-10 h-10 rounded-full bg-blue-500 border-2 dark:border-gray-800 border-white flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                  ))}
                  {selectedFlights.size > 3 && (
                    <div className="w-10 h-10 rounded-full dark:bg-gray-700 bg-gray-200 border-2 dark:border-gray-800 border-white flex items-center justify-center dark:text-gray-300 text-gray-600 font-bold text-sm">
                      +{selectedFlights.size - 3}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-base font-bold dark:text-white text-gray-900">
                    {selectedFlights.size} vol{selectedFlights.size === 1 ? 'o' : 'i'} selezionat{selectedFlights.size === 1 ? 'o' : 'i'}
                  </p>
                  <p className="text-xs dark:text-gray-400 text-gray-600">Clicca per confrontare</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedFlights(new Set())}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold dark:bg-gray-700 bg-gray-200 dark:text-gray-300 text-gray-700 hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => setShowCompare(true)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Confronta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista risultati */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAndSorted.map((result, index) => {
          const key = getFlightKey(result)
          return (
            <FlightCard
              key={key}
              result={result}
              rank={index === 0 ? 1 : undefined}
              selectable={true}
              selected={selectedFlights.has(key)}
              onToggleSelect={() => toggleFlightSelection(result)}
            />
          )
        })}
      </div>

      {/* Nessun risultato */}
      {filteredAndSorted.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
          <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>
          
          <div className="relative py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full dark:bg-gray-800/50 bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 dark:text-gray-600 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="dark:text-gray-400 text-gray-600">Nessun risultato trovato con i filtri selezionati</p>
            <p className="dark:text-gray-600 text-gray-400 text-sm mt-2">Prova a modificare i criteri di ricerca</p>
          </div>
        </div>
      )}

      {/* Modale confronto */}
      {showCompare && selectedFlightsList.length >= 2 && (
        <FlightCompareModal
          flights={selectedFlightsList}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}
