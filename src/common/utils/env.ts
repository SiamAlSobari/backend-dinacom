import { config } from "dotenv";

config();

export const JWT_SECRET = process.env.JWT_SECRET!;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
export const R2_KEY_ID= process.env.R2_KEY_ID
export const ACCESS_KEY_SECRET = process.env.ACCESS_KEY_SECRET
export const OBJECT_STORAGE_URL = process.env.OBJECT_STORAGE_URL