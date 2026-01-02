import { MIDTRANS_CLIENT_KEY, MIDTRANS_SERVER_KEY } from './env.js';
import midtransClient from "midtrans-client";

export const snap = new midtransClient.Snap({
  serverKey: MIDTRANS_SERVER_KEY!,
  isProduction: false,
} as any)
