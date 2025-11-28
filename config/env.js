

import { config } from "dotenv";
import { z } from "zod";
config(); // ✅ loads variables from .env


export const env = z.object({
  PORT: z.coerce.number().default(3000),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  FRONTEND_URL:z.string().url().trim().min(1),
}).parse(process.env);

