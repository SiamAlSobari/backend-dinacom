import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { HttpException } from './common/utils/error.js'
import { cors } from 'hono/cors'

const app = new Hono()

app.get('/', (c) => {
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
  if (err instanceof HttpException) {
    return c.json({ success: false, message: err.message }, { status: err.status as 400 });
  }
  return c.json({ success: false, message: err.message }, { status: 500 });
});

// Route
 
// End Route
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
