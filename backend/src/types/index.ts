import { z } from 'zod'

export const IataCodeSchema = z.string().length(3).regex(/^[A-Z]{3}$/)

export const SearchRequestSchema = z.object({
  origins: z.array(IataCodeSchema).min(1).max(10),
  destinations: z.array(IataCodeSchema).min(1).max(10),
  departureFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minStay: z.number().int().min(1).max(30).default(3),
  maxStay: z.number().int().min(1).max(30).default(7),
  passengers: z.number().int().min(1).max(9),
  currency: z.string().length(3).default('EUR'),
  tripType: z.enum(['round-trip', 'one-way']).default('round-trip')
})

export type SearchRequest = z.infer<typeof SearchRequestSchema>

export interface DateCombination {
  origin: string
  destination: string
  departureDate: string
  returnDate: string | null
  duration: number | null
}

export interface FlightResult {
  origin: string
  originName: string
  destination: string
  destinationName: string
  departureDate: string
  returnDate: string | null
  duration: number | null
  tripType: 'round-trip' | 'one-way'
  outboundPrice: number | null
  returnPrice: number | null
  totalPrice: number | null
  currency: string
  passengers: number
  outboundFlightNumber: string | null
  returnFlightNumber: string | null
  outboundDepartureTime: string | null
  outboundArrivalTime: string | null
  returnDepartureTime: string | null
  returnArrivalTime: string | null
  outboundFareType: string | null
  returnFareType: string | null
  verifiedAt: string
  bookingUrl: string | null
}

export interface SearchProgress {
  searchId: string
  status: 'pending' | 'scanning' | 'completed' | 'cancelled' | 'error'
  totalCombinations: number
  processedCombinations: number
  bestPrice: number | null
  bestResult: FlightResult | null
  results: FlightResult[]
  error: string | null
}

export interface AirportInfo {
  code: string
  name: string
  cityName: string
  countryCode: string
  aliases: string[]
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
}
