import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import 'dotenv/config'
import { errorHandler } from './utils/errorHandler'
import api from './routes'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors())

// Error handling
app.onError(errorHandler)

// Mount API routes
app.route('/', api)

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    message: 'LeadScore AI Backend Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})


// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    },
    timestamp: new Date().toISOString()
  }, 404)
})

const port = Number(process.env.PORT) || 3000

console.log(`🚀 Server starting on port ${port}...`)
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}`)

export default {
  port,
  fetch: app.fetch,
}
