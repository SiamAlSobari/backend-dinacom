export type ProductSummary = {
  productId: string
  product: string
  currentStock: number
  sold7d: number
  status: "SAFE" | "LOW" | "OUT" | "CRITICAL"
}
