import type { Address } from "viem";

/**
 * Celo fee abstraction: gas can be paid in certain ERC-20s via adapter contracts.
 * @see https://docs.celo.org/protocol/transaction/erc20-transaction-fees
 *
 * For USDC/USDT (6 decimals), use the adapter address in `feeCurrency`, not the token.
 * For Mento dollars like USDm (18 decimals), use the token address.
 */
const PAYMENT_TOKEN_TO_FEE_CURRENCY = new Map<string, Address>([
  // USDC → adapter
  [
    "0xceba9300f2b948710d2653dd7b07f33a8b32118c",
    "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
  ],
  // USDT → adapter
  [
    "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    "0x0e2A3e05Bc9a16F5292a6170456A710cB89C6F72",
  ],
  // USDm / Mento (18 decimals): use token as fee currency
  [
    "0x765de816845861e75a25fca122bb6898b8b1282a",
    "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  ],
]);

/** Returns `feeCurrency` for `wallet_writeContract` / `sendTransaction` on Celo, or undefined if unknown. */
export function getCeloFeeCurrencyForPaymentToken(
  paymentTokenAddress: string | undefined
): Address | undefined {
  if (!paymentTokenAddress) return undefined;
  return PAYMENT_TOKEN_TO_FEE_CURRENCY.get(paymentTokenAddress.toLowerCase());
}
