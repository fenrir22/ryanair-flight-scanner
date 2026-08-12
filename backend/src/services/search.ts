import type { DateCombination, FlightResult, SearchProgress } from '../types/index.js'

export function generateDateCombinations(
  origins: string[],
  destinations: string[],
  departureFrom: string,
  departureTo: string,
  minStay: number,
  maxStay: number,
  tripType: 'round-trip' | 'one-way' = 'round-trip'
): DateCombination[] {
  const combinations: DateCombination[] = []
  const from = new Date(departureFrom)
  const to = new Date(departureTo)

  for (const origin of origins) {
    for (const destination of destinations) {
      const current = new Date(from)
      while (current <= to) {
        const depDate = current.toISOString().split('T')[0]

        if (tripType === 'one-way') {
          combinations.push({
            origin,
            destination,
            departureDate: depDate,
            returnDate: null,
            duration: null
          })
        } else {
          for (let stay = minStay; stay <= maxStay; stay++) {
            const returnDate = new Date(current)
            returnDate.setDate(returnDate.getDate() + stay)
            const retDate = returnDate.toISOString().split('T')[0]

            combinations.push({
              origin,
              destination,
              departureDate: depDate,
              returnDate: retDate,
              duration: stay
            })
          }
        }

        current.setDate(current.getDate() + 1)
      }
    }
  }

  return combinations
}

export function createSearchProgress(searchId: string, totalCombinations: number): SearchProgress {
  return {
    searchId,
    status: 'pending',
    totalCombinations,
    processedCombinations: 0,
    bestPrice: null,
    bestResult: null,
    results: [],
    error: null
  }
}

export function buildBookingUrl(
  origin: string,
  destination: string,
  dateOut: string,
  dateIn: string | null,
  passengers: number,
  tripType: 'round-trip' | 'one-way' = 'round-trip'
): string {
  const market = (process.env.MARKET || 'it-it').replace('-', '/')
  const isReturn = tripType === 'round-trip'

  const params = new URLSearchParams({
    adults: String(passengers),
    teens: '0',
    children: '0',
    infants: '0',
    dateOut: dateOut,
    dateIn: dateIn || '',
    isConnectedFlight: 'false',
    discount: '0',
    promoCode: '',
    isReturn: String(isReturn),
    originIata: origin,
    destinationIata: destination,
    tpAdults: String(passengers),
    tpTeens: '0',
    tpChildren: '0',
    tpInfants: '0',
    tpStartDate: dateOut,
    tpEndDate: dateIn || '',
    tpDiscount: '0',
    tpPromoCode: '',
    tpOriginIata: origin,
    tpDestinationIata: destination
  })

  return `https://www.ryanair.com/${market}/trip/flights/select?${params.toString()}`
}

export function extractFlightInfo(result: FlightResult, availabilityData: any): FlightResult {
  if (!availabilityData?.trips?.length) return result

  const trip = availabilityData.trips[0]
  if (!trip?.dates?.length) return result

  const flightDate = trip.dates[0]
  if (!flightDate?.flights?.length) return result

  const flight = flightDate.flights[0]
  if (!flight) return result

  const segments = flight.segments || []
  const outboundSeg = segments[0]
  const returnSeg = segments[1]

  const regularFare = flight.regularFare
  const fareAmount = regularFare?.fares?.[0]?.amount ?? null
  const fareType = regularFare?.fareClass ?? regularFare?.fares?.[0]?.type ?? null

  return {
    ...result,
    totalPrice: fareAmount ?? result.totalPrice,
    outboundFlightNumber: outboundSeg?.flightNumber ?? null,
    returnFlightNumber: returnSeg?.flightNumber ?? null,
    outboundDepartureTime: outboundSeg?.time?.[0] ?? null,
    outboundArrivalTime: outboundSeg?.time?.[1] ?? null,
    returnDepartureTime: returnSeg?.time?.[0] ?? null,
    returnArrivalTime: returnSeg?.time?.[1] ?? null,
    outboundFareType: fareType,
    returnFareType: fareType
  }
}
