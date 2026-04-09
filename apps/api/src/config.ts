import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4001),
  APP_NAME: z.string().default("BidWave API"),
  LIVEKIT_API_KEY: z.string().default("devkey"),
  LIVEKIT_API_SECRET: z.string().default("secret"),
  LIVEKIT_WS_URL: z.string().optional()
});

export const config = envSchema.parse(process.env);
