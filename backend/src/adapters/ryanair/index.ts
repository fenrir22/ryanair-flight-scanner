import { randomUUID } from 'node:crypto'
import { airports, fares, flights } from '@2bad/ryanair'
import type { Airport, Fare, AvailabilityResponse } from '@2bad/ryanair'
import type { AirportInfo } from '../../types/index.js'
import { logger } from '../../logger.js'
import { translateAirport } from './translations.js'

const MARKET = process.env.MARKET || 'it-it'
const BOOKING_API = `https://www.ryanair.com/api/booking/v4/${MARKET}`

let airportsCache: AirportInfo[] | null = null
let airportsCacheTime = 0
const AIRPORTS_CACHE_TTL = 3600000
let clientVersion = '3.9.0'

async function refreshClientVersion(): Promise<string> {
  try {
    const res = await fetch('https://www.ryanair.com/it/it/', { redirect: 'follow' })
    const html = await res.text()
    const match = html.match(/src="\/homepage_dist\/desktop\/main\.[a-f0-9]+\.js"/)
    if (match) {
      const jsPath = match[0].replace(/src="|"/g, '')
      const jsUrl = `https://www.ryanair.com${jsPath}`
      logger.info({ jsUrl }, 'Fetching Ryanair client JS to extract version')
      const jsRes = await fetch(jsUrl)
      const js = await jsRes.text()
      const versionMatch = js.match(/version:"([^"]+)"/)
      if (versionMatch && versionMatch[1]) {
        clientVersion = versionMatch[1]
        logger.info({ clientVersion }, 'Refreshed Ryanair client version')
        return clientVersion
      }
    }
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Failed to refresh client version')
  }
  return clientVersion
}

async function bookingRequest(url: string, retry = true): Promise<any> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; RyanairFlightScanner/1.0)',
      'client-version': clientVersion,
      'cookie': `fr-correlation-id=${randomUUID()}`
    }
  })

  if (res.status === 409 && retry) {
    logger.warn('Got 409, refreshing client version and retrying')
    await refreshClientVersion()
    return bookingRequest(url, false)
  }

  if (!res.ok) {
    throw new Error(`Booking API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export class RyanairAdapter {
  static async getAirports(): Promise<AirportInfo[]> {
    const now = Date.now()
    if (airportsCache && now - airportsCacheTime < AIRPORTS_CACHE_TTL) {
      return airportsCache
    }

    logger.info('Fetching active airports from Ryanair API')
    const data = await airports.getActive()

    airportsCache = data.map((a: Airport) => {
      const translated = translateAirport(a.code, a.name, a.city.name)
      return {
        code: a.code,
        name: translated.name,
        cityName: translated.cityName,
        countryCode: a.country.code,
        aliases: a.aliases || []
      }
    })
    airportsCacheTime = now

    logger.info(`Cached ${airportsCache.length} airports`)
    return airportsCache
  }

  static async searchAirport(query: string): Promise<AirportInfo[]> {
    const allAirports = await this.getAirports()
    const q = query.toLowerCase().trim()

    if (q.length < 2) return []

    return allAirports.filter(a =>
      a.code.toLowerCase() === q ||
      a.name.toLowerCase().includes(q) ||
      a.cityName.toLowerCase().includes(q) ||
      a.aliases.some((alias: string) => alias.toLowerCase().includes(q))
    ).slice(0, 20)
  }

  static async getDailyFares(
    origin: string,
    destination: string,
    startDate: string,
    endDate: string,
    currency: string
  ): Promise<Fare[]> {
    logger.info({ origin, destination, startDate, endDate }, 'Fetching daily fares')
    return fares.findDailyFaresInRange(
      origin as any,
      destination as any,
      startDate as any,
      endDate as any,
      currency
    )
  }

  static async getAvailableFlights(
    origin: string,
    destination: string,
    dateOut: string,
    dateIn: string,
    passengers: number,
    _currency: string,
    tripType: 'round-trip' | 'one-way' = 'round-trip'
  ): Promise<AvailabilityResponse> {
    const isRoundTrip = tripType === 'round-trip'
    logger.info({ origin, destination, dateOut, dateIn, market: MARKET, tripType }, 'Fetching available flights (IT market)')

    const params = new URLSearchParams({
      ADT: String(passengers),
      CHD: '0',
      INF: '0',
      TEEN: '0',
      DateOut: dateOut,
      DateIn: isRoundTrip ? dateIn : '',
      Origin: origin,
      Destination: destination,
      Disc: '0',
      promoCode: '',
      IncludeConnectingFlights: 'false',
      FlexDaysBeforeOut: '2',
      FlexDaysOut: '2',
      FlexDaysBeforeIn: '2',
      FlexDaysIn: '2',
      RoundTrip: isRoundTrip ? 'true' : 'false',
      ToUs: 'AGREED'
    })

    const url = `${BOOKING_API}/availability?${params.toString()}`
    const data = await bookingRequest(url)

    return data as AvailabilityResponse
  }

  static async getFaresForDateRange(
    origin: string,
    destination: string,
    startDate: string,
    endDate: string,
    currency: string = 'EUR'
  ): Promise<Fare[]> {
    logger.info({ origin, destination, startDate, endDate, currency }, 'Fetching fares for date range')
    try {
      return await fares.findDailyFaresInRange(
        origin as any,
        destination as any,
        startDate as any,
        endDate as any,
        currency
      )
    } catch (err: any) {
      logger.error({ error: err.message, origin, destination }, 'Failed to fetch fares')
      return []
    }
  }

  static async getFlightDates(origin: string, destination: string): Promise<string[]> {
    logger.info({ origin, destination }, 'Fetching available flight dates')
    return flights.getDates(origin as any, destination as any)
  }

  static async getDestinations(originCode: string): Promise<AirportInfo[]> {
    const allAirports = await this.getAirports()
    const destinations = await airports.getDestinations(originCode as any)

    const destCodes = new Set(destinations.map(d => d.arrivalAirport.code))
    return allAirports.filter(a => destCodes.has(a.code))
  }

  static getMarket(): string {
    return MARKET
  }

  static async initialize(): Promise<void> {
    logger.info('Initializing Ryanair adapter...')
    await refreshClientVersion()
    logger.info({ clientVersion }, 'Ryanair adapter initialized')
  }
}
