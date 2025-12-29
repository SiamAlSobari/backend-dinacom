import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { authController } from './modules/auth/auth.controller.js'

const app = new Hono()

app.use(logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})
app.get('/health', (c) => {
  return c.text('Hello Hono!')
})

// Middleware cors 
app.use(
    "*",
    cors({
        origin: (origin) => origin ?? "*",
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
    })
);

// Error handle middleware
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  return c.json({ success: false, message: err.message }, { status: 500 });
});

// Route
app.route('/auth', authController)
// End Route



// Mulai server
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
