import { useState, useCallback, useRef, useEffect } from 'react'
import type { SearchRequest, SearchProgress, FlightResult } from '../types'
import { startSearch, cancelSearch, createSearchStream, getSearchProgress } from '../api/client'

export function useSearch() {
  const [progress, setProgress] = useState<SearchProgress | null>(null)
  const [results, setResults] = useState<FlightResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const search = useCallback(async (request: SearchRequest) => {
    cleanup()
    setError(null)
    setResults([])
    setIsSearching(true)
    setProgress(null)

    try {
      const { searchId } = await startSearch(request)

      const es = createSearchStream(searchId)
      eventSourceRef.current = es

      es.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'final') {
          setResults(data.results || [])
          setProgress(prev => prev ? { ...prev, ...data, status: data.status } : data)
          setIsSearching(false)
          cleanup()
          return
        }

        setProgress(prev => prev ? { ...prev, ...data } : data)
      }

      es.onerror = async () => {
        es.close()
        eventSourceRef.current = null

        try {
          const finalProgress = await getSearchProgress(searchId)
          setResults(finalProgress.results || [])
          setProgress(finalProgress)
        } catch {
          setError('Connection lost. Please check results manually.')
        }

        setIsSearching(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start search')
      setIsSearching(false)
    }
  }, [cleanup])

  const cancel = useCallback(async () => {
    if (progress?.searchId) {
      try {
        await cancelSearch(progress.searchId)
      } catch {
        // ignore
      }
    }
    cleanup()
    setIsSearching(false)
  }, [progress?.searchId, cleanup])

  return { search, cancel, progress, results, isSearching, error }
}
