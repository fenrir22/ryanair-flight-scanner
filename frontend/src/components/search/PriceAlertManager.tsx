import React, { useState } from 'react'
import type { PriceAlert } from '../../hooks/usePriceAlert'

interface PriceAlertManagerProps {
  alerts: PriceAlert[]
  permissionGranted: boolean
  onAdd: (origin: string, destination: string, maxPrice: number, currency: string) => void
  onRemove: (id: string) => void
  onRequestPermission: () => Promise<boolean>
  onReset: (id: string) => void
}

export const PriceAlertManager: React.FC<PriceAlertManagerProps> = ({
  alerts,
  permissionGranted,
  onAdd,
  onRemove,
  onRequestPermission,
  onReset
}) => {
  const [showForm, setShowForm] = useState(false)
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [currency, setCurrency] = useState('EUR')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination || !maxPrice) return
    
    onAdd(origin.toUpperCase(), destination.toUpperCase(), parseFloat(maxPrice), currency)
    setOrigin('')
    setDestination('')
    setMaxPrice('')
    setShowForm(false)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
      <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-ryanair-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">Alert Prezzo</h3>
              <p className="text-xs dark:text-gray-500 text-gray-500">
                {permissionGranted ? 'Ricevi notifiche quando i prezzi scendono' : 'Abilita notifiche per ricevere alert'}
              </p>
            </div>
          </div>
          {!permissionGranted && (
            <button
              onClick={onRequestPermission}
              className="button-primary px-4 py-2 rounded-xl text-sm"
            >
              Abilita notifiche
            </button>
          )}
        </div>

        {permissionGranted && (
          <>
            {alerts.length > 0 ? (
              <div className="space-y-3 mb-4">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      alert.notified
                        ? 'dark:bg-green-900/10 bg-green-50 dark:border-green-500/20 border-green-200'
                        : 'dark:bg-gray-800/50 bg-gray-100 dark:border-white/5 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        alert.notified ? 'bg-green-500/20' : 'dark:bg-gray-700 bg-gray-200'
                      }`}>
                        <svg className={`w-4 h-4 ${alert.notified ? 'text-green-500' : 'dark:text-gray-400 text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium dark:text-white text-gray-900">
                          {alert.origin} → {alert.destination}
                        </p>
                        <p className="text-xs dark:text-gray-400 text-gray-600">
                          Max €{alert.maxPrice.toFixed(2)} {alert.currency}
                          {alert.notified && <span className="text-green-500 ml-2">• Triggerato</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {alert.notified && (
                        <button
                          onClick={() => onReset(alert.id)}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => onRemove(alert.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Rimuovi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm dark:text-gray-400 text-gray-600 mb-4">
                Nessun alert impostato. Crea un alert per ricevere notifiche quando i prezzi scendono.
              </p>
            )}

            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium dark:text-gray-400 text-gray-600 mb-1">Origine</label>
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="CTA"
                      maxLength={3}
                      className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium dark:text-gray-400 text-gray-600 mb-1">Destinazione</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="STN"
                      maxLength={3}
                      className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium dark:text-gray-400 text-gray-600 mb-1">Prezzo max (€)</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="100"
                      min="1"
                      className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium dark:text-gray-400 text-gray-600 mb-1">Valuta</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="input-modern w-full px-3 py-2 rounded-lg text-sm"
                    >
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="button-primary px-4 py-2 rounded-xl text-sm flex-1"
                  >
                    Crea Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="button-secondary px-4 py-2 rounded-xl text-sm"
                  >
                    Annulla
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="button-secondary w-full py-2 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuovo Alert
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
