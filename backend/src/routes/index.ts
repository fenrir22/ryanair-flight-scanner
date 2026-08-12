import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { RyanairAdapter } from '../adapters/ryanair/index.js'
import { startSearch, getSearch, cancelSearch } from '../services/scanner.js'
import { SearchRequestSchema } from '../types/index.js'
import { logger } from '../logger.js'
import { getPriceHistory, getRoutePriceHistory } from '../services/database.js'

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  app.get('/api/airports', async (request: FastifyRequest) => {
    const { q } = request.query as { q?: string }

    if (q && q.length >= 2) {
      return RyanairAdapter.searchAirport(q)
    }

    return RyanairAdapter.getAirports()
  })

  app.get('/api/airports/:code/destinations', async (request: FastifyRequest) => {
    const { code } = request.params as { code: string }
    return RyanairAdapter.getDestinations(code.toUpperCase())
  })

  app.post('/api/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = SearchRequestSchema.safeParse(request.body)

      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: parsed.error.issues
        })
      }

      const searchId = await startSearch(parsed.data)
      return { searchId }
    } catch (err: any) {
      logger.error({ error: err.message }, 'Failed to start search')
      return reply.status(500).send({ error: 'Failed to start search' })
    }
  })

  app.get('/api/search/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const progress = getSearch(id)

    if (!progress) {
      return reply.status(404).send({ error: 'Search not found' })
    }

    return progress
  })

  app.get('/api/search/:id/stream', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    })

    let lastProcessed = -1
    let lastStatus = ''

    const interval = setInterval(() => {
      const progress = getSearch(id)

      if (!progress) {
        reply.raw.write(`data: ${JSON.stringify({ error: 'Search not found' })}\n\n`)
        clearInterval(interval)
        reply.raw.end()
        return
      }

      if (progress.status === 'completed' || progress.status === 'cancelled' || progress.status === 'error') {
        const finalUpdate = {
          type: 'final' as const,
          searchId: progress.searchId,
          status: progress.status,
          totalCombinations: progress.totalCombinations,
          processedCombinations: progress.processedCombinations,
          bestPrice: progress.bestPrice,
          bestResult: progress.bestResult,
          resultCount: progress.results.length,
          error: progress.error,
          results: progress.results
        }

        reply.raw.write(`data: ${JSON.stringify(finalUpdate)}\n\n`)
        clearInterval(interval)
        reply.raw.end()
        return
      }

      if (progress.processedCombinations !== lastProcessed || progress.status !== lastStatus) {
        lastProcessed = progress.processedCombinations
        lastStatus = progress.status

        const update = {
          searchId: progress.searchId,
          status: progress.status,
          totalCombinations: progress.totalCombinations,
          processedCombinations: progress.processedCombinations,
          bestPrice: progress.bestPrice,
          bestResult: progress.bestResult,
          resultCount: progress.results.length,
          error: progress.error
        }

        reply.raw.write(`data: ${JSON.stringify(update)}\n\n`)
      }
    }, 500)

    request.raw.on('close', () => {
      clearInterval(interval)
    })
  })

  app.post('/api/search/:id/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const cancelled = cancelSearch(id)

    if (!cancelled) {
      return reply.status(404).send({ error: 'Search not found' })
    }

    return { success: true }
  })

  app.get('/api/price-history', async (request: FastifyRequest) => {
    const { origin, destination, days } = request.query as { origin?: string; destination?: string; days?: string }
    const daysNum = days ? parseInt(days, 10) : 30

    if (origin && destination) {
      return getPriceHistory(origin.toUpperCase(), destination.toUpperCase(), daysNum)
    }

    return getRoutePriceHistory(daysNum)
  })
}
