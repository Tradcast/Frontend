// src/app/page.tsx
"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import type { Connector } from "wagmi";
import { SplashScreen } from "@/components/SplashScreen";

/** Drop duplicate Phantom from EIP-6963 (`app.phantom`) when static `phantom` exists. */
function dedupeConnectors(list: readonly Connector[]): Connector[] {
  const hasStaticPhantom = list.some((c) => c.id === "phantom");
  return list.filter((c) => {
    if (hasStaticPhantom && c.id === "app.phantom") return false;
    return true;
  });
}

/** Prefer MetaMask → Phantom → other extensions → WalletConnect (Valora QR) → generic `injected` last. */
function sortConnectors(list: readonly Connector[]): Connector[] {
  const rank = (c: Connector) => {
    const id = c.id.toLowerCase();
    if (id === "metamasksdk" || id === "io.metamask") return 0;
    if (id === "phantom" || id === "app.phantom") return 1;
    if (id.includes("valora")) return 2;
    if (c.id === "walletConnect") return 25;
    if (c.id === "injected") return 100;
    return 10;
  };
  return [...list].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

function walletButtonClass(c: Connector): string {
  const id = c.id.toLowerCase();
  const base =
    "w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-md disabled:cursor-not-allowed disabled:opacity-50 text-white";
  if (id.includes("metamask")) return `${base} bg-[#f6851b] hover:bg-[#e2761b]`;
  if (id.includes("phantom")) return `${base} bg-gradient-to-r from-[#ab9ff2] to-[#7c3aed]`;
  if (id.includes("valora")) return `${base} bg-[#35d07f] hover:bg-[#2db872]`;
  if (c.id === "walletConnect")
    return `${base} !justify-start pl-4 bg-[#35d07f] hover:bg-[#2db872] ring-2 ring-[#35d07f]/30`;
  if (c.id === "injected") return `${base} bg-gray-700 hover:bg-gray-800`;
  return `${base} bg-slate-600 hover:bg-slate-700`;
}

function connectorLabel(c: Connector, tr: (key: string) => string): string {
  if (c.id === "walletConnect") return tr("connectValoraQr");
  if (c.id === "injected") return tr("connectInjected");
  return c.name;
}

// MetaMask icon component
const MetaMaskIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.61 2L13.19 8.28L14.73 4.58L21.61 2Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.38 2L10.73 8.34L9.27 4.58L2.38 2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.6 16.46L16.37 19.97L21.13 21.28L22.52 16.55L18.6 16.46Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.49 16.55L2.87 21.28L7.63 19.97L5.4 16.46L1.49 16.55Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.37 10.88L6 12.94L10.73 13.16L10.56 8.06L7.37 10.88Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.62 10.88L13.38 8L13.19 13.16L17.99 12.94L16.62 10.88Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.63 19.97L10.43 18.59L8.03 16.58L7.63 19.97Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.56 18.59L16.37 19.97L15.96 16.58L13.56 18.59Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function RootPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const { context, isMiniAppReady, isMiniPay, isWeb, isFarcaster, environment } = useMiniApp();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [statusText, setStatusText] = useState(tc("loading"));
  const [showConnectUI, setShowConnectUI] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const hasAuthenticatedRef = useRef(false);

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const {
    connect,
    connectAsync,
    connectors,
    error: connectError,
    isPending: isConnectPending,
    reset: resetConnect,
  } = useConnect();

  /** Phantom / window.ethereum are undefined until extensions inject — avoid “Provider not found”. */
  const [providerReady, setProviderReady] = useState({
    phantom: false,
    injected: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const w = window as Window & {
        ethereum?: unknown;
        phantom?: { ethereum?: unknown };
      };
      setProviderReady({
        phantom: !!w.phantom?.ethereum,
        injected: !!w.ethereum,
      });
    };
    update();
    window.addEventListener("ethereum#initialized", update);
    const late = window.setTimeout(update, 1600);
    return () => {
      window.removeEventListener("ethereum#initialized", update);
      window.clearTimeout(late);
    };
  }, []);

  const displayConnectors = useMemo(
    () => sortConnectors(dedupeConnectors(connectors)),
    [connectors]
  );
  const browserConnectors = useMemo(() => {
    let list = displayConnectors.filter((c) => c.id !== "walletConnect");
    if (!providerReady.phantom) {
      list = list.filter((c) => c.id !== "phantom" && c.id !== "app.phantom");
    }
    if (!providerReady.injected) {
      list = list.filter((c) => c.id !== "injected");
    }
    return list;
  }, [displayConnectors, providerReady]);
  const valoraWalletConnect = useMemo(
    () => displayConnectors.find((c) => c.id === "walletConnect"),
    [displayConnectors]
  );

  // Show connect UI for web users
  useEffect(() => {
    if (isMiniAppReady && isWeb && !isConnected) {
      console.log('🌐 Web environment - showing connect UI');
      setShowConnectUI(true);
      setIsAuthenticating(false);
    }
  }, [isMiniAppReady, isWeb, isConnected]);

  // Auto-connect wallet for MiniPay and Farcaster
  useEffect(() => {
    // Skip auto-connect for web users - they need to click the button
    if (isWeb) return;
    
    if (!isConnected && !isConnecting && connectors.length > 0) {
      // For MiniPay, use injected connector
      if (isMiniPay) {
        const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'metaMask');
        if (injectedConnector) {
          console.log('🔵 Connecting MiniPay wallet...');
          setStatusText(t("connectingMiniPay"));
          connect({ connector: injectedConnector });
        }
      } 
      // For Farcaster, wait for miniapp ready and use farcaster connector
      else if (isFarcaster && isMiniAppReady) {
        const farcasterConnector = connectors.find(c => c.id === 'farcaster');
        if (farcasterConnector) {
          console.log('🔵 Connecting Farcaster wallet...');
          setStatusText(t("connectingWallet"));
          connect({ connector: farcasterConnector });
        }
      }
    }
  }, [isMiniAppReady, isMiniPay, isFarcaster, isWeb, isConnected, isConnecting, connectors, connect]);

  const handleConnectWallet = useCallback(
    async (connector: Connector) => {
      resetConnect();
      setIsConnectingWallet(true);
      setShowConnectUI(false);
      setIsAuthenticating(true);
      setStatusText(t("connectingWallet"));

      console.log("🌐 Connecting with:", connector.id, connector.name);
      try {
        // Don’t pass chainId here — an immediate network switch often triggers a second prompt
        // and shows up as “User rejected”. Celo is enforced later via ensureWalletOnCeloChain.
        await connectAsync({ connector });
      } catch (err) {
        console.error("Wallet connect failed:", err);
        setShowConnectUI(true);
        setIsAuthenticating(false);
        setIsConnectingWallet(false);
      }
    },
    [connectAsync, resetConnect, t]
  );

  // Surface wagmi connect errors (e.g. user rejected)
  useEffect(() => {
    if (connectError && isWeb) {
      console.error("Connection error:", connectError);
      setShowConnectUI(true);
      setIsAuthenticating(false);
      setIsConnectingWallet(false);
    }
  }, [connectError, isWeb]);

  // Auto-authenticate user and redirect to home
  useEffect(() => {
    const authenticateAndRedirect = async () => {
      // Prevent multiple authentication attempts
      if (hasAuthenticatedRef.current) {
        return;
      }

      // Wait for wallet connection if still connecting
      if (isConnecting) {
        return;
      }

      // Web authentication flow (MetaMask)
      if (isWeb) {
        // Need wallet to be connected for web
        if (!isConnected || !address) {
          console.log('🌐 Web: Waiting for wallet connection...', { isConnected, address });
          return;
        }

        hasAuthenticatedRef.current = true;
        setStatusText(t("authenticating"));
        setShowConnectUI(false);
        console.log('🟢 Web: Authenticating user with wallet:', address);

        try {
          // Generate username from wallet address for web users
          const username = `web_${address.slice(2, 8).toLowerCase()}`;
          
          // Build query parameters
          const params = new URLSearchParams();
          params.append('username', username);
          params.append('fid', address);
          params.append('authType', 'web'); // Indicate web auth type

          // Use regular fetch for web (no Farcaster SDK)
          const profileUrl = `/api/profile?${params.toString()}`;
          console.log('🟢 Web: Calling profile API:', profileUrl);

          const res = await fetch(profileUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          console.log('🟢 Web: GET response status:', res.status);

          if (res.ok) {
            const data = await res.json();
            console.log('✅ Web: User authenticated successfully:', data);

            setTimeout(() => {
              console.log('🟢 Web: Redirecting to /home...');
              router.push('/home');
            }, 500);
          } else {
            const errorText = await res.text();
            console.error('❌ Web: Failed to authenticate user:', res.status, errorText);
            hasAuthenticatedRef.current = false;
            setIsAuthenticating(false);
            setShowConnectUI(true);
          }
        } catch (error) {
          console.error('❌ Web: Error authenticating user:', error);
          hasAuthenticatedRef.current = false;
          setIsAuthenticating(false);
          setShowConnectUI(true);
        }
        return;
      }

      // MiniPay authentication flow
      if (isMiniPay) {
        // Need wallet to be connected for MiniPay
        if (!isConnected || !address) {
          console.log('🟡 MiniPay: Waiting for wallet connection...', { isConnected, address });
          return;
        }

        hasAuthenticatedRef.current = true;
        setStatusText(t("authenticating"));
        console.log('🟢 MiniPay: Authenticating user with wallet:', address);

        try {
          // Generate username from wallet address for MiniPay users
          const username = `minipay_${address.slice(2, 8).toLowerCase()}`;
          
          // Build query parameters (use fid=wallet for backend)
          const params = new URLSearchParams();
          params.append('username', username);
          params.append('fid', address);

          // Use regular fetch for MiniPay (no Farcaster SDK)
          const profileUrl = `/api/profile?${params.toString()}`;
          console.log('🟢 MiniPay: Calling profile API:', profileUrl);

          const res = await fetch(profileUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          console.log('🟢 MiniPay: GET response status:', res.status);

          if (res.ok) {
            const data = await res.json();
            console.log('✅ MiniPay: User authenticated successfully:', data);

            setTimeout(() => {
              console.log('🟢 MiniPay: Redirecting to /home...');
              router.push('/home');
            }, 500);
          } else {
            const errorText = await res.text();
            console.error('❌ MiniPay: Failed to authenticate user:', res.status, errorText);
            hasAuthenticatedRef.current = false;
            setIsAuthenticating(false);
          }
        } catch (error) {
          console.error('❌ MiniPay: Error authenticating user:', error);
          hasAuthenticatedRef.current = false;
          setIsAuthenticating(false);
        }
        return;
      }

      // Farcaster authentication flow
      if (!isMiniAppReady || !context?.user) {
        return;
      }

      hasAuthenticatedRef.current = true;
      setStatusText(t("authenticating"));
      console.log('🟢 Farcaster: Authenticating user...');

      try {
        const user = context.user;
        const username = user.username || user.displayName || '';
        const walletAddress = address ||
          user.verified_addresses?.eth_addresses?.[0] ||
          user.custody ||
          '';

        console.log('🟢 Farcaster: User data:', {
          fid: user.fid,
          username: username,
          displayName: user.displayName,
          wallet: walletAddress,
        });

        // Build query parameters
        const params = new URLSearchParams();
        if (username) params.append('username', username);
        if (walletAddress) params.append('wallet', walletAddress);

        // Use fetch with QuickAuth to GET the profile with username and wallet
        const { sdk } = await import("@farcaster/miniapp-sdk");
        const profileUrl = `/api/profile?${params.toString()}`;
        console.log('🟢 Farcaster: Calling profile API:', profileUrl);

        const res = await sdk.quickAuth.fetch(profileUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('🟢 Farcaster: GET response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          console.log('✅ Farcaster: User authenticated successfully:', data);

          setTimeout(() => {
            console.log('🟢 Farcaster: Redirecting to /home...');
            router.push('/home');
          }, 500);
        } else {
          const errorText = await res.text();
          console.error('❌ Farcaster: Failed to authenticate user:', res.status, errorText);
          hasAuthenticatedRef.current = false;
          setIsAuthenticating(false);
        }
      } catch (error) {
        console.error('❌ Farcaster: Error authenticating user:', error);
        hasAuthenticatedRef.current = false;
        setIsAuthenticating(false);
      }
    };

    authenticateAndRedirect();
  }, [isMiniAppReady, isMiniPay, isWeb, context, router, address, isConnected, isConnecting]);

  // Show connect UI for web users
  if (showConnectUI) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-[#ebeff2] relative overflow-hidden">
          {/* Background candles */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="absolute top-20 left-10 opacity-30" width="50" height="100" viewBox="0 0 50 100">
              <line x1="15" y1="10" x2="15" y2="25" stroke="#bdecf6" strokeWidth="2"/>
              <rect x="9" y="25" width="12" height="35" rx="2" fill="#bdecf6"/>
              <line x1="15" y1="60" x2="15" y2="80" stroke="#bdecf6" strokeWidth="2"/>
            </svg>
            <svg className="absolute top-32 right-8 opacity-25" width="60" height="110" viewBox="0 0 60 110">
              <line x1="20" y1="5" x2="20" y2="20" stroke="#bdecf6" strokeWidth="2"/>
              <rect x="13" y="20" width="14" height="45" rx="2" fill="#bdecf6"/>
              <line x1="20" y1="65" x2="20" y2="85" stroke="#bdecf6" strokeWidth="2"/>
              <line x1="45" y1="30" x2="45" y2="45" stroke="#bdecf6" strokeWidth="2"/>
              <rect x="38" y="45" width="14" height="30" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
              <line x1="45" y1="75" x2="45" y2="95" stroke="#bdecf6" strokeWidth="2"/>
            </svg>
            <svg className="absolute bottom-28 left-6 opacity-20" width="45" height="90" viewBox="0 0 45 90">
              <line x1="22" y1="5" x2="22" y2="20" stroke="#bdecf6" strokeWidth="2"/>
              <rect x="16" y="20" width="12" height="40" rx="2" fill="#bdecf6"/>
              <line x1="22" y1="60" x2="22" y2="80" stroke="#bdecf6" strokeWidth="2"/>
            </svg>
            <svg className="absolute bottom-36 right-12 opacity-30" width="40" height="80" viewBox="0 0 40 80">
              <line x1="20" y1="5" x2="20" y2="15" stroke="#bdecf6" strokeWidth="2"/>
              <rect x="14" y="15" width="12" height="30" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
              <line x1="20" y1="45" x2="20" y2="70" stroke="#bdecf6" strokeWidth="2"/>
            </svg>
          </div>
          
          <div className="w-full max-w-md mx-auto p-8 text-center relative z-10">
            {/* Logo */}
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Trad<span className="text-[#d76afd]">cast</span>
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              {t("tagline")}
            </p>

            {/* Connect Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {t("connectTitle")}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                {t("connectSubtitle")}
              </p>

              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-100/80 text-left">
                <p className="text-[11px] text-amber-950/90 leading-relaxed">
                  {t("walletCostNotice")}
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-left">
                    {t("walletSectionBrowser")}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {browserConnectors.map((connector) => {
                      const isMeta =
                        connector.id.toLowerCase().includes("metamask") ||
                        connector.id === "metaMaskSDK";
                      const isPh =
                        connector.id === "phantom" || connector.id === "app.phantom";
                      return (
                        <button
                          key={connector.uid}
                          type="button"
                          onClick={() => handleConnectWallet(connector)}
                          disabled={isConnectPending || isConnectingWallet}
                          className={walletButtonClass(connector)}
                        >
                          {isMeta ? <MetaMaskIcon /> : null}
                          {!isMeta && isPh ? (
                            <span className="text-lg" aria-hidden>
                              👻
                            </span>
                          ) : null}
                          {isConnectPending || isConnectingWallet
                            ? t("connecting")
                            : connectorLabel(connector, t)}
                        </button>
                      );
                    })}
                  </div>
                  {(!providerReady.phantom || !providerReady.injected) && (
                    <p className="text-[10px] text-gray-400 text-left mt-2 leading-snug">
                      {t("walletExtensionNote")}
                    </p>
                  )}
                </div>

                {valoraWalletConnect ? (
                  <div className="pt-1 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-left">
                      {t("walletSectionMobile")}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleConnectWallet(valoraWalletConnect)}
                      disabled={isConnectPending || isConnectingWallet}
                      className={walletButtonClass(valoraWalletConnect)}
                    >
                      <span className="text-lg" aria-hidden>
                        ◎
                      </span>
                      <span className="flex flex-col items-start text-left leading-tight">
                        <span>
                          {isConnectPending || isConnectingWallet
                            ? t("connecting")
                            : connectorLabel(valoraWalletConnect, t)}
                        </span>
                        <span className="text-[11px] font-normal opacity-90">
                          {t("connectValoraQrSub")}
                        </span>
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>

              <p className="text-gray-400 text-xs mt-4 text-left leading-relaxed">
                {t("walletHint")}
              </p>

              {/* Connection error */}
              {connectError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">
                    {connectError.message?.toLowerCase().includes("user rejected") ||
                    connectError.message?.toLowerCase().includes("rejected the request")
                      ? t("connectUserRejected")
                      : connectError.message || t("connectError")}
                  </p>
                </div>
              )}
            </div>

            {/* Info text */}
            <p className="text-gray-400 text-xs">
              {t("termsAgree")}
            </p>

          </div>
        </section>
      </main>
    );
  }

  // Loading screen (for MiniPay, Farcaster, or after web connect)
  if (isAuthenticating) {
    return <SplashScreen fullScreen={false} message={statusText} />;
  }

  // Error state — auth failed
  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-[#ebeff2]">
        <div className="w-full max-w-md mx-auto p-8 text-center">
          <img src="/icon.png" alt="Tradcast" className="w-28 h-28 mx-auto mb-6 rounded-2xl" />
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">
              {t("authFailed")}
            </p>
            <button
              onClick={() => {
                hasAuthenticatedRef.current = false;
                setIsAuthenticating(true);
                if (isWeb) {
                  setShowConnectUI(true);
                }
              }}
              className="mt-3 px-4 py-2 bg-[#d76afd] hover:bg-[#c055e8] text-white rounded-xl text-sm font-semibold transition-colors shadow-button"
            >
              {tc("retry")}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}