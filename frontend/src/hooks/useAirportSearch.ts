import { useState, useCallback, useRef, useEffect } from 'react'
import type { AirportInfo } from '../types'
import { searchAirports } from '../api/client'

export function useAirportSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AirportInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchAirports(query)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const reset = useCallback(() => {
    setQuery('')
    setResults([])
  }, [])

  return { query, setQuery, results, isLoading, reset }
}
