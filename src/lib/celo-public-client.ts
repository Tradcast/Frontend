import { createPublicClient, fallback, http } from "viem";
import { celo } from "viem/chains";

/**
 * Default read RPCs for Celo mainnet. Forno alone often rate-limits or returns HTTP errors;
 * fallback tries the next endpoint (see NEXT_PUBLIC_CELO_RPC_URLS to override / prepend).
 */
/** RPC list for reads + CIP-64 prepare (exported for stable-gas tx). */
export function getCeloRpcUrls(): readonly string[] {
  const raw = process.env.NEXT_PUBLIC_CELO_RPC_URLS?.trim();
  if (raw) {
    const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length > 0) return list;
  }
  return [
    "https://forno.celo.org",
    "https://1rpc.io/celo",
    "https://rpc.ankr.com/celo",
  ] as const;
}

/** Shared HTTP transport with multi-RPC fallback + retries (used for reads & prepareTransactionRequest). */
export function createCeloReadTransport() {
  const urls = getCeloRpcUrls();
  return fallback(
    urls.map((url) =>
      http(url, {
        timeout: 35_000,
        retryCount: 3,
        batch: false,
      })
    ),
    { retryCount: 2 }
  );
}

/** Single public client for Celo mainnet reads and tx preparation (CIP-64 / fee currency). */
export function createCeloPublicClientForApp() {
  return createPublicClient({
    chain: celo,
    transport: createCeloReadTransport(),
  });
}
