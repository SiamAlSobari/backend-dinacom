import { addMonths } from "date-fns";
import crypto from "crypto";
import { MIDTRANS_SERVER_KEY } from "../../common/utils/env.js";
import { PaymentStatus, SubscriptionDuration } from "../../../generated/prisma/enums.js";
import { MIDTRANS_STATUS_MAP } from "../constants/billing.js";

export function mapPaymentStatus(status: string): PaymentStatus {
  switch (status) {
    case "pending":
      return PaymentStatus.PENDING;
    case "capture":
      return PaymentStatus.CAPTURE;
    case "settlement":
      return PaymentStatus.SETTLEMENT;
    case "deny":
      return PaymentStatus.DENY;
    case "cancel":
      return PaymentStatus.CANCEL;
    case "expired":
      return PaymentStatus.EXPIRED;
    default:
      return PaymentStatus.PENDING;
  }
}

export function calcEndDate(duration: SubscriptionDuration) {
  const now = new Date();

  const monthMap: Record<SubscriptionDuration, number> = {
    MONTHLY_1: 1,
    MONTHLY_2: 2,
    MONTHLY_3: 3,
  };

  return addMonths(now, monthMap[duration] ?? 1);
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
) {
  const localSignature = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY)
    .digest("hex");

  return localSignature === signatureKey;
}
