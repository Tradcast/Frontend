"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { env } from "@/lib/env";
import { WagmiProvider, createConfig, http } from "wagmi";
import type { CreateConnectorFn } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

// Environment detection helpers
const isBrowser = typeof window !== 'undefined';
const isMiniPay = isBrowser && (window as any).ethereum?.isMiniPay === true;

// Detect if running in Farcaster Frame context
const isFarcasterFrame = isBrowser && (
  // Check for Farcaster frame SDK markers
  window.location !== window.parent.location || // In an iframe
  (window as any).farcaster || // Farcaster SDK present
  window.location.href.includes('warpcast.com') ||
  document.referrer.includes('warpcast.com') ||
  document.referrer.includes('farcaster')
);

// Determine environment type
const getEnvironment = (): 'minipay' | 'farcaster' | 'web' => {
  if (isMiniPay) return 'minipay';
  if (isFarcasterFrame) return 'farcaster';
  return 'web';
};

/** Injected wallet: wait for async injection (extensions that load after first paint). */
const injectedWithShim = () =>
  injected({ unstable_shimAsyncInject: 1500 });

/**
 * Web “other wallets” fallback (`window.ethereum`). `shimDisconnect: false` skips an extra
 * `wallet_requestPermissions` prompt that some browsers surface as “User rejected”.
 */
const injectedWebFallback = () =>
  injected({
    unstable_shimAsyncInject: 1500,
    shimDisconnect: false,
  });

/** Phantom EVM — `window.phantom.ethereum` / `isPhantom` (wagmi target map). */
const phantomInjected = () =>
  injected({ target: "phantom", unstable_shimAsyncInject: 1500 });

function buildWebConnectors(): CreateConnectorFn[] {
  const rawUrl = env.NEXT_PUBLIC_URL?.trim() || "http://localhost:6021";
  const appUrl = rawUrl.replace(/\/$/, "");
  const list: CreateConnectorFn[] = [
    metaMask(),
    phantomInjected(),
  ];

  const wcProjectId = env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
  if (wcProjectId) {
    list.push(
      walletConnect({
        projectId: wcProjectId,
        showQrModal: true,
        metadata: {
          name: "Tradcast",
          description: "Tradcast on Celo",
          url: appUrl,
          icons: [`${appUrl}/icon.png`],
        },
      }) as CreateConnectorFn
    );
  }

  list.push(injectedWebFallback());
  return list;
}

// Build connectors based on environment
const buildConnectors = () => {
  const envType = getEnvironment();

  if (envType === "minipay") {
    // MiniPay injects its own provider at window.ethereum
    return [injectedWithShim()];
  }

  if (envType === "farcaster") {
    return [farcasterMiniApp(), injectedWithShim()];
  }

  // Web: MetaMask, Phantom, optional WalletConnect (Valora QR / mobile), then generic injected.
  // EIP-6963 still adds extra extension connectors (Rabby, …).
  return buildWebConnectors();
};

const config = createConfig({
  chains: [celo, celoAlfajores],
  connectors: buildConnectors(),
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
  /** EIP-6963: discover multiple browser extensions (Phantom, Rabby, …) reliably. */
  multiInjectedProviderDiscovery: true,
  // Required for Next.js App Router — avoids connector/provider errors during SSR and hydration.
  ssr: true,
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
