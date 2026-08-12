import React, { useState, useMemo } from 'react'
import type { FlightResult, SortOption } from '../../types'
import { FlightCard } from './FlightCard'

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
  priority: 'total_price' | 'price_per_day'
}

export const ResultsList: React.FC<ResultsListProps> = ({ results, onRefresh }) => {
  const [sortBy, setSortBy] = useState<SortOption>('cheapest')
  const [filterAirport, setFilterAirport] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    priceMin: null,
    priceMax: null,
    durationMin: null,
    durationMax: null,
    departureDay: null,
    returnDay: null,
    departureTime: null,
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
    if (filterAirport) count++
    return count
  }, [filters, filterAirport])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-100">
            {filteredAndSorted.length} risultati
          </h3>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            Aggiorna prezzi
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 relative"
          >
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
              className="px-3 py-1.5 bg-red-600/20 text-red-400 text-sm rounded-lg hover:bg-red-600/30 transition-colors border border-red-600/30"
            >
              Resetta filtri
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50"
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

      {showFilters && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
          <h4 className="text-md font-semibold text-gray-100">Filtri avanzati</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Filtro prezzo */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400">Range di prezzo</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin || ''}
                  onChange={(e) => setFilters({ ...filters, priceMin: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax || ''}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50"
                />
              </div>
            </div>

            {/* Filtro durata */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400">Durata soggiorno (giorni)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.durationMin || ''}
                  onChange={(e) => setFilters({ ...filters, durationMin: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.durationMax || ''}
                  onChange={(e) => setFilters({ ...filters, durationMax: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50"
                />
              </div>
            </div>

            {/* Filtro aeroporto */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400">Aeroporto</label>
              <select
                value={filterAirport}
                onChange={(e) => setFilterAirport(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50"
              >
                <option value="">Tutti gli aeroporti</option>
                {airports.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Filtro giorno partenza */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400">Giorno partenza</label>
              <select
                value={filters.departureDay || ''}
                onChange={(e) => setFilters({ ...filters, departureDay: e.target.value || null })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50"
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
              <label className="block text-sm font-medium text-gray-400">Giorno ritorno</label>
              <select
                value={filters.returnDay || ''}
                onChange={(e) => setFilters({ ...filters, returnDay: e.target.value || null })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50"
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
              <label className="block text-sm font-medium text-gray-400">Orario partenza</label>
              <select
                value={filters.departureTime || ''}
                onChange={(e) => setFilters({ ...filters, departureTime: e.target.value || null })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50"
              >
                <option value="">Qualsiasi orario</option>
                <option value="morning">Mattina (05:00-12:00)</option>
                <option value="afternoon">Pomeriggio (12:00-18:00)</option>
                <option value="evening">Sera (18:00-22:00)</option>
                <option value="night">Notte (22:00-05:00)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 flex items-center gap-1">
        <span>&#9888;</span> I prezzi dei voli possono cambiare
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAndSorted.map((result, index) => (
          <FlightCard
            key={`${result.origin}-${result.destination}-${result.departureDate}-${result.returnDate}`}
            result={result}
            rank={index === 0 ? 1 : undefined}
          />
        ))}
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nessun risultato trovato con i filtri selezionati. Prova a modificare i criteri di ricerca.
        </div>
      )}
    </div>
  )
}
