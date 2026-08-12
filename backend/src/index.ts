import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { registerRoutes } from './routes/index.js'
import { registerSavedSearchRoutes } from './routes/savedSearches.js'
import { loggerOptions } from './logger.js'
import { RyanairAdapter } from './adapters/ryanair/index.js'
import { startScheduler } from './services/scheduler.js'

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '0.0.0.0'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8080'

async function start(): Promise<void> {
  await RyanairAdapter.initialize()

  const app = Fastify({
    logger: loggerOptions,
    bodyLimit: 1048576
  })

  await app.register(cors, {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS']
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  await registerRoutes(app)
  await registerSavedSearchRoutes(app)

  // Start the scheduler for saved searches
  startScheduler()

  app.setErrorHandler((error: any, request, reply) => {
    app.log.error({ error: error.message, url: request.url }, 'Request error')
    reply.status(error.statusCode || 500).send({
      error: error.message || 'Internal server error'
    })
  })

  try {
    await app.listen({ port: PORT, host: HOST })
    app.log.info(`Server running on http://${HOST}:${PORT}`)
  } catch (err) {
    app.log.error(err, 'Failed to start server')
    process.exit(1)
  }
}

start()
