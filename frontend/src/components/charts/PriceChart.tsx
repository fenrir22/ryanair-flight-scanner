import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { FlightResult } from '../../types'

interface PriceChartProps {
  results: FlightResult[]
}

export const PriceChart: React.FC<PriceChartProps> = ({ results }) => {
  const chartData = useMemo(() => {
    const byDate = new Map<string, number[]>()

    results.forEach(r => {
      if (r.totalPrice === null) return
      const existing = byDate.get(r.departureDate) || []
      existing.push(r.totalPrice)
      byDate.set(r.departureDate, existing)
    })

    return Array.from(byDate.entries())
      .map(([date, prices]) => ({
        date,
        minPrice: Math.min(...prices),
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [results])

  if (chartData.length < 2) return null

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background */}
      <div className="absolute inset-0 dark:from-gray-900/95 dark:to-gray-800/95 from-white to-gray-50 backdrop-blur-xl"></div>
      <div className="absolute inset-0 border dark:border-white/10 border-gray-200 rounded-2xl"></div>
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-ryanair-yellow/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-ryanair-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white text-gray-900">Prezzi per data di partenza</h3>
            <p className="text-xs dark:text-gray-500 text-gray-500">Andamento dei prezzi minimi e medi</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffb71b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ffb71b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#073590" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#073590" stopOpacity={0}/>
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
              tickFormatter={(v) => `\u20AC${v}`}
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
                `\u20AC${value.toFixed(2)}`,
                name === 'minPrice' ? 'Prezzo minimo' : 'Prezzo medio'
              ]}
            />
            <Line
              type="monotone"
              dataKey="minPrice"
              stroke="#ffb71b"
              strokeWidth={3}
              dot={{ fill: '#ffb71b', r: 5, strokeWidth: 2, stroke: '#0c1f3d' }}
              activeDot={{ r: 7, fill: '#ffb71b', stroke: '#fff', strokeWidth: 2 }}
              name="minPrice"
            />
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#073590"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="avgPrice"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-ryanair-yellow"></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Prezzo minimo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-ryanair-blue" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #073590 0, #073590 5px, transparent 5px, transparent 10px)' }}></div>
            <span className="text-xs dark:text-gray-400 text-gray-600">Prezzo medio</span>
          </div>
        </div>
      </div>
    </div>
  )
}
