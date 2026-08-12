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
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-ryanair-yellow/30 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        {rank === 1 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-ryanair-yellow/20 text-ryanair-yellow text-xs font-bold rounded-md">
            MIGLIOR PREZZO
          </div>
        )}
        {isOneWay && (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-md">
            SOLO ANDATA
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <span className="font-mono font-bold text-gray-200">{result.origin}</span>
            <span className="text-gray-600">&rarr;</span>
            <span className="font-mono font-bold text-gray-200">{result.destination}</span>
          </div>

          <div className="text-gray-300 mb-2">
            <span className="font-medium">{formatDate(result.departureDate)}</span>
            {!isOneWay && result.returnDate && (
              <>
                <span className="text-gray-600 mx-2">&rarr;</span>
                <span className="font-medium">{formatDate(result.returnDate)}</span>
                {result.duration && <span className="text-gray-500 ml-2">({result.duration} notti)</span>}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {result.outboundFlightNumber && (
              <span>Andata: {result.outboundFlightNumber} {formatTime(result.outboundDepartureTime)}-{formatTime(result.outboundArrivalTime)}</span>
            )}
            {!isOneWay && result.returnFlightNumber && (
              <span>Ritorno: {result.returnFlightNumber} {formatTime(result.returnDepartureTime)}-{formatTime(result.returnArrivalTime)}</span>
            )}
            {result.outboundFareType && (
              <span className="text-ryanair-yellow/70">Tariffa: {result.outboundFareType}</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-ryanair-yellow">
            {currencySymbol}{result.totalPrice?.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {result.passengers} pers. &middot; {result.currency}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-600">
          Verificato: {formatVerifiedAt(result.verifiedAt)}
        </span>
        {result.bookingUrl && (
          <a
            href={result.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-ryanair-blue/30 text-ryanair-yellow text-xs font-medium rounded-lg hover:bg-ryanair-blue/50 transition-colors border border-ryanair-blue/50"
          >
            Vedi volo &rarr;
          </a>
        )}
      </div>
    </div>
  )
}
