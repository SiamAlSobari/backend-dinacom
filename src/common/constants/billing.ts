import { PaymentStatus } from "../../../generated/prisma/enums.js";

export const PRICE_MAP = {
  MONTHLY_1: 100_000,
  MONTHLY_2: 180_000,
  MONTHLY_3: 250_000,
} as const;

export const MIDTRANS_STATUS_MAP: Record<string, PaymentStatus> = {
  pending: PaymentStatus.PENDING,
  capture: PaymentStatus.CAPTURE,
  settlement: PaymentStatus.SETTLEMENT,
  deny: PaymentStatus.DENY,
  cancel: PaymentStatus.CANCEL,
  expired: PaymentStatus.EXPIRED,
};

export const SUCCESS_TRANSACTION_STATUS = [
  "settlement",
  "capture",
] as const