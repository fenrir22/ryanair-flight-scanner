import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  createSavedSearch,
  getSavedSearches,
  getSavedSearch,
  updateSavedSearch,
  deleteSavedSearch
} from '../services/database.js'
import { logger } from '../logger.js'

const CreateSavedSearchSchema = z.object({
  user_id: z.string().min(1),
  name: z.string().min(1),
  origins: z.array(z.string().length(3)).min(1),
  destinations: z.array(z.string().length(3)).min(1),
  departure_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departure_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  min_stay: z.number().int().min(1).max(30),
  max_stay: z.number().int().min(1).max(30),
  passengers: z.number().int().min(1).max(9).default(1),
  currency: z.string().length(3).default('EUR'),
  trip_type: z.enum(['round-trip', 'one-way']).default('round-trip'),
  max_price: z.number().positive().nullable().optional(),
  ntfy_topic: z.string().min(1).nullable().optional(),
  enabled: z.boolean().default(true)
})

const UpdateSavedSearchSchema = CreateSavedSearchSchema.partial()

export async function registerSavedSearchRoutes(app: FastifyInstance): Promise<void> {
  // Get all saved searches for a user
  app.get('/api/saved-searches', async (request: FastifyRequest, reply: FastifyReply) => {
    const { user_id } = request.query as { user_id?: string }
    
    try {
      const searches = user_id ? getSavedSearches(user_id) : getSavedSearches()
      return searches
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error fetching saved searches')
      return reply.status(500).send({ error: 'Failed to fetch saved searches' })
    }
  })

  // Get a specific saved search
  app.get('/api/saved-searches/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    
    try {
      const search = getSavedSearch(id)
      if (!search) {
        return reply.status(404).send({ error: 'Saved search not found' })
      }
      return search
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error fetching saved search')
      return reply.status(500).send({ error: 'Failed to fetch saved search' })
    }
  })

  // Create a new saved search
  app.post('/api/saved-searches', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = CreateSavedSearchSchema.safeParse(request.body)
      
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: parsed.error.issues
        })
      }
      
      const search = createSavedSearch({
        ...parsed.data,
        max_price: parsed.data.max_price ?? null,
        ntfy_topic: parsed.data.ntfy_topic ?? null
      })
      logger.info({ searchId: search.id, name: search.name }, 'Saved search created')
      
      return reply.status(201).send(search)
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error creating saved search')
      return reply.status(500).send({ error: 'Failed to create saved search' })
    }
  })

  // Update a saved search
  app.put('/api/saved-searches/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    
    try {
      const parsed = UpdateSavedSearchSchema.safeParse(request.body)
      
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: parsed.error.issues
        })
      }
      
      const search = updateSavedSearch(id, parsed.data)
      if (!search) {
        return reply.status(404).send({ error: 'Saved search not found' })
      }
      
      logger.info({ searchId: id }, 'Saved search updated')
      return search
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error updating saved search')
      return reply.status(500).send({ error: 'Failed to update saved search' })
    }
  })

  // Delete a saved search
  app.delete('/api/saved-searches/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    
    try {
      const deleted = deleteSavedSearch(id)
      if (!deleted) {
        return reply.status(404).send({ error: 'Saved search not found' })
      }
      
      logger.info({ searchId: id }, 'Saved search deleted')
      return { success: true }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error deleting saved search')
      return reply.status(500).send({ error: 'Failed to delete saved search' })
    }
  })
}
