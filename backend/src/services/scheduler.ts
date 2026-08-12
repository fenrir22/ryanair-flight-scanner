import { getSavedSearches, recordNotification, recordPriceHistory } from './database.js'
import { RyanairAdapter } from '../adapters/ryanair/index.js'
import { sendFlightAlert } from './ntfy.js'
import { buildBookingUrl } from './search.js'
import { logger } from '../logger.js'
import type { Fare } from '@2bad/ryanair'

const SCAN_INTERVAL = parseInt(process.env.SCAN_INTERVAL || '86400000', 10) // 24h default

let schedulerRunning = false

export function startScheduler(): void {
  if (schedulerRunning) return
  
  schedulerRunning = true
  logger.info({ interval: SCAN_INTERVAL }, 'Starting saved searches scheduler')
  
  // Run immediately on start
  runScheduledScans().catch(err => {
    logger.error({ error: err.message }, 'Error in scheduled scan')
  })
  
  // Then run periodically
  setInterval(() => {
    runScheduledScans().catch(err => {
      logger.error({ error: err.message }, 'Error in scheduled scan')
    })
  }, SCAN_INTERVAL)
}

export function stopScheduler(): void {
  schedulerRunning = false
  logger.info('Scheduler stopped')
}

async function runScheduledScans(): Promise<void> {
  if (!schedulerRunning) return
  
  logger.info('Running scheduled scans for saved searches')
  
  const searches = getSavedSearches()
  const enabledSearches = searches.filter(s => s.enabled && s.ntfy_topic)
  
  logger.info({ total: searches.length, enabled: enabledSearches.length }, 'Found saved searches')
  
  for (const search of enabledSearches) {
    try {
      await processSavedSearch(search)
    } catch (error: any) {
      logger.error({ searchId: search.id, error: error.message }, 'Error processing saved search')
    }
  }
  
  logger.info('Scheduled scans completed')
}

async function processSavedSearch(search: any): Promise<void> {
  logger.info({ searchId: search.id, name: search.name }, 'Processing saved search')
  
  // Update dates if they're in the past
  const today = new Date().toISOString().split('T')[0]
  let departureFrom = search.departure_from
  let departureTo = search.departure_to
  
  // If departure_from is in the past, use today
  if (departureFrom < today) {
    departureFrom = today
  }
  
  // If departure_to is in the past, skip this search
  if (departureTo < today) {
    logger.info({ searchId: search.id }, 'Search dates in the past, skipping')
    return
  }
  
  // Fetch fares for each origin-destination pair
  const bestDeals: Array<{
    origin: string
    destination: string
    departureDate: string
    returnDate: string | null
    price: number
  }> = []
  
  for (const origin of search.origins) {
    for (const destination of search.destinations) {
      try {
        const outboundFares = await RyanairAdapter.getFaresForDateRange(
          origin,
          destination,
          departureFrom,
          departureTo,
          search.currency
        )
        
        if (search.trip_type === 'one-way') {
          // For one-way, just check outbound fares
          for (const fare of outboundFares) {
            if (fare.price?.value != null && fare.day) {
              const price = fare.price.value
              
              if (search.max_price == null || price <= search.max_price) {
                bestDeals.push({
                  origin,
                  destination,
                  departureDate: fare.day,
                  returnDate: null,
                  price
                })
              }
            }
          }
        } else {
          // For round-trip, need to check return fares too
          const returnFares = await RyanairAdapter.getFaresForDateRange(
            destination,
            origin,
            departureFrom,
            departureTo,
            search.currency
          )
          
          // Find best combinations
          for (const outFare of outboundFares) {
            if (!outFare.price?.value || !outFare.day) continue
            
            const outDate = new Date(outFare.day)
            
            for (const retFare of returnFares) {
              if (!retFare.price?.value || !retFare.day) continue
              
              const retDate = new Date(retFare.day)
              const daysDiff = Math.ceil((retDate.getTime() - outDate.getTime()) / (1000 * 60 * 60 * 24))
              
              // Check if stay duration is within range
              if (daysDiff >= search.min_stay && daysDiff <= search.max_stay) {
                const totalPrice = outFare.price.value + retFare.price.value
                
                if (search.max_price == null || totalPrice <= search.max_price) {
                  bestDeals.push({
                    origin,
                    destination,
                    departureDate: outFare.day,
                    returnDate: retFare.day,
                    price: totalPrice
                  })
                }
              }
            }
          }
        }
      } catch (error: any) {
        logger.error({ error: error.message, origin, destination }, 'Error fetching fares')
      }
    }
  }
  
  // Sort by price and take top 5
  bestDeals.sort((a, b) => a.price - b.price)
  const topDeals = bestDeals.slice(0, 5)
  
  if (topDeals.length === 0) {
    logger.info({ searchId: search.id }, 'No deals found within price range')
    return
  }
  
  // Record price history for this route
  try {
    const priceHistoryEntries = bestDeals.map(deal => ({
      origin: deal.origin,
      destination: deal.destination,
      departure_date: deal.departureDate,
      return_date: deal.returnDate,
      min_price: deal.price,
      avg_price: deal.price,
      currency: search.currency
    }))
    
    if (priceHistoryEntries.length > 0) {
      recordPriceHistory(priceHistoryEntries)
      logger.info({ searchId: search.id, entries: priceHistoryEntries.length }, 'Recorded price history')
    }
  } catch (err: any) {
    logger.error({ searchId: search.id, error: err.message }, 'Failed to record price history')
  }
  
  // Send notifications for top deals
  logger.info({ searchId: search.id, deals: topDeals.length }, 'Found deals, sending notifications')
  
  for (const deal of topDeals) {
    const bookingUrl = buildBookingUrl(
      deal.origin,
      deal.destination,
      deal.departureDate,
      deal.returnDate,
      search.passengers,
      search.trip_type
    )
    
    const sent = await sendFlightAlert(
      search.ntfy_topic!,
      search.name,
      deal.origin,
      deal.destination,
      deal.departureDate,
      deal.returnDate,
      deal.price,
      search.currency,
      bookingUrl
    )
    
    if (sent) {
      recordNotification(search.id, deal.price, `${deal.origin}→${deal.destination} ${deal.departureDate}`)
    }
  }
}
