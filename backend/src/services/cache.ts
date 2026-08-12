import type { CacheEntry } from '../types/index.js'

const cache = new Map<string, CacheEntry<any>>()

export function getCacheKey(...parts: string[]): string {
  return parts.join('|')
}

export function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  if (Date.now() - entry.timestamp > ttl * 1000) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCache(): void {
  cache.clear()
}

export function getCacheSize(): number {
  return cache.size
}
