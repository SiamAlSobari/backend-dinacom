// lib/r2.ts
import { S3Client } from "@aws-sdk/client-s3"
import { ACCESS_KEY_SECRET, R2_ACCOUNT_ID, R2_KEY_ID } from "./env.js"

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_KEY_ID!,
    secretAccessKey: ACCESS_KEY_SECRET!,
  },
})
