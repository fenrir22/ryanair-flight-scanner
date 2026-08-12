import type { AirportInfo, SearchRequest, SearchProgress } from '../types'

const API_BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export async function searchAirports(query: string): Promise<AirportInfo[]> {
  return fetchJson<AirportInfo[]>(`/airports?q=${encodeURIComponent(query)}`)
}

export async function getAllAirports(): Promise<AirportInfo[]> {
  return fetchJson<AirportInfo[]>('/airports')
}

export async function getDestinations(code: string): Promise<AirportInfo[]> {
  return fetchJson<AirportInfo[]>(`/airports/${code}/destinations`)
}

export async function startSearch(request: SearchRequest): Promise<{ searchId: string }> {
  return fetchJson<{ searchId: string }>('/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
}

export async function getSearchProgress(searchId: string): Promise<SearchProgress> {
  return fetchJson<SearchProgress>(`/search/${searchId}`)
}

export async function cancelSearch(searchId: string): Promise<void> {
  await fetchJson(`/search/${searchId}/cancel`, { method: 'POST' })
}

export function createSearchStream(searchId: string): EventSource {
  return new EventSource(`${API_BASE}/search/${searchId}/stream`)
}

export interface PriceHistoryEntry {
  id: number
  origin: string
  destination: string
  departure_date: string
  return_date: string | null
  min_price: number
  avg_price: number
  currency: string
  recorded_at: string
}

export async function getPriceHistory(
  origin?: string,
  destination?: string,
  days: number = 30
): Promise<PriceHistoryEntry[]> {
  const params = new URLSearchParams()
  if (origin) params.set('origin', origin)
  if (destination) params.set('destination', destination)
  params.set('days', days.toString())
  return fetchJson<PriceHistoryEntry[]>(`/price-history?${params.toString()}`)
}
