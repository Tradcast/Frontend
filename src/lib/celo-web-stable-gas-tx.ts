import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import type { Address, Chain, Hash, Hex } from "viem";
import { getCeloRpcUrls } from "@/lib/celo-public-client";

type SendClient = {
  sendTransaction: (args: Record<string, unknown>) => Promise<Hash>;
};

function isUserRejectedWalletError(e: unknown): boolean {
  const x = e as { code?: number; message?: string; name?: string };
  if (x?.code === 4001) return true;
  if (x?.name === "UserRejectedRequestError") return true;
  const m = String(x?.message ?? "").toLowerCase();
  return (
    m.includes("user rejected") ||
    m.includes("user denied") ||
    m.includes("rejected the request")
  );
}

async function delay(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Web MetaMask uses a JSON-RPC account — viem's `writeContract` does not run
 * `prepareTransactionRequest`, so `feeCurrency` never gets EIP-1559 fees estimated
 * in the stablecoin and MetaMask falls back to CELO gas.
 *
 * This prepares a full CIP-64 tx (stable gas) via HTTP, then sends it through the wallet.
 * Tries each configured Celo RPC in order for `prepareTransactionRequest` (CIP-64 often fails on one node).
 * Retries `eth_sendTransaction` on transient wallet/RPC errors.
 *
 * MetaMask often still fails CIP-64 broadcast with “HTTP client error”; use
 * {@link sendCeloWebTxWithStableGasFeeOrCelo} to fall back to `writeContract` (CELO gas).
 * @see https://docs.celo.org/protocol/transaction/erc20-transaction-fees
 */
export async function sendCeloWebTxWithStableGasFee(params: {
  walletClient: SendClient;
  chain: Chain;
  account: Address;
  to: Address;
  data: Hex;
  feeCurrency: Address;
  /** Optional gas limit (e.g. endGameSession uses a fixed cap). */
  gas?: bigint;
}): Promise<Hash> {
  const { walletClient, chain, account, to, data, feeCurrency, gas } = params;

  const urls = getCeloRpcUrls();
  let prepared: Record<string, unknown> | undefined;
  let lastPrepareErr: unknown;

  outer: for (const url of urls) {
    const publicClient = createPublicClient({
      chain: celo,
      transport: http(url, {
        timeout: 35_000,
        retryCount: 2,
        batch: false,
      }),
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // viem's PrepareTransactionRequestParameters can require chain-specific kzg; CIP-64 args are valid at runtime.
        prepared = await publicClient.prepareTransactionRequest({
          account,
          chain: celo,
          to,
          data,
          feeCurrency,
          type: "cip64",
          ...(gas !== undefined ? { gas } : {}),
        } as unknown as Parameters<(typeof publicClient)["prepareTransactionRequest"]>[0]);
        break outer;
      } catch (e) {
        lastPrepareErr = e;
        if (attempt < 2) await delay(400 * (attempt + 1));
      }
    }
  }

  if (!prepared) throw lastPrepareErr;

  // CIP-64 + feeCurrency txs need extra gas vs plain CELO; node estimate can be too low → on-chain OOG.
  const CIP64_FEE_BUFFER = 80_000n;
  let outGas = prepared.gas as bigint | undefined;
  if (outGas !== undefined && outGas !== null) {
    outGas = outGas + CIP64_FEE_BUFFER;
  }

  const sendArgs = {
    ...prepared,
    ...(outGas !== undefined ? { gas: outGas } : {}),
    account,
    chain,
  };

  let lastSendErr: unknown;
  for (let sendAttempt = 0; sendAttempt < 3; sendAttempt++) {
    try {
      return await walletClient.sendTransaction(sendArgs);
    } catch (e) {
      if (isUserRejectedWalletError(e)) throw e;
      lastSendErr = e;
      if (sendAttempt < 2) await delay(500 * (sendAttempt + 1));
    }
  }
  throw lastSendErr;
}

/**
 * Try CIP-64 (stablecoin gas) first; if prepare/send fails (common: MetaMask RPC HTTP error),
 * fall back to normal CELO gas via `sendWithCeloGas` so the flow still completes.
 * Does not fall back if the user rejected the wallet prompt.
 */
export async function sendCeloWebTxWithStableGasFeeOrCelo(params: {
  walletClient: SendClient;
  chain: Chain;
  account: Address;
  to: Address;
  data: Hex;
  feeCurrency: Address | undefined;
  gas?: bigint;
  sendWithCeloGas: () => Promise<Hash>;
}): Promise<Hash> {
  const { feeCurrency, sendWithCeloGas, walletClient, chain, account, to, data, gas } =
    params;

  if (!feeCurrency) return sendWithCeloGas();

  try {
    return await sendCeloWebTxWithStableGasFee({
      walletClient,
      chain,
      account,
      to,
      data,
      feeCurrency,
      gas,
    });
  } catch (e) {
    if (isUserRejectedWalletError(e)) throw e;
    console.warn(
      "[Tradcast] CIP-64 stable gas failed (often MetaMask RPC). Retrying with CELO for network fees.",
      e
    );
    return sendWithCeloGas();
  }
}
