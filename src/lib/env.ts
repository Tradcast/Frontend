import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// https://env.t3.gg/docs/nextjs
export const env = createEnv({
  server: {
    JWT_SECRET: z.string().min(1).optional().default("build-time-placeholder"),
  },
  client: {
    NEXT_PUBLIC_URL: z.string().min(1).optional().default("http://localhost:6021"),
    NEXT_PUBLIC_APP_ENV: z
      .enum(["development", "production"])
      .optional()
      .default("development"),
    NEXT_PUBLIC_FARCASTER_HEADER: z.string().min(1).optional().default("build-time-placeholder"),
    NEXT_PUBLIC_FARCASTER_PAYLOAD: z.string().min(1).optional().default("build-time-placeholder"),
    NEXT_PUBLIC_FARCASTER_SIGNATURE: z.string().min(1).optional().default("build-time-placeholder"),
    // WebSocket URL for trading area (full wss:// URL). Backed by TRADE_WS_URL in .env.
    NEXT_PUBLIC_TRADE_WS_URL: z
      .string()
      .min(1)
      .optional()
      .default("wss://api.tradcast.xyz/ws"),
    /** Reown / WalletConnect Cloud — enables Valora & other mobile wallets via QR. https://cloud.reown.com */
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional().default(""),
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_FARCASTER_HEADER: process.env.NEXT_PUBLIC_FARCASTER_HEADER,
    NEXT_PUBLIC_FARCASTER_PAYLOAD: process.env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
    NEXT_PUBLIC_FARCASTER_SIGNATURE: process.env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
    NEXT_PUBLIC_TRADE_WS_URL:
      process.env.TRADE_WS_URL ?? process.env.NEXT_PUBLIC_TRADE_WS_URL,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  },
});
