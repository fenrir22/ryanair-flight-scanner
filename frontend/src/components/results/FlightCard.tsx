import React from 'react'
import type { FlightResult } from '../../types'

interface FlightCardProps {
  result: FlightResult
  rank?: number
}

export const FlightCard: React.FC<FlightCardProps> = ({ result, rank }) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
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

  const formatVerifiedAt = (timeStr: string) => {
    try {
      const d = new Date(timeStr)
      return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return timeStr
    }
  }

  const currencySymbol = result.currency === 'EUR' ? '\u20AC' : result.currency
  const isOneWay = result.tripType === 'one-way'

  return (
    <div className={`relative group card-hover-effect rounded-2xl overflow-hidden animate-slide-in ${
      rank === 1 ? 'ring-2 ring-ryanair-yellow/50 shadow-glow' : ''
    }`}>
      {/* Background gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl"></div>
      <div className="absolute inset-0 border border-white/10 rounded-2xl group-hover:border-ryanair-yellow/20 transition-colors"></div>
      
      {/* Badge miglior prezzo */}
      {rank === 1 && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-ryanair-yellow to-ryanair-light text-ryanair-dark text-xs font-bold px-3 py-1 rounded-bl-xl">
            MIGLIOR PREZZO
          </div>
        </div>
      )}

      <div className="relative p-5">
        {/* Tipo viaggio */}
        {isOneWay && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-3">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
            SOLO ANDATA
          </div>
        )}

        {/* Route */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <span className="font-mono font-bold text-green-400 text-sm">{result.origin}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-8 h-px bg-gradient-to-r from-green-500/50 to-red-500/50"></div>
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              <div className="w-8 h-px bg-gradient-to-r from-red-500/50 to-green-500/50"></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="font-mono font-bold text-red-400 text-sm">{result.destination}</span>
            </div>
          </div>
        </div>

        {/* Date e durata */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-lg font-bold text-white">{formatDate(result.departureDate)}</div>
              <div className="text-xs text-gray-500">Partenza</div>
            </div>
            {!isOneWay && result.returnDate && (
              <>
                <div className="flex flex-col items-center">
                  <div className="text-xs text-gray-500">{result.duration} notti</div>
                  <div className="w-16 h-px bg-gray-700 my-1"></div>
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{formatDate(result.returnDate)}</div>
                  <div className="text-xs text-gray-500">Ritorno</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dettagli volo */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          {result.outboundFlightNumber && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/50 rounded-lg">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-gray-400">Andata: {result.outboundFlightNumber}</span>
              <span className="text-gray-500">{formatTime(result.outboundDepartureTime)}-{formatTime(result.outboundArrivalTime)}</span>
            </div>
          )}
          {!isOneWay && result.returnFlightNumber && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/50 rounded-lg">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-gray-400">Ritorno: {result.returnFlightNumber}</span>
              <span className="text-gray-500">{formatTime(result.returnDepartureTime)}-{formatTime(result.returnArrivalTime)}</span>
            </div>
          )}
          {result.outboundFareType && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-ryanair-yellow/10 border border-ryanair-yellow/20 rounded-lg">
              <span className="text-ryanair-yellow">{result.outboundFareType}</span>
            </div>
          )}
        </div>

        {/* Prezzo e azione */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gradient">{currencySymbol}{result.totalPrice?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{result.passengers} pers.</span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-500">Verificato: {formatVerifiedAt(result.verifiedAt)}</span>
            </div>
          </div>
          
          {result.bookingUrl && (
            <a
              href={result.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary px-4 py-2 rounded-xl text-sm text-gray-300 flex items-center gap-2 hover:text-ryanair-yellow"
            >
              Prenota
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
