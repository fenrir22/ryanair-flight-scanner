import { useState, useEffect, useCallback } from 'react'
import type { SearchRequest } from '../types'

export interface SearchHistoryEntry {
  id: string
  request: SearchRequest
  timestamp: number
  resultCount?: number
}

const STORAGE_KEY = 'ryanair_search_history'
const MAX_ENTRIES = 20

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const saveToStorage = useCallback((entries: SearchHistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // ignore
    }
  }, [])

  const addToHistory = useCallback((request: SearchRequest, resultCount?: number) => {
    const entry: SearchHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request,
      timestamp: Date.now(),
      resultCount
    }

    setHistory(prev => {
      const filtered = prev.filter(e => 
        !(e.request.origins.join(',') === request.origins.join(',') &&
          e.request.destinations.join(',') === request.destinations.join(',') &&
          e.request.departureFrom === request.departureFrom &&
          e.request.departureTo === request.departureTo)
      )
      const updated = [entry, ...filtered].slice(0, MAX_ENTRIES)
      saveToStorage(updated)
      return updated
    })
  }, [saveToStorage])

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(e => e.id !== id)
      saveToStorage(updated)
      return updated
    })
  }, [saveToStorage])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveToStorage([])
  }, [saveToStorage])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}
