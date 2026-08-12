import type { SavedSearch } from '../types'

const API_BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export async function getSavedSearches(userId?: string): Promise<SavedSearch[]> {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
  return fetchJson<SavedSearch[]>(`/saved-searches${query}`)
}

export async function getSavedSearch(id: string): Promise<SavedSearch> {
  return fetchJson<SavedSearch>(`/saved-searches/${id}`)
}

export async function createSavedSearch(search: Omit<SavedSearch, 'id' | 'created_at' | 'updated_at'>): Promise<SavedSearch> {
  return fetchJson<SavedSearch>('/saved-searches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(search)
  })
}

export async function updateSavedSearch(id: string, updates: Partial<SavedSearch>): Promise<SavedSearch> {
  return fetchJson<SavedSearch>(`/saved-searches/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await fetchJson(`/saved-searches/${id}`, { method: 'DELETE' })
}
