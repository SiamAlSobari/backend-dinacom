import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { authController } from './modules/auth/auth.controller.js'
import { businessController } from './modules/business/business.controller.js'
import { xid } from 'zod'
import { productController } from './modules/product/product.controller.js'
import { transactionController } from './modules/transaction/transaction.controller.js'
import { stockController } from './modules/stock/stock.controller.js'
import { billingController } from './modules/billing/billing.controller.js'
import { aiController } from './modules/ai/ai.controller.js'

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
    return c.json({ success: false, message: err.message }, { status: err.status });
  }
  return c.json({ success: false, message: err.message }, { status: 500 });
});


// Route
app.route('/auth', authController)
app.route('/business', businessController)
app.route('/products', productController)
app.route('/transactions', transactionController)
app.route('/stocks', stockController)
app.route('/billing', billingController)
app.route('/ai', aiController)
// End Route



// Mulai server
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
