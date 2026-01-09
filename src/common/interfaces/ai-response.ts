export interface AIForecastResponse {
  generated_at: string
  model_version: string
  total_products: number
  llm_enabled: boolean
  llm_success_count: number
  fallback_count: number
  total_tokens_used: number
  portfolio_insights: {
    summary: {
      total_products: number
      high_risk_count: number
      medium_risk_count: number
      restock_needed_count: number
      estimated_total_restock_qty: number
    }
    trends: {
      growing_products: number
      declining_products: number
      high_volatility_products: number
    }
    priority_actions: Array<{
      product_name: string
      risk_level: string
      days_left: number
      priority_score: number
      recommended_qty: string
    }>
    risk_distribution: {
      HIGH: number
      MEDIUM: number
      LOW: number
    }
    ai_summary: {
      pattern_trend_summary: string
      priority_actions: {
        urgent: string
        medium: string
        low: string
      }
    }
  }
  products: Array<{
    product_id: string
    product_name: string
    unit: string
    current_stock: number
    forecast: {
      horizon_days: number
      daily: number[]
      total_demand: number
      average_per_day: number
      method: string
      confidence: number
    }
    stock_analysis: {
      days_until_stockout: number
      risk_level: string
      urgency_score: number
      forecast_reliability: string
    }
    recommendation: {
      action: string
      quantity_range: {
        min: number
        max: number
      }
      reason: string
    }
    business_insights: {
      sales_patterns: {
        trend: string
        volatility: string
        weekend_effect: string
        growth_rate: number
        seasonality: string
        avg_daily_sales: number
        coefficient_of_variation: number
      }
    }
    business_priority: {
      priority_score: number
      priority_tier: string
    }
    ai_insights: {
      reasoning: string
      model: string
      generated_at: string
    }
  }>
}