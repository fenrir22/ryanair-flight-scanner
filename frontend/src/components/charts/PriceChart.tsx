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
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Prezzi per data di partenza</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(v) => `\u20AC${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6'
            }}
            labelFormatter={formatDate}
            formatter={(value: number, name: string) => [
              `\u20AC${value.toFixed(2)}`,
              name === 'minPrice' ? 'Prezzo min' : 'Prezzo medio'
            ]}
          />
          <Line
            type="monotone"
            dataKey="minPrice"
            stroke="#ffb71b"
            strokeWidth={2}
            dot={{ fill: '#ffb71b', r: 4 }}
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
    </div>
  )
}
