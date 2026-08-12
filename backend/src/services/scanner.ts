import { RyanairAdapter } from '../adapters/ryanair/index.js'
import { getCached, setCache, getCacheKey } from './cache.js'
import {
  generateDateCombinations,
  createSearchProgress,
  buildBookingUrl
} from './search.js'
import type { SearchRequest, FlightResult, SearchProgress, DateCombination } from '../types/index.js'
import { logger } from '../logger.js'
import type { Fare } from '@2bad/ryanair'

const activeSearches = new Map<string, SearchProgress & { abortController: AbortController }>()

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '3', 10)
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10)

async function fetchFaresForRoute(
  origin: string,
  destination: string,
  startDate: string,
  endDate: string,
  currency: string
): Promise<Map<string, number>> {
  const cacheKey = getCacheKey('fares', origin, destination, startDate, endDate, currency)
  const cached = getCached<Map<string, number>>(cacheKey, CACHE_TTL)
  if (cached) return cached

  try {
    const fares = await RyanairAdapter.getFaresForDateRange(origin, destination, startDate, endDate, currency)
    const priceMap = new Map<string, number>()
    
    for (const fare of fares) {
      if (fare.day && fare.price?.value != null) {
        priceMap.set(fare.day, fare.price.value)
      }
    }
    
    setCache(cacheKey, priceMap)
    return priceMap
  } catch (err: any) {
    logger.error({ error: err.message, origin, destination }, 'Failed to fetch fares for route')
    return new Map()
  }
}

export async function startSearch(request: SearchRequest): Promise<string> {
  const searchId = `search_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const tripType = request.tripType || 'round-trip'
  const combinations = generateDateCombinations(
    request.origins,
    request.destinations,
    request.departureFrom,
    request.departureTo,
    request.minStay,
    request.maxStay,
    tripType
  )

  logger.info({
    searchId,
    totalCombinations: combinations.length,
    origins: request.origins,
    destinations: request.destinations,
    tripType
  }, 'Search started')

  const abortController = new AbortController()
  const progress: SearchProgress & { abortController: AbortController } = {
    ...createSearchProgress(searchId, combinations.length),
    abortController
  }

  activeSearches.set(searchId, progress)

  runSearch(searchId, combinations, request, progress).catch(err => {
    logger.error({ searchId, error: err.message }, 'Search failed')
    progress.status = 'error'
    progress.error = err.message
  })

  return searchId
}

async function runSearch(
  searchId: string,
  combinations: DateCombination[],
  request: SearchRequest,
  progress: SearchProgress & { abortController: AbortController }
): Promise<void> {
  progress.status = 'scanning'
  const tripType = request.tripType || 'round-trip'

  // Fetch all fares for each origin-destination pair
  const routeFares = new Map<string, Map<string, number>>()
  const uniqueRoutes = new Set<string>()

  for (const combo of combinations) {
    const routeKey = `${combo.origin}-${combo.destination}`
    if (!uniqueRoutes.has(routeKey)) {
      uniqueRoutes.add(routeKey)
    }
  }

  logger.info({ searchId, uniqueRoutes: uniqueRoutes.size }, 'Fetching fares for routes')

  // Fetch outbound fares
  const outboundFetches = Array.from(uniqueRoutes).map(async (routeKey) => {
    const [origin, destination] = routeKey.split('-')
    const fares = await fetchFaresForRoute(
      origin,
      destination,
      request.departureFrom,
      request.departureTo,
      request.currency
    )
    routeFares.set(routeKey, fares)
  })

  await Promise.all(outboundFetches)

  // Fetch return fares if round-trip
  if (tripType === 'round-trip') {
    const returnRoutes = new Set<string>()
    for (const combo of combinations) {
      if (combo.returnDate) {
        const routeKey = `${combo.destination}-${combo.origin}`
        if (!returnRoutes.has(routeKey)) {
          returnRoutes.add(routeKey)
        }
      }
    }

    const returnFetches = Array.from(returnRoutes).map(async (routeKey) => {
      const [destination, origin] = routeKey.split('-')
      const fares = await fetchFaresForRoute(
        destination,
        origin,
        request.departureFrom,
        request.departureTo,
        request.currency
      )
      routeFares.set(`return-${routeKey}`, fares)
    })

    await Promise.all(returnFetches)
  }

  logger.info({ searchId, routesLoaded: routeFares.size }, 'Routes loaded, processing combinations')

  // Process combinations
  let processed = 0
  for (const combo of combinations) {
    if (progress.abortController.signal.aborted) {
      progress.status = 'cancelled'
      break
    }

    const outboundRouteKey = `${combo.origin}-${combo.destination}`
    const outboundFares = routeFares.get(outboundRouteKey) || new Map()
    const outboundPrice = outboundFares.get(combo.departureDate)

    let totalPrice: number | null = null

    if (tripType === 'one-way') {
      totalPrice = outboundPrice ?? null
    } else if (combo.returnDate) {
      const returnRouteKey = `return-${combo.destination}-${combo.origin}`
      const returnFares = routeFares.get(returnRouteKey) || new Map()
      const returnPrice = returnFares.get(combo.returnDate)

      if (outboundPrice != null && returnPrice != null) {
        totalPrice = outboundPrice + returnPrice
      }
    }

    if (totalPrice != null) {
      const result: FlightResult = {
        origin: combo.origin,
        originName: combo.origin,
        destination: combo.destination,
        destinationName: combo.destination,
        departureDate: combo.departureDate,
        returnDate: combo.returnDate,
        duration: combo.duration,
        tripType,
        outboundPrice: outboundPrice ?? null,
        returnPrice: tripType === 'round-trip' && combo.returnDate 
          ? (routeFares.get(`return-${combo.destination}-${combo.origin}`)?.get(combo.returnDate) ?? null)
          : null,
        totalPrice,
        currency: request.currency,
        passengers: request.passengers,
        outboundFlightNumber: null,
        returnFlightNumber: null,
        outboundDepartureTime: null,
        outboundArrivalTime: null,
        returnDepartureTime: null,
        returnArrivalTime: null,
        outboundFareType: null,
        returnFareType: null,
        verifiedAt: new Date().toISOString(),
        bookingUrl: buildBookingUrl(combo.origin, combo.destination, combo.departureDate, combo.returnDate, request.passengers, tripType)
      }

      progress.results.push(result)

      if (progress.bestPrice === null || totalPrice < progress.bestPrice) {
        progress.bestPrice = totalPrice
        progress.bestResult = result
      }
    }

    processed++
    progress.processedCombinations = processed
  }

  if (!progress.abortController.signal.aborted) {
    progress.status = 'completed'
  }

  logger.info({
    searchId,
    processed,
    totalResults: progress.results.length,
    bestPrice: progress.bestPrice
  }, 'Search completed')

  progress.results.sort((a, b) => {
    const priceA = a.totalPrice ?? Infinity
    const priceB = b.totalPrice ?? Infinity
    return priceA - priceB
  })
}

export function getSearch(searchId: string): SearchProgress | null {
  const search = activeSearches.get(searchId)
  if (!search) return null

  const { abortController, ...progress } = search
  return progress
}

export function cancelSearch(searchId: string): boolean {
  const search = activeSearches.get(searchId)
  if (!search) return false

  search.abortController.abort()
  logger.info({ searchId }, 'Search cancellation requested')
  return true
}

export function cleanupOldSearches(): void {
  for (const [id, search] of activeSearches.entries()) {
    if (search.status === 'completed' || search.status === 'cancelled' || search.status === 'error') {
      activeSearches.delete(id)
    }
  }
}

setInterval(() => cleanupOldSearches(), 60000)
