import { config } from "dotenv";

config();

export const jwtSeccret = process.env.JWT_SECRET!;