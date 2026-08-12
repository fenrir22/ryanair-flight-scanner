export interface AirportInfo {
  code: string
  name: string
  cityName: string
  countryCode: string
  aliases: string[]
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
  resultCount: number
  error: string | null
}

export interface SearchRequest {
  origins: string[]
  destinations: string[]
  departureFrom: string
  departureTo: string
  minStay: number
  maxStay: number
  passengers: number
  currency: string
  tripType: 'round-trip' | 'one-way'
}

export type SortOption = 
  | 'cheapest' 
  | 'most_expensive'
  | 'duration' 
  | 'duration_desc'
  | 'departure' 
  | 'departure_desc'
  | 'price_per_day'
  | 'price_per_day_desc'

export interface SavedSearch {
  id: string
  user_id: string
  name: string
  origins: string[]
  destinations: string[]
  departure_from: string
  departure_to: string
  min_stay: number
  max_stay: number
  passengers: number
  currency: string
  trip_type: 'round-trip' | 'one-way'
  max_price: number | null
  ntfy_topic: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}
