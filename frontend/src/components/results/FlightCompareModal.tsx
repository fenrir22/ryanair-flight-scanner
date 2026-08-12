import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import type { FlightResult } from '../../types'

interface FlightCompareModalProps {
  flights: FlightResult[]
  onClose: () => void
}

export const FlightCompareModal: React.FC<FlightCompareModalProps> = ({ flights, onClose }) => {
  // Blocca scroll del body quando il modale è aperto
  useEffect(() => {
    const originalStyle = document.body.style.cssText
    document.body.style.cssText = 'overflow: hidden; position: fixed; width: 100%; top: 0;'
    return () => {
      document.body.style.cssText = originalStyle
    }
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--'
    try {
      const d = new Date(timeStr)
      return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return timeStr.slice(11, 16) || '--:--'
    }
  }

  const currencySymbol = flights[0]?.currency === 'EUR' ? '€' : flights[0]?.currency || '€'
  const minPrice = Math.min(...flights.map(f => f.totalPrice ?? Infinity))
  const maxPrice = Math.max(...flights.map(f => f.totalPrice ?? 0))

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      {/* Modal container */}
      <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl my-8 pointer-events-auto">
        {/* Sfondo con gradiente sottile */}
        <div className="absolute inset-0 bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 from-gray-50 via-white to-gray-100"></div>
        <div className="absolute inset-0 border dark:border-gray-700/50 border-gray-300/50 rounded-3xl"></div>
        
        <div className="relative flex flex-col h-full">
          {/* Header elegante */}
          <div className="relative px-8 pt-8 pb-6 border-b dark:border-gray-700/50 border-gray-300/50">
            <div className="absolute inset-0 bg-gradient-to-r dark:from-blue-900/10 dark:via-transparent dark:to-blue-900/10 from-blue-50/50 via-transparent to-blue-50/50"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl"></div>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold dark:text-white text-gray-900 tracking-tight">Confronto Voli</h2>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mt-1 font-medium">
                    {flights.length} {flights.length === 1 ? 'opzione' : 'opzioni'} a confronto
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="group p-3 rounded-xl dark:bg-gray-800/50 bg-gray-200/50 dark:hover:bg-gray-700/50 hover:bg-gray-300/50 transition-all duration-200 backdrop-blur-sm border dark:border-gray-700/50 border-gray-300/50"
                aria-label="Chiudi"
              >
                <svg className="w-6 h-6 dark:text-gray-400 text-gray-600 group-hover:dark:text-white group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content con scroll */}
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              {/* Cards dei voli */}
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(flights.length, 3)}, minmax(0, 1fr))` }}>
                {flights.map((flight, idx) => {
                  const isBestPrice = flight.totalPrice === minPrice
                  const pricePercentage = maxPrice > minPrice 
                    ? ((flight.totalPrice! - minPrice) / (maxPrice - minPrice)) * 100 
                    : 0

                  return (
                    <div 
                      key={idx}
                      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                        isBestPrice 
                          ? 'ring-2 ring-green-500 shadow-xl scale-[1.02]' 
                          : 'dark:bg-gray-800/50 bg-white shadow-lg border dark:border-gray-700/50 border-gray-200'
                      }`}
                    >
                      {/* Header card */}
                      <div className={`relative px-6 py-5 ${
                        isBestPrice 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'dark:bg-gray-800 bg-gray-50'
                      }`}>
                        {isBestPrice && (
                          <div className="absolute top-0 right-0 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-bl-xl">
                            <span className="text-xs font-bold text-white">MIGLIOR PREZZO</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                            isBestPrice 
                              ? 'bg-white/20 text-white' 
                              : 'dark:bg-gray-700 bg-gray-200 dark:text-gray-300 text-gray-700'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className={`text-2xl font-bold ${isBestPrice ? 'text-white' : 'dark:text-white text-gray-900'}`}>
                              {flight.origin}
                              <span className={`mx-2 ${isBestPrice ? 'text-white/70' : 'dark:text-gray-500 text-gray-400'}`}>→</span>
                              {flight.destination}
                            </div>
                            <div className={`text-xs font-medium ${isBestPrice ? 'text-white/80' : 'dark:text-gray-400 text-gray-600'}`}>
                              {flight.tripType === 'round-trip' ? 'Andata e ritorno' : 'Solo andata'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contenuto card */}
                      <div className="p-6 space-y-5">
                        {/* Prezzo */}
                        <div className="text-center pb-5 border-b dark:border-gray-700/50 border-gray-200">
                          <div className={`text-4xl font-bold ${isBestPrice ? 'text-green-500' : 'dark:text-white text-gray-900'}`}>
                            {currencySymbol}{flight.totalPrice?.toFixed(2)}
                          </div>
                          {flight.duration && (
                            <div className="text-sm dark:text-gray-400 text-gray-600 mt-1">
                              {currencySymbol}{(flight.totalPrice! / flight.duration).toFixed(2)} / notte
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-semibold dark:text-gray-500 text-gray-500 uppercase tracking-wider mb-1">Partenza</div>
                            <div className="text-sm font-medium dark:text-white text-gray-900">{formatDate(flight.departureDate)}</div>
                            {flight.outboundDepartureTime && (
                              <div className="text-xs dark:text-gray-400 text-gray-600 mt-0.5">
                                {formatTime(flight.outboundDepartureTime)} - {formatTime(flight.outboundArrivalTime)}
                              </div>
                            )}
                          </div>
                          {flight.returnDate && (
                            <div>
                              <div className="text-xs font-semibold dark:text-gray-500 text-gray-500 uppercase tracking-wider mb-1">Ritorno</div>
                              <div className="text-sm font-medium dark:text-white text-gray-900">{formatDate(flight.returnDate)}</div>
                              {flight.returnDepartureTime && (
                                <div className="text-xs dark:text-gray-400 text-gray-600 mt-0.5">
                                  {formatTime(flight.returnDepartureTime)} - {formatTime(flight.returnArrivalTime)}
                                </div>
                              )}
                            </div>
                          )}
                          {flight.duration && (
                            <div className="flex items-center gap-2 text-xs dark:text-gray-400 text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {flight.duration} {flight.duration === 1 ? 'notte' : 'notti'}
                            </div>
                          )}
                        </div>

                        {/* Dettagli volo */}
                        <div className="space-y-2 pt-4 border-t dark:border-gray-700/50 border-gray-200">
                          {flight.outboundFlightNumber && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="dark:text-gray-500 text-gray-500">Volo andata</span>
                              <span className="font-medium dark:text-gray-300 text-gray-700">{flight.outboundFlightNumber}</span>
                            </div>
                          )}
                          {flight.returnFlightNumber && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="dark:text-gray-500 text-gray-500">Volo ritorno</span>
                              <span className="font-medium dark:text-gray-300 text-gray-700">{flight.returnFlightNumber}</span>
                            </div>
                          )}
                          {flight.outboundFareType && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="dark:text-gray-500 text-gray-500">Tariffa</span>
                              <span className="font-medium dark:text-gray-300 text-gray-700 capitalize">{flight.outboundFareType}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="dark:text-gray-500 text-gray-500">Passeggeri</span>
                            <span className="font-medium dark:text-gray-300 text-gray-700">{flight.passengers}</span>
                          </div>
                        </div>

                        {/* Bottone prenota */}
                        {flight.bookingUrl && (
                          <a
                            href={flight.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block w-full py-3 rounded-xl text-center font-bold text-sm transition-all duration-200 ${
                              isBestPrice
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg'
                                : 'dark:bg-gray-700 bg-gray-200 dark:text-gray-200 text-gray-800 hover:dark:bg-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            Prenota ora
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer minimale */}
          <div className="px-8 py-5 border-t dark:border-gray-700/50 border-gray-300/50 dark:bg-gray-800/30 bg-gray-50/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs dark:text-gray-500 text-gray-500">
                Prezzi verificati il {new Date().toLocaleDateString('it-IT')}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl dark:bg-gray-700/50 bg-gray-200/50 dark:text-gray-300 text-gray-700 font-semibold hover:dark:bg-gray-600/50 hover:bg-gray-300/50 transition-colors backdrop-blur-sm border dark:border-gray-600/50 border-gray-300/50"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>,
    document.body
  )
}
