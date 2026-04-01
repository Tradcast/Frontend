import type { Chain } from "viem/chains";

/** Ensure injected wallet is on Celo before viem writeContract (avoids chain id mismatch errors). */
export async function ensureWalletOnCeloChain(options: {
  target: Chain;
  switchChainAsync?: (args: { chainId: number }) => Promise<unknown>;
  getProvider: () => Promise<any>;
}): Promise<void> {
  const { target, switchChainAsync, getProvider } = options;
  const provider = await getProvider();
  if (!provider?.request) {
    throw new Error("Wallet provider not available. Try reconnecting your wallet.");
  }

  const readChainId = async () => {
    const hex = (await provider.request({ method: "eth_chainId" })) as string;
    return parseInt(hex, 16);
  };

  if ((await readChainId()) === target.id) return;

  const trySwitch = async () => {
    if (switchChainAsync) {
      await switchChainAsync({ chainId: target.id });
    } else {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${target.id.toString(16)}` }],
      });
    }
  };

  try {
    await trySwitch();
  } catch (e: any) {
    const code = e?.code ?? e?.data?.originalError?.code;
    const msg = String(e?.message ?? "");
    const needsAdd =
      code === 4902 ||
      msg.includes("Unrecognized chain") ||
      msg.includes("chain not added") ||
      msg.includes("Chain not configured");
    if (needsAdd) {
      const rpc = target.rpcUrls.default.http[0];
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${target.id.toString(16)}`,
            chainName: target.name,
            nativeCurrency: target.nativeCurrency,
            rpcUrls: [rpc],
            blockExplorerUrls: target.blockExplorers?.default?.url
              ? [target.blockExplorers.default.url]
              : [],
          },
        ],
      });
    } else {
      throw e;
    }
  }

  for (let i = 0; i < 48; i++) {
    if ((await readChainId()) === target.id) return;
    await new Promise((r) => setTimeout(r, 250));
  }

  throw new Error(
    "Please switch to the Celo network in your wallet (chain 42220), then try again."
  );
}
