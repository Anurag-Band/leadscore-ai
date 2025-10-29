import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import 'dotenv/config'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'LeadScore AI Backend Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// Error handling
app.onError((err, c) => {
  console.error(`Error: ${err.message}`)
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message
    },
    timestamp: new Date().toISOString()
  }, 500)
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
