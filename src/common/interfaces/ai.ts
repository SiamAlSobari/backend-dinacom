// Shared primitives
export type YMDDateString = `${number}-${number}-${number}` // e.g. "2026-01-09"

// Event types
export interface RestockEvent {
  date: YMDDateString
  qty: number
  note: 'Restock'
}

export interface AdjustmentEvent {
  date: YMDDateString
  qty: number
  reason: 'Adjustment'
}

// Daily sales row
export interface DailySalesRow {
  date: YMDDateString
  qty: number
}

// Stock window info
export interface StockWindow {
  window_start_date: YMDDateString
  window_end_date: YMDDateString
  start_stock_on_hand: number
  current_stock_on_hand: number
}

// Per-product payload
export interface AIProductInput {
  product_id: string
  product_name: string
  unit: string
  image_url: string | null
  stock: StockWindow
  daily_sales: DailySalesRow[]
  events: {
    restocks: RestockEvent[]
    adjustments: AdjustmentEvent[]
  }
}

// Root payload
export interface AIForecastInput {
  business_id: string
  window_days: number
  as_of_date: YMDDateString
  products: AIProductInput[]
}