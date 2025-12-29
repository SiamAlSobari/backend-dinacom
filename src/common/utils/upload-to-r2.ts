// lib/upload-to-r2.ts
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import { r2 } from "./r2.js"
import { R2_BUCKET_NAME } from "./env.js"

export async function uploadImageToR2(file: File): Promise<string> {
  const ext = file.name.split(".").pop()
  const key = `images/${randomUUID()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  )

  return `${process.env.OBJECT_STORAGE_URL}/${key}`
}
