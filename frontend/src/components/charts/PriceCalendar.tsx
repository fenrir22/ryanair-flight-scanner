import React, { useMemo, useState } from 'react'
import type { FlightResult } from '../../types'

interface PriceCalendarProps {
  results: FlightResult[]
}

export const PriceCalendar: React.FC<PriceCalendarProps> = ({ results }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const dates = results.map(r => new Date(r.departureDate + 'T00:00:00'))
    if (dates.length === 0) return new Date()
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    return new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  })

  const priceByDate = useMemo(() => {
    const map = new Map<string, { min: number; avg: number; count: number }>()
    results.forEach(r => {
      if (r.totalPrice === null) return
      const existing = map.get(r.departureDate)
      if (existing) {
        existing.min = Math.min(existing.min, r.totalPrice)
        existing.avg = (existing.avg * existing.count + r.totalPrice) / (existing.count + 1)
        existing.count++
      } else {
        map.set(r.departureDate, { min: r.totalPrice, avg: r.totalPrice, count: 1 })
      }
    })
    return map
  }, [results])

  const allPrices = useMemo(() => {
    return Array.from(priceByDate.values()).map(v => v.min)
  }, [priceByDate])

  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0

  const getColor = (price: number | null) => {
    if (price === null) return ''
    if (maxPrice === minPrice) return 'bg-ryanair-yellow/30'
    const ratio = (price - minPrice) / (maxPrice - minPrice)
    if (ratio < 0.25) return 'bg-green-500/40 dark:bg-green-500/30'
    if (ratio < 0.5) return 'bg-green-400/30 dark:bg-green-400/20'
    if (ratio < 0.75) return 'bg-yellow-400/30 dark:bg-yellow-400/20'
    return 'bg-red-400/30 dark:bg-red-400/20'
  }

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay()
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))
  }

  const days = []
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square"></div>)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const priceData = priceByDate.get(dateStr)
    const price = priceData?.min ?? null

    days.push(
      <div
        key={day}
        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative ${getColor(price)} ${price !== null ? 'cursor-default' : 'dark:bg-gray-800/30 bg-gray-100'}`}
        title={price !== null ? `${dateStr}: ${price.toFixed(2)}€ (min)` : ''}
      >
        <span className={`font-medium ${price !== null ? 'dark:text-white text-gray-900' : 'dark:text-gray-600 text-gray-400'}`}>
          {day}
        </span>
        {price !== null && (
          <span className="text-[10px] font-bold text-gradient">
            {price.toFixed(0)}€
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
      <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>

      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-ryanair-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white text-gray-900">Calendario Prezzi</h3>
            <p className="text-xs dark:text-gray-500 text-gray-500">Prezzi minimi per data di partenza</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="button-secondary p-2 rounded-lg">
            <svg className="w-5 h-5 dark:text-gray-300 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 className="text-lg font-semibold dark:text-white text-gray-900">
            {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </h4>
          <button onClick={nextMonth} className="button-secondary p-2 rounded-lg">
            <svg className="w-5 h-5 dark:text-gray-300 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium dark:text-gray-500 text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/40 dark:bg-green-500/30"></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Economico</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-400/30 dark:bg-yellow-400/20"></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Medio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-400/30 dark:bg-red-400/20"></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Alto</span>
          </div>
        </div>
      </div>
    </div>
  )
}
