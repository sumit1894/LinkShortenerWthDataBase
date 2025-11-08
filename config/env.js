

import { config } from "dotenv";
import { z } from "zod";
config(); // ✅ loads variables from .env


export const env = z.object({
  PORT: z.coerce.number().default(3000),
}).parse(process.env);


