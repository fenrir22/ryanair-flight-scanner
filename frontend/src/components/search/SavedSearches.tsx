import React, { useState, useEffect } from 'react'
import type { SavedSearch } from '../../types'
import { getSavedSearches, createSavedSearch, deleteSavedSearch, updateSavedSearch } from '../../api/savedSearches'
import { AirportAutocomplete } from '../search/AirportAutocomplete'
import { useAirportSearch } from '../../hooks/useAirportSearch'

interface SavedSearchesProps {
  userId: string
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({ userId }) => {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSearches()
  }, [userId])

  const loadSearches = async () => {
    try {
      setLoading(true)
      const data = await getSavedSearches(userId)
      setSearches(data)
    } catch (err) {
      console.error('Failed to load saved searches:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa ricerca?')) return
    
    try {
      await deleteSavedSearch(id)
      setSearches(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Failed to delete search:', err)
    }
  }

  const handleToggle = async (search: SavedSearch) => {
    try {
      const updated = await updateSavedSearch(search.id, { enabled: !search.enabled })
      setSearches(prev => prev.map(s => s.id === search.id ? updated : s))
    } catch (err) {
      console.error('Failed to toggle search:', err)
    }
  }

  const handleCreate = async (newSearch: Omit<SavedSearch, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const created = await createSavedSearch(newSearch)
      setSearches(prev => [...prev, created])
      setShowForm(false)
    } catch (err) {
      console.error('Failed to create search:', err)
      throw err
    }
  }

  if (loading) {
    return <div className="dark:text-gray-400 text-gray-600">Caricamento ricerche salvate...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-ryanair-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold dark:text-white text-gray-900">Ricerche Salvate</h2>
            <p className="text-xs dark:text-gray-500 text-gray-500">Ricevi notifiche per le migliori offerte</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="button-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2"
        >
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Annulla
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Nuova Ricerca
            </>
          )}
        </button>
      </div>

      {showForm && (
        <SavedSearchForm
          userId={userId}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {searches.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
          <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>
          
          <div className="relative py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full dark:bg-gray-800/50 bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 dark:text-gray-600 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
            </div>
            <p className="dark:text-gray-400 text-gray-600">Nessuna ricerca salvata</p>
            <p className="dark:text-gray-600 text-gray-400 text-sm mt-2">Crea una nuova ricerca per ricevere notifiche giornaliere</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {searches.map(search => (
            <SavedSearchCard
              key={search.id}
              search={search}
              onDelete={() => handleDelete(search.id)}
              onToggle={() => handleToggle(search)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SavedSearchCardProps {
  search: SavedSearch
  onDelete: () => void
  onToggle: () => void
}

const SavedSearchCard: React.FC<SavedSearchCardProps> = ({ search, onDelete, onToggle }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl card-hover-effect ${!search.enabled && 'opacity-60'}`}>
      {/* Background */}
      <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
      <div className={`absolute inset-0 border rounded-2xl transition-colors ${search.enabled ? 'dark:border-white/10 border-gray-200' : 'dark:border-gray-800/50 border-gray-300'}`}></div>
      
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${search.enabled ? 'bg-green-500/10' : 'dark:bg-gray-800/50 bg-gray-100'}`}>
                <svg className={`w-5 h-5 ${search.enabled ? 'text-green-400' : 'dark:text-gray-600 text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold dark:text-white text-gray-900">{search.name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${search.enabled ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'dark:bg-gray-800/50 bg-gray-100 dark:text-gray-500 text-gray-500 border dark:border-gray-700/50 border-gray-300'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${search.enabled ? 'bg-green-400 animate-pulse' : 'dark:bg-gray-600 bg-gray-400'}`}></div>
                  {search.enabled ? 'Attiva' : 'Disattivata'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 dark:text-gray-400 text-gray-600">
                <svg className="w-4 h-4 dark:text-gray-600 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                <span>{search.origins.join(', ')} → {search.destinations.join(', ')}</span>
              </div>
              <div className="flex items-center gap-2 dark:text-gray-400 text-gray-600">
                <svg className="w-4 h-4 dark:text-gray-600 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>{search.departure_from} → {search.departure_to}</span>
              </div>
              <div className="flex items-center gap-2 dark:text-gray-400 text-gray-600">
                <svg className="w-4 h-4 dark:text-gray-600 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{search.min_stay}-{search.max_stay} giorni{search.trip_type === 'one-way' && ' (solo andata)'}</span>
              </div>
              {search.max_price && (
                <div className="flex items-center gap-2 dark:text-gray-400 text-gray-600">
                  <svg className="w-4 h-4 dark:text-gray-600 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Max {search.max_price} {search.currency}</span>
                </div>
              )}
              {search.ntfy_topic && (
                <div className="flex items-center gap-2 dark:text-gray-400 text-gray-600">
                  <svg className="w-4 h-4 dark:text-gray-600 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <span>{search.ntfy_topic}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onToggle}
              className={`button-secondary px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                search.enabled ? 'text-orange-400 border-orange-500/20 hover:bg-orange-500/10' : 'text-green-400 border-green-500/20 hover:bg-green-500/10'
              }`}
            >
              {search.enabled ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Pausa
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  </svg>
                  Attiva
                </>
              )}
            </button>
            <button
              onClick={onDelete}
              className="button-secondary px-3 py-1.5 rounded-lg text-sm text-red-400 border-red-500/20 hover:bg-red-500/10 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Elimina
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SavedSearchFormProps {
  userId: string
  onSubmit: (search: Omit<SavedSearch, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
}

const SavedSearchForm: React.FC<SavedSearchFormProps> = ({ userId, onSubmit, onCancel }) => {
  const [name, setName] = useState('')
  const [origins, setOrigins] = useState<string[]>([])
  const [destinations, setDestinations] = useState<string[]>([])
  const [departureFrom, setDepartureFrom] = useState('')
  const [departureTo, setDepartureTo] = useState('')
  const [minStay, setMinStay] = useState(3)
  const [maxStay, setMaxStay] = useState(7)
  const [passengers, setPassengers] = useState(1)
  const [currency, setCurrency] = useState('EUR')
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [ntfyTopic, setNtfyTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const originSearch = useAirportSearch()
  const destSearch = useAirportSearch()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!name || origins.length === 0 || destinations.length === 0 || !departureFrom || !departureTo) {
      setError('Compila tutti i campi obbligatori')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        user_id: userId,
        name,
        origins,
        destinations,
        departure_from: departureFrom,
        departure_to: departureTo,
        min_stay: minStay,
        max_stay: maxStay,
        passengers,
        currency,
        trip_type: tripType,
        max_price: maxPrice,
        ntfy_topic: ntfyTopic || null,
        enabled: true
      })
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="dark:bg-gray-800 bg-white rounded-xl border dark:border-gray-700 border-gray-300 p-6 space-y-4">
      <h3 className="text-lg font-semibold dark:text-gray-100 text-gray-900">Nuova Ricerca Salvata</h3>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Nome ricerca *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="es. Vacanze estive"
          className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AirportAutocomplete
          label="Aeroporti di partenza *"
          selected={origins}
          onAdd={(code) => setOrigins(prev => [...prev, code])}
          onRemove={(code) => setOrigins(prev => prev.filter(c => c !== code))}
          searchQuery={originSearch.query}
          setSearchQuery={originSearch.setQuery}
          searchResults={originSearch.results}
          isSearching={originSearch.isLoading}
          placeholder="Cerca aeroporto..."
        />

        <AirportAutocomplete
          label="Aeroporti di destinazione *"
          selected={destinations}
          onAdd={(code) => setDestinations(prev => [...prev, code])}
          onRemove={(code) => setDestinations(prev => prev.filter(c => c !== code))}
          searchQuery={destSearch.query}
          setSearchQuery={destSearch.setQuery}
          searchResults={destSearch.results}
          isSearching={destSearch.isLoading}
          placeholder="Cerca aeroporto..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Data partenza da *</label>
          <input
            type="date"
            value={departureFrom}
            onChange={(e) => setDepartureFrom(e.target.value)}
            min={today}
            className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Ritorno dal *</label>
          <input
            type="date"
            value={departureTo}
            onChange={(e) => setDepartureTo(e.target.value)}
            min={departureFrom || today}
            className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Soggiorno min (giorni)</label>
          <input
            type="number"
            value={minStay}
            onChange={(e) => setMinStay(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={30}
            className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Soggiorno max (giorni)</label>
          <input
            type="number"
            value={maxStay}
            onChange={(e) => setMaxStay(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={30}
            className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Passeggeri</label>
          <input
            type="number"
            value={passengers}
            onChange={(e) => setPassengers(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))}
            min={1}
            max={9}
            className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Tipo viaggio</label>
          <select
            value={tripType}
            onChange={(e) => setTripType(e.target.value as any)}
            className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          >
            <option value="round-trip">Andata e ritorno</option>
            <option value="one-way">Solo andata</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Valuta</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          >
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="PLN">PLN (zł)</option>
            <option value="SEK">SEK (kr)</option>
            <option value="NOK">NOK (kr)</option>
            <option value="DKK">DKK (kr)</option>
            <option value="CZK">CZK (Kč)</option>
            <option value="HUF">HUF (Ft)</option>
            <option value="CHF">CHF (Fr)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Prezzo massimo (opzionale)</label>
          <input
            type="number"
            value={maxPrice || ''}
            onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="es. 100"
            min={0}
            className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1">Topic Ntfy *</label>
          <input
            type="text"
            value={ntfyTopic}
            onChange={(e) => setNtfyTopic(e.target.value)}
            placeholder="es. miei-voli-ryanair"
            className="w-full px-3 py-2 dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-300 rounded-lg dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
            required
          />
          <p className="text-xs dark:text-gray-500 text-gray-500 mt-1">
            Iscriviti al topic su <a href="https://ntfy.sh" target="_blank" rel="noopener noreferrer" className="text-ryanair-yellow hover:underline">ntfy.sh</a> per ricevere le notifiche
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-ryanair-yellow text-ryanair-dark font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Salvataggio...' : 'Salva Ricerca'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 dark:bg-gray-700 bg-gray-200 dark:text-gray-300 text-gray-700 rounded-lg hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors"
        >
          Annulla
        </button>
      </div>
    </form>
  )
}
