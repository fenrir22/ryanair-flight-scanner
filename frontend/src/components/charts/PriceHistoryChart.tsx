import React, { useEffect, useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getPriceHistory, type PriceHistoryEntry } from '../../api/client'

interface PriceHistoryChartProps {
  origin?: string
  destination?: string
  days?: number
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ 
  origin, 
  destination, 
  days = 30 
}) => {
  const [data, setData] = useState<PriceHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getPriceHistory(origin, destination, days)
        setData(result)
      } catch (err: any) {
        setError(err.message || 'Errore nel caricamento dello storico prezzi')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [origin, destination, days])

  const chartData = useMemo(() => {
    const byDate = new Map<string, { min: number; avg: number; count: number }>()

    data.forEach(entry => {
      const date = entry.recorded_at.split('T')[0]
      const existing = byDate.get(date)
      if (existing) {
        existing.min = Math.min(existing.min, entry.min_price)
        existing.avg = (existing.avg * existing.count + entry.min_price) / (existing.count + 1)
        existing.count++
      } else {
        byDate.set(date, { min: entry.min_price, avg: entry.min_price, count: 1 })
      }
    })

    return Array.from(byDate.entries())
      .map(([date, values]) => ({
        date,
        minPrice: Math.round(values.min * 100) / 100,
        avgPrice: Math.round(values.avg * 100) / 100
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
        <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>
        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-ryanair-yellow animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">Storico Prezzi</h3>
              <p className="text-xs dark:text-gray-500 text-gray-500">Caricamento dati...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
        <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>
        <div className="relative p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">Errore</h3>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (chartData.length < 2) {
    return (
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
        <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>
        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-ryanair-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white text-gray-900">Storico Prezzi</h3>
              <p className="text-xs dark:text-gray-500 text-gray-500">Andamento dei prezzi nel tempo</p>
            </div>
          </div>
          <div className="py-8 text-center">
            <p className="dark:text-gray-400 text-gray-600">
              {origin && destination 
                ? `Nessuno storico disponibile per ${origin} → ${destination}`
                : 'Nessuno storico prezzi disponibile. I dati verranno raccolti dalle ricerche salvate.'}
            </p>
          </div>
        </div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white text-gray-900">
              Storico Prezzi {origin && destination && `• ${origin} → ${destination}`}
            </h3>
            <p className="text-xs dark:text-gray-500 text-gray-500">Andamento dei prezzi negli ultimi {days} giorni</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorMinHistory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(v) => `€${v}`}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#f3f4f6',
                backdropFilter: 'blur(8px)'
              }}
              labelFormatter={formatDate}
              formatter={(value: number, name: string) => [
                `€${value.toFixed(2)}`,
                name === 'minPrice' ? 'Prezzo minimo' : 'Prezzo medio'
              ]}
            />
            <Legend
              formatter={(value) => value === 'minPrice' ? 'Prezzo minimo' : 'Prezzo medio'}
            />
            <Line
              type="monotone"
              dataKey="minPrice"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ fill: '#22c55e', r: 4, strokeWidth: 2, stroke: '#0c1f3d' }}
              activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
              name="minPrice"
            />
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="avgPrice"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
