import React from 'react'
import type { FlightResult } from '../../types'

interface ExportCSVProps {
  results: FlightResult[]
}

export const ExportCSV: React.FC<ExportCSVProps> = ({ results }) => {
  const handleExport = () => {
    const headers = [
      'Origine', 'Destinazione', 'Data Partenza', 'Data Ritorno',
      'Prezzo Andata', 'Prezzo Ritorno', 'Prezzo Totale', 'Valuta',
      'Durata (notti)', 'Passeggeri', 'Volo Andata', 'Volo Ritorno',
      'Orario Partenza Andata', 'Orario Arrivo Andata',
      'Orario Partenza Ritorno', 'Orario Arrivo Ritorno',
      'Tipo Tariffa Andata', 'Tipo Tariffa Ritorno',
      'Tipo Viaggio', 'URL Prenotazione', 'Verificato alle'
    ]

    const rows = results.map(r => [
      `${r.origin} - ${r.originName}`,
      `${r.destination} - ${r.destinationName}`,
      r.departureDate,
      r.returnDate || '',
      r.outboundPrice?.toFixed(2) || '',
      r.returnPrice?.toFixed(2) || '',
      r.totalPrice?.toFixed(2) || '',
      r.currency,
      r.duration?.toString() || '',
      r.passengers.toString(),
      r.outboundFlightNumber || '',
      r.returnFlightNumber || '',
      r.outboundDepartureTime || '',
      r.outboundArrivalTime || '',
      r.returnDepartureTime || '',
      r.returnArrivalTime || '',
      r.outboundFareType || '',
      r.returnFareType || '',
      r.tripType,
      r.bookingUrl || '',
      r.verifiedAt
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ryanair-scanner-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (results.length === 0) return null

  return (
    <button
      onClick={handleExport}
      className="button-secondary px-4 py-2 rounded-xl text-sm dark:text-gray-300 text-gray-700 flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Esporta CSV
    </button>
  )
}
