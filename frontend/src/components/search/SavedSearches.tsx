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
    return <div className="text-gray-400">Caricamento ricerche salvate...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-100">Ricerche Salvate</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-ryanair-yellow text-ryanair-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors"
        >
          {showForm ? 'Annulla' : '+ Nuova Ricerca'}
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
        <div className="text-center py-8 text-gray-500">
          Nessuna ricerca salvata. Crea una nuova ricerca per ricevere notifiche giornaliere.
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
    <div className={`bg-gray-900 rounded-xl border p-5 ${search.enabled ? 'border-gray-700' : 'border-gray-800 opacity-60'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-100">{search.name}</h3>
            <span className={`px-2 py-0.5 text-xs rounded ${search.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
              {search.enabled ? 'Attiva' : 'Disattivata'}
            </span>
          </div>
          
          <div className="text-sm text-gray-400 space-y-1">
            <div>
              <span className="text-gray-500">Da:</span> {search.origins.join(', ')} → 
              <span className="text-gray-500"> A:</span> {search.destinations.join(', ')}
            </div>
            <div>
              <span className="text-gray-500">Date:</span> {search.departure_from} → {search.departure_to}
            </div>
            <div>
              <span className="text-gray-500">Durata:</span> {search.min_stay}-{search.max_stay} giorni
              {search.trip_type === 'one-way' && ' (solo andata)'}
            </div>
            {search.max_price && (
              <div>
                <span className="text-gray-500">Prezzo max:</span> {search.max_price} {search.currency}
              </div>
            )}
            {search.ntfy_topic && (
              <div>
                <span className="text-gray-500">Notifiche:</span> {search.ntfy_topic}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              search.enabled 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
            }`}
          >
            {search.enabled ? 'Disattiva' : 'Attiva'}
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 bg-red-600/20 text-red-400 text-sm rounded-lg hover:bg-red-600/30 transition-colors"
          >
            Elimina
          </button>
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
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-100">Nuova Ricerca Salvata</h3>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Nome ricerca *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="es. Vacanze estive"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
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
          <label className="block text-sm font-medium text-gray-400 mb-1">Data partenza da *</label>
          <input
            type="date"
            value={departureFrom}
            onChange={(e) => setDepartureFrom(e.target.value)}
            min={today}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Data partenza a *</label>
          <input
            type="date"
            value={departureTo}
            onChange={(e) => setDepartureTo(e.target.value)}
            min={departureFrom || today}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Soggiorno min (giorni)</label>
          <input
            type="number"
            value={minStay}
            onChange={(e) => setMinStay(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={30}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Soggiorno max (giorni)</label>
          <input
            type="number"
            value={maxStay}
            onChange={(e) => setMaxStay(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={30}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Passeggeri</label>
          <input
            type="number"
            value={passengers}
            onChange={(e) => setPassengers(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))}
            min={1}
            max={9}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Tipo viaggio</label>
          <select
            value={tripType}
            onChange={(e) => setTripType(e.target.value as any)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          >
            <option value="round-trip">Andata e ritorno</option>
            <option value="one-way">Solo andata</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Valuta</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
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
          <label className="block text-sm font-medium text-gray-400 mb-1">Prezzo massimo (opzionale)</label>
          <input
            type="number"
            value={maxPrice || ''}
            onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="es. 100"
            min={0}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Topic Ntfy *</label>
          <input
            type="text"
            value={ntfyTopic}
            onChange={(e) => setNtfyTopic(e.target.value)}
            placeholder="es. miei-voli-ryanair"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-ryanair-yellow/50 text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
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
          className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Annulla
        </button>
      </div>
    </form>
  )
}
