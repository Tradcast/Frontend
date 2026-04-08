// src/app/home/page.tsx
"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useMenu } from "@/contexts/menu-context";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useConnectors, useWaitForTransactionReceipt, useReadContract, useBalance, useConfig, useSwitchChain } from "wagmi";
import { celo } from "wagmi/chains";
import {
  createWalletClient,
  custom,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  type Hash,
} from "viem";
import gameABI from "@/app/game_abi";
import tokenABI from "@/app/token_abi";
import { getAuthFetch } from "@/lib/auth-fetch";
import { HowToPlayOverlay } from "@/components/HowToPlayOverlay";
import { SplashScreen } from "@/components/SplashScreen";
import { useNotifications } from "@/contexts/notification-context";
import { ensureWalletOnCeloChain } from "@/lib/ensure-celo-chain";
import { getCeloFeeCurrencyForPaymentToken } from "@/lib/celo-fee-currency";
import { sendCeloWebTxWithStableGasFeeOrCelo } from "@/lib/celo-web-stable-gas-tx";
import { createCeloPublicClientForApp } from "@/lib/celo-public-client";

// Contract addresses
const GAME_CONTRACT_ADDRESS = "0x2AF88995303B5e02b705A904e478729CD9ABc319" as `0x${string}`;
const TOKEN_CONTRACT_ADDRESS = "0x346528259cdF48fa1e5B23194828B477362B80f0" as `0x${string}`; // TradCastPoint

// Accepted payment stablecoins (tried in order: USDC → USDT → USDm)
const PAYMENT_TOKENS = [
  { address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as `0x${string}`, symbol: "USDC", decimals: 6 },
  { address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`, symbol: "USDT", decimals: 6 },
  { address: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`, symbol: "USDm", decimals: 18 },
] as const;

// Use Celo mainnet as default (or celoAlfajores for testnet)
const TARGET_CHAIN = celo; // Change to celoAlfajores for testnet

const LightningIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-white">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const TelegramIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21.7 3.4a1 1 0 0 0-1-.14L2.6 10.2a1 1 0 0 0 .06 1.88l4.1 1.5 1.54 5.06a1 1 0 0 0 1.8.27l2.4-3.13 3.9 2.87a1 1 0 0 0 1.57-.62l3-13.6a1 1 0 0 0-.23-.91ZM8.4 13.2l9.45-6.45-7.95 7.64-.4 1.9-1.1-3.09Z"/>
  </svg>
);

const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const TrophyIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const UserIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function HomePage() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");
  const { context, isMiniAppReady, isMiniPay, isWeb, isFarcaster } = useMiniApp();
  const { isMenuOpen } = useMenu();
  const { setNotificationsFromApi } = useNotifications();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refreshTpoints = searchParams.get('refreshTpoints') === '1';
  const expectedMintWeiParam = searchParams.get('expectedMintWei');
  const preMintBalanceWeiParam = searchParams.get('preMintBalanceWei');
  // Farcaster SDK state
  const [fcReady, setFcReady] = useState(false);
  const [fcContext, setFcContext] = useState<any>(null);
  // Wallet state
  const { address, isConnected, isConnecting, connector: activeConnector } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { switchChainAsync } = useSwitchChain();

  // Energy state from backend
  const [energy, setEnergy] = useState<number | null>(null);
  const [dailyGames, setDailyGames] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [giveawayEligible, setGiveawayEligible] = useState<boolean | null>(null);
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(true);
  
  // Quarter countdown state (counts down to next 0, 15, 30, 45 minute mark)
  const [quarterCountdown, setQuarterCountdown] = useState({ minutes: 0, seconds: 0 });
  
  // Tournament countdown state
  const TOURNAMENT_START = new Date('2026-04-01T00:00:00Z').getTime();
  const TOURNAMENT_END = new Date('2026-05-01T00:00:00Z').getTime();
  const [tournamentStatus, setTournamentStatus] = useState<'upcoming' | 'active' | 'ended'>('upcoming');
  const [tournamentCountdown, setTournamentCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Game session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [startGameError, setStartGameError] = useState<string | null>(null);
  const [startGameStatus, setStartGameStatus] = useState<string | null>(null);
  const [apiUsername, setApiUsername] = useState<string | null>(null);
  
  // Get wagmi config for wallet client
  const config = useConfig();
  const [txHash, setTxHash] = useState<Hash | undefined>(undefined);
  /** Passed to tradearea so exit-tx can use the same Celo fee currency (stablecoin gas on web). */
  const paymentTokenForSessionRef = React.useRef<string | null>(null);
  
  const currentHash = txHash;
  
  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: currentHash,
  });
  
  // Read token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });
  const [isMintSyncPending, setIsMintSyncPending] = useState(false);

  // Read CELO balance (native token for gas)
  const { data: celoBalanceData } = useBalance({
    address: address,
    query: {
      enabled: false,
    },
  });

  // Entry cost: 0.01 stablecoin (1 cent). Amount is computed per-token due to different decimals.

  // Environment is now detected via useMiniApp hook (isMiniPay, isWeb)
  // Set fcReady based on environment
  useEffect(() => {
    if (isMiniPay) {
      console.log('🟡 MiniPay environment detected on home page');
      setFcReady(true);
    } else if (isWeb) {
      console.log('🌐 Web environment detected on home page');
      setFcReady(true);
    }
  }, [isMiniPay, isWeb]);

  /* ------------------- Farcaster SDK Init ------------------- */
  useEffect(() => {
    // Skip Farcaster SDK init for MiniPay and Web
    if (fcReady || isMiniPay || isWeb) return;
    const initFarcaster = async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        await sdk.actions.ready();
        const context = await sdk.context;
        console.log("✅ Farcaster context:", context);
        setFcContext(context);
        setFcReady(true);
      } catch (err) {
        console.warn("Not inside Farcaster or SDK not found:", err);
        // If Farcaster fails, still allow the app to work (might be MiniPay or browser)
        setFcReady(true);
      }
    };
    initFarcaster();
  }, [fcReady, isMiniPay, isWeb]);

  /* ------------------- Auto-connect Wallet ------------------- */
  const hasAttemptedFrameConnect = React.useRef(false);
  useEffect(() => {
    if (isConnected || isConnecting || hasAttemptedFrameConnect.current) return;
    
    // MiniPay wallet connection
    if (isMiniPay) {
      const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'metaMask');
      if (injectedConnector) {
        hasAttemptedFrameConnect.current = true;
        console.log("🟡 Auto-connecting to MiniPay wallet...");
        connect({ connector: injectedConnector });
      }
      return;
    }

    // Web users - don't auto-connect, they should already be connected from landing page
    // But if they somehow got here without connecting, redirect to landing
    if (isWeb) {
      console.log("🌐 Web user on home page - wallet should already be connected");
      if (!isConnected && !isConnecting) {
        // Give it a moment, then redirect if still not connected
        setTimeout(() => {
          if (!isConnected) {
            console.log("🌐 Web user not connected - redirecting to landing");
            router.push('/');
          }
        }, 1000);
      }
      return;
    }
    
    // Farcaster wallet connection
    if (!fcReady) return;
    const frameConnector = connectors.find(c =>
      /frame|farcaster/i.test(c.id + c.name)
    );
    if (frameConnector) {
      hasAttemptedFrameConnect.current = true;
      console.log("Auto-connecting to Farcaster Frame wallet...");
      
      setTimeout(() => {
        connect({ connector: frameConnector });
      }, 0);
    }
  }, [fcReady, isMiniPay, isWeb, isConnected, isConnecting, connectors, connect, router]);
  
  // Helper function to make authenticated API calls (works for Farcaster, MiniPay, and Web)
  const authFetch = React.useCallback(
    (url: string, options: RequestInit = {}) => {
      return getAuthFetch(address, isMiniPay, isWeb)(url, options);
    },
    [address, isMiniPay, isWeb]
  );

  /* ------------------- Refetch TPOINT balance on mount & focus ------------------- */
  useEffect(() => {
    if (isConnected && address) {
      refetchBalance();
    }
    const refetchOnFocus = () => {
      if (isConnected && address) refetchBalance();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refetchOnFocus();
    };
    window.addEventListener('focus', refetchOnFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', refetchOnFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isConnected, address, refetchBalance]);

  /* ------------------- Burst refresh after paid game exit ------------------- */
  useEffect(() => {
    if (!refreshTpoints || !isConnected || !address) return;

    // Re-query a few times because mint visibility can lag by a block.
    const delaysMs = [0, 1200, 2500, 4500];
    const timers = delaysMs.map((delay) =>
      setTimeout(() => {
        refetchBalance();
      }, delay)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [refreshTpoints, isConnected, address, refetchBalance]);

  /* ------------------- Mint sync status (paid game return) ------------------- */
  useEffect(() => {
    if (!refreshTpoints) {
      setIsMintSyncPending(false);
      return;
    }

    let expectedMintWei = 0n;
    let preMintBalanceWei = 0n;
    try {
      expectedMintWei = expectedMintWeiParam ? BigInt(expectedMintWeiParam) : 0n;
      preMintBalanceWei = preMintBalanceWeiParam ? BigInt(preMintBalanceWeiParam) : 0n;
    } catch {
      setIsMintSyncPending(false);
      return;
    }

    if (expectedMintWei <= 0n) {
      setIsMintSyncPending(false);
      return;
    }

    const targetBalanceWei = preMintBalanceWei + expectedMintWei;
    const currentBalanceWei = typeof tokenBalance === 'bigint' ? tokenBalance : null;
    setIsMintSyncPending(currentBalanceWei !== null && currentBalanceWei < targetBalanceWei);
  }, [refreshTpoints, expectedMintWeiParam, preMintBalanceWeiParam, tokenBalance]);

  /* ------------------- Poll while mint is pending ------------------- */
  useEffect(() => {
    if (!isMintSyncPending || !isConnected || !address) return;

    const interval = setInterval(() => {
      refetchBalance();
    }, 1000);

    const timeout = setTimeout(() => {
      setIsMintSyncPending(false);
    }, 20000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isMintSyncPending, isConnected, address, refetchBalance]);

  /* ------------------- Fetch Energy from Backend ------------------- */
  useEffect(() => {
    const fetchEnergy = async () => {
      if (!fcReady || !isMiniAppReady) return;
      // For MiniPay and Web, also need wallet address
      if ((isMiniPay || isWeb) && !address) return;
      
      setIsLoadingEnergy(true);
      try {
        console.log('🟢 Fetching energy from backend...');
        const res = await authFetch('/api/home', {
          method: 'GET',
        });
        // Also call verify endpoint
        await authFetch('/api/verify', {
          method: 'POST',
        });

        if (res.ok) {
          const data = await res.json();
          console.log('✅ Energy data received:', data);
          if (data.energy !== undefined) {
            setEnergy(data.energy);
          }
          if (data.daily_games !== undefined) {
            setDailyGames(data.daily_games);
          }
          if (data.username) {
            setApiUsername(data.username);
          }
          if (data.streak_days !== undefined) {
            setStreakDays(data.streak_days);
          }
          if (data.giveaway_eligible !== undefined) {
            setGiveawayEligible(data.giveaway_eligible);
          }
          if (data.notification) {
            const notifs = Array.isArray(data.notification) ? data.notification : [];
            setNotificationsFromApi(notifs, data.notifications_read !== false);
          }
        } else {
          console.error('❌ Failed to fetch energy:', res.status);
        }
      } catch (error) {
        console.error('❌ Error fetching energy:', error);
      } finally {
        setIsLoadingEnergy(false);
      }
    };
    fetchEnergy();
  }, [fcReady, isMiniAppReady, isMiniPay, isWeb, address, authFetch]);
  
  // Quarter countdown effect
  useEffect(() => {
    const refreshEnergy = async () => {
      if (!fcReady || !isMiniAppReady) return;
      if ((isMiniPay || isWeb) && !address) return;
      
      try {
        console.log('🔄 Refreshing energy (quarter reached)...');
        const res = await authFetch('/api/home', {
          method: 'GET',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.energy !== undefined) {
            setEnergy(data.energy);
            console.log('✅ Energy refreshed:', data.energy);
          }
          if (data.giveaway_eligible !== undefined) {
            setGiveawayEligible(data.giveaway_eligible);
          }
        }
      } catch (error) {
        console.error('❌ Error refreshing energy:', error);
      }
    };

    const calculateQuarterCountdown = () => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();
      
      const quarters = [0, 15, 30, 45];
      let nextQuarter = quarters.find(q => q > currentMinute);
      
      if (nextQuarter === undefined) {
        nextQuarter = 60;
      }
      
      const minutesLeft = nextQuarter - currentMinute - 1;
      const secondsLeft = 60 - currentSecond;
      
      if (minutesLeft <= 0 && secondsLeft <= 1) {
        refreshEnergy();
      }
      
      if (secondsLeft === 60) {
        setQuarterCountdown({ minutes: minutesLeft + 1, seconds: 0 });
      } else {
        setQuarterCountdown({ minutes: minutesLeft < 0 ? 0 : minutesLeft, seconds: secondsLeft });
      }
    };
    
    calculateQuarterCountdown();
    const timer = setInterval(calculateQuarterCountdown, 1000);
    
    return () => clearInterval(timer);
  }, [fcReady, isMiniAppReady]);
  
  // Tournament countdown effect
  useEffect(() => {
    const calculateTournamentCountdown = () => {
      const now = Date.now();
      
      if (now < TOURNAMENT_START) {
        setTournamentStatus('upcoming');
        const diff = TOURNAMENT_START - now;
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        setTournamentCountdown({ days, hours, minutes, seconds });
      } else if (now >= TOURNAMENT_START && now < TOURNAMENT_END) {
        setTournamentStatus('active');
        const diff = TOURNAMENT_END - now;
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        setTournamentCountdown({ days, hours, minutes, seconds });
      } else {
        setTournamentStatus('ended');
        setTournamentCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    
    calculateTournamentCountdown();
    const timer = setInterval(calculateTournamentCountdown, 1000);
    
    return () => clearInterval(timer);
  }, [TOURNAMENT_START, TOURNAMENT_END]);
  
  // Get user info
  const user = fcContext?.user || context?.user;
  const walletAddress =
    address ||
    user?.verified_addresses?.eth_addresses?.[0] ||
    user?.custody ||
    "0x0000...0000";
  const displayName = apiUsername || user?.displayName || user?.username || "User";
  const username = apiUsername || user?.username || "user";
  const pfpUrl = user?.pfpUrl;
  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Helper to safely reset play button state
  const resetPlayButtonState = useCallback(() => {
    setIsStartingGame(false);
    setTxHash(undefined);
    setSessionId(null);
    setStartGameStatus(null);
  }, []);

  // Handle start game session flow:
  // 1) create backend session
  // 2) find first stablecoin with >= 0.01 balance (USDC → USDT → USDm)
  // 3) approve + startGameSessionWithTransfer(sessionId, token)
  const handlePlayClick = async () => {
    if (!energy || energy <= 0) {
      console.log("Insufficient energy!");
      setStartGameError("Insufficient energy to play");
      return;
    }

    if (isStartingGame) {
      console.log("Already starting game, ignoring click");
      return;
    }

    // For MiniPay/Web, need wallet connected
    if ((isMiniPay || isWeb) && !address) {
      setStartGameError("Please connect your wallet first");
      return;
    }

    // For Farcaster, need wallet connected via wagmi for contract calls
    if (isFarcaster && !address) {
      setStartGameError("Please connect your wallet first");
      return;
    }

    const shouldSkipTx = dailyGames === null || dailyGames === undefined || dailyGames < 3;

    try {
      setIsStartingGame(true);
      setStartGameError(null);
      setStartGameStatus(t("preparingSession"));

      console.log(`🟢 Starting game - dailyGames: ${dailyGames}, skipTx: ${shouldSkipTx}`);

      const user = fcContext?.user || context?.user;
      const apiWalletAddress = address || 
        user?.verified_addresses?.eth_addresses?.[0] || 
        user?.custody;
      
      if (!apiWalletAddress || apiWalletAddress === "0x0000...0000") {
        throw new Error("Wallet address not available. Please connect your wallet.");
      }

      // 1. Call backend to get session ID
      const startRes = await authFetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: apiWalletAddress }),
      });

      if (!startRes.ok) {
        const errData = await startRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to start game session');
      }

      const { sessionId: newSessionId } = await startRes.json();
      console.log('✅ Session ID from backend:', newSessionId);
      setSessionId(newSessionId);

      if (shouldSkipTx) {
        // Free play: skip all smart contract interactions
        console.log('🟢 Free play mode (daily_games < 3) - skipping transactions');
        setStartGameStatus(t("startingFreeGame"));
        router.push(`/tradearea?sessionId=${newSessionId}&skipTx=true`);
        return;
      }

      // Paid play: must be on Celo before viem writeContract (otherwise "chain id does not match")
      await ensureWalletOnCeloChain({
        target: TARGET_CHAIN,
        switchChainAsync,
        getProvider: async () => {
          const connector = activeConnector ?? config.connectors[0];
          let p: any = null;
          if (connector) {
            try {
              p = await connector.getProvider();
            } catch {
              /* noop */
            }
          }
          if (!p && typeof window !== "undefined" && (window as any).ethereum) {
            p = (window as any).ethereum;
          }
          return p;
        },
      });

      // 3. Ensure we have address from wagmi for contract call
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet to start the game.");
      }

      let provider: any = null;
      const connector = activeConnector ?? config.connectors[0];
      if (connector) {
        try { provider = await connector.getProvider(); } catch {}
      }
      if (!provider && typeof window !== 'undefined' && (window as any).ethereum) {
        provider = (window as any).ethereum;
      }
      if (!provider) {
        throw new Error("Wallet provider not available. Try refreshing or reconnecting your wallet.");
      }

      const walletClient = createWalletClient({
        chain: TARGET_CHAIN,
        transport: custom(provider),
        account: address,
      });
      const publicClient = createCeloPublicClientForApp();

      // 4. Pick the stablecoin with the largest balance
      setStartGameStatus(t("checkingBalances"));
      let chosenToken: typeof PAYMENT_TOKENS[number] | null = null;
      let entryAmount: bigint = 0n;
      let highestBalance: bigint = 0n;

      for (const token of PAYMENT_TOKENS) {
        try {
          const balance = await publicClient.readContract({
            address: token.address,
            abi: tokenABI,
            functionName: 'balanceOf',
            args: [address],
            authorizationList: undefined,
          }) as bigint;
          const required = parseUnits("0.01", token.decimals);
          const normalized = token.decimals < 18
            ? balance * (10n ** BigInt(18 - token.decimals))
            : balance;
          console.log(`🔍 ${token.symbol} balance: ${balance.toString()}, normalized: ${normalized.toString()}, need: ${required.toString()}`);
          if (balance >= required && normalized > highestBalance) {
            highestBalance = normalized;
            chosenToken = token;
            entryAmount = parseUnits("0.01", token.decimals);
          }
        } catch (e) {
          console.warn(`⚠️ Could not read ${token.symbol} balance, skipping`, e);
        }
      }

      if (!chosenToken) {
        throw new Error("You need at least 0.01 USDC, USDT, or USDm to play.");
      }

      console.log(`🟢 Using ${chosenToken.symbol} for payment (highest balance)`);

      // Web/Farcaster: try CIP-64 (stable gas); MetaMask often fails → OrCelo falls back to CELO gas.
      const useStableGas = !isMiniPay && (isWeb || isFarcaster);
      const feeCurrency = useStableGas
        ? getCeloFeeCurrencyForPaymentToken(chosenToken.address)
        : undefined;
      paymentTokenForSessionRef.current = chosenToken.address;

      // 5. Check existing allowance; only approve if needed (approve $2 worth to cover many games)
      setStartGameStatus(t("checkingAllowance", { token: chosenToken.symbol }));
      const currentAllowance = await publicClient.readContract({
        address: chosenToken.address,
        abi: tokenABI,
        functionName: 'allowance',
        args: [address, GAME_CONTRACT_ADDRESS],
        authorizationList: undefined,
      }) as bigint;

      if (currentAllowance < entryAmount) {
        const bulkApproval = parseUnits('2', chosenToken.decimals);
        setStartGameStatus(t("approveOneTime", { token: chosenToken.symbol }));
        const approveHash = await sendCeloWebTxWithStableGasFeeOrCelo({
          walletClient,
          chain: TARGET_CHAIN,
          account: address,
          to: chosenToken.address,
          data: encodeFunctionData({
            abi: tokenABI,
            functionName: "approve",
            args: [GAME_CONTRACT_ADDRESS, bulkApproval],
          }),
          feeCurrency,
          sendWithCeloGas: () =>
            walletClient.writeContract({
              account: address,
              chain: TARGET_CHAIN,
              address: chosenToken.address,
              abi: tokenABI,
              functionName: "approve",
              args: [GAME_CONTRACT_ADDRESS, bulkApproval],
            }),
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log(`✅ ${chosenToken.symbol} approval for $2 confirmed:`, approveHash);
      } else {
        console.log(`✅ ${chosenToken.symbol} already approved (allowance: ${currentAllowance.toString()})`);
      }

      // 6. Start game using token transfer flow.
      setStartGameStatus(t("confirmInWallet"));
      const startHash = await sendCeloWebTxWithStableGasFeeOrCelo({
        walletClient,
        chain: TARGET_CHAIN,
        account: address,
        to: GAME_CONTRACT_ADDRESS,
        data: encodeFunctionData({
          abi: gameABI,
          functionName: "startGameSessionWithTransfer",
          args: [BigInt(newSessionId), chosenToken.address],
        }),
        feeCurrency,
        sendWithCeloGas: () =>
          walletClient.writeContract({
            account: address,
            chain: TARGET_CHAIN,
            address: GAME_CONTRACT_ADDRESS,
            abi: gameABI,
            functionName: "startGameSessionWithTransfer",
            args: [BigInt(newSessionId), chosenToken.address],
          }),
      });
      setTxHash(startHash);
      setStartGameStatus(t("confirmingStart"));

    } catch (error: any) {
      console.error('❌ Error starting game:', error);
      const fullErrorText = (error?.message || '').toLowerCase();
      if (fullErrorText.includes('keychain error') || fullErrorText.includes('-25300')) {
        setStartGameError('Wallet signing failed. Please close and reopen the app, then try again.');
      } else if (fullErrorText.includes('user rejected') || fullErrorText.includes('rejected')) {
        setStartGameError('Transaction cancelled. You can try again when ready.');
      } else if (fullErrorText.includes('insufficient') || fullErrorText.includes('balance')) {
        setStartGameError("Insufficient stablecoin or CELO for gas.");
      } else if (
        fullErrorText.includes('does not match the target chain') ||
        (fullErrorText.includes('chain id') && fullErrorText.includes('expected'))
      ) {
        setStartGameError(
          'Switch your wallet to Celo (chain 42220) in MetaMask, then try Play again.'
        );
      } else {
        setStartGameError(error.message || 'Failed to start game. Please try again.');
      }
      resetPlayButtonState();
    }
  };

  // Navigate to tradearea when start transaction is confirmed
  useEffect(() => {
    const confirmedHash = txHash;
    if (isConfirmed && sessionId && confirmedHash) {
      console.log('✅ Transaction confirmed! Navigating to game...');
      const pt = paymentTokenForSessionRef.current;
      const feeQ =
        !isMiniPay && (isWeb || isFarcaster) && pt
          ? `&paymentToken=${encodeURIComponent(pt)}`
          : "";
      router.push(`/tradearea?sessionId=${sessionId}${feeQ}`);
    }
  }, [isConfirmed, sessionId, txHash, router, isWeb, isFarcaster, isMiniPay]);

  /* ------------------- Loading Screen ------------------- */
  if (!fcReady || !isMiniAppReady || isLoadingEnergy) {
    return (
      <SplashScreen
        fullScreen={false}
        message={isLoadingEnergy ? t("loadingData") : t("loading")}
      />
    );
  }


  const freeGamesLeft = dailyGames === null || dailyGames === undefined ? 3 : Math.max(0, 3 - dailyGames);
  const isFreePlay = freeGamesLeft > 0;
  const formattedTpoints = isConnected && tokenBalance !== undefined
    ? Number(formatUnits(tokenBalance as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '...';
  const playButtonEnabled = energy && energy > 0 && !isStartingGame;
  const playLabel = isStartingGame
    ? t("starting")
    : energy && energy > 0
      ? (dailyGames !== null && dailyGames !== undefined && dailyGames >= 3 ? t("playPaid") : t("playFree"))
      : t("noEnergy");

  return (
    <main className="flex flex-col h-[100dvh] bg-[#ebeff2] relative overflow-hidden">
      <HowToPlayOverlay />

      {/* Background Candlestick Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-20 left-6 opacity-30" width="55" height="120" viewBox="0 0 55 120">
          <line x1="15" y1="10" x2="15" y2="30" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="30" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="15" y1="70" x2="15" y2="90" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="25" x2="40" y2="40" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="34" y="40" width="12" height="30" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
          <line x1="40" y1="70" x2="40" y2="95" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        <svg className="absolute top-28 right-4 opacity-25" width="50" height="100" viewBox="0 0 50 100">
          <line x1="25" y1="5" x2="25" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="19" y="20" width="12" height="45" rx="2" fill="#bdecf6"/>
          <line x1="25" y1="65" x2="25" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        <svg className="absolute bottom-36 left-3 opacity-20" width="40" height="90" viewBox="0 0 40 90">
          <line x1="20" y1="5" x2="20" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="14" y="20" width="12" height="35" rx="2" fill="#bdecf6"/>
          <line x1="20" y1="55" x2="20" y2="80" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        <svg className="absolute bottom-40 right-8 opacity-30" width="60" height="110" viewBox="0 0 60 110">
          <line x1="15" y1="30" x2="15" y2="45" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="45" width="12" height="25" rx="2" fill="#bdecf6"/>
          <line x1="15" y1="70" x2="15" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="15" x2="40" y2="30" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="34" y="30" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="40" y1="70" x2="40" y2="95" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Top stats area */}
      <header className="relative z-10 pt-[72px] px-4 pb-2">
        {/* Stats row */}
        <div className="flex items-stretch justify-center gap-2 max-w-sm mx-auto">
          <div className="flex-1 bg-white rounded-2xl px-3 py-2.5 border border-gray-100 shadow-card flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <LightningIcon className="text-[#d76afd]" />
              <span className="text-gray-800 font-bold text-xl tabular-nums">{energy ?? '...'}</span>
            </div>
            <span className="text-gray-400 text-[9px] uppercase tracking-widest font-semibold mt-0.5">{t("energy")}</span>
            <span className="text-[#d76afd] text-[10px] font-mono tabular-nums">
              {energy === 10 ? t("full") : energy === 0 ? t("empty") : `${String(quarterCountdown.minutes).padStart(2, '0')}:${String(quarterCountdown.seconds).padStart(2, '0')}`}
            </span>
          </div>

          <div className="flex-1 bg-white rounded-2xl px-3 py-2.5 border border-gray-100 shadow-card flex flex-col items-center">
            <span className="text-[#d76afd] font-bold text-lg">{isFreePlay ? `${freeGamesLeft}/3` : '$0.01'}</span>
            <span className="text-gray-400 text-[9px] uppercase tracking-widest font-semibold mt-0.5">
              {isFreePlay ? t("freeLeft") : t("perGame")}
            </span>
            <span className="text-gray-400 text-[10px]">
              {isFreePlay ? t("scoreOnly") : t("earnTpoint")}
            </span>
          </div>

          <div className="flex-1 bg-white rounded-2xl px-3 py-2.5 border border-gray-100 shadow-card flex flex-col items-center">
            <span className="text-gray-800 font-bold text-lg tabular-nums">{formattedTpoints}</span>
            <span className="text-gray-400 text-[9px] uppercase tracking-widest font-semibold mt-0.5">TPOINT</span>
            {isMintSyncPending && (
              <span className="text-[#d76afd] text-[10px] animate-pulse">{t("syncing")}</span>
            )}
          </div>
        </div>
      </header>

      {/* Tournament Banner */}
      <div className="relative z-10 px-4 -mt-0.5">
        <div className="max-w-sm mx-auto bg-white rounded-2xl border border-gray-100 shadow-card px-3 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">🏆</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-800 leading-tight">
                  {tournamentStatus === 'upcoming' ? t("tournamentStartsApr1") : tournamentStatus === 'active' ? t("tournamentEndsMay1") : t("tournamentEnded")}
                </p>
                {tournamentStatus !== 'ended' ? (
                  <p className="text-[11px] font-mono font-bold text-[#d76afd] tabular-nums">
                    {tournamentCountdown.days}d {String(tournamentCountdown.hours).padStart(2, '0')}h {String(tournamentCountdown.minutes).padStart(2, '0')}m {String(tournamentCountdown.seconds).padStart(2, '0')}s
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400">{t("resultsAvailable")}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <div className="flex flex-col items-center px-1.5">
                <span className="text-[9px] text-amber-500 font-bold">1st</span>
                <span className="text-[10px] font-bold text-gray-800">$100</span>
              </div>
              <div className="flex flex-col items-center px-1.5">
                <span className="text-[9px] text-gray-400 font-bold">2nd</span>
                <span className="text-[10px] font-bold text-gray-800">$50</span>
              </div>
              <div className="flex flex-col items-center px-1.5">
                <span className="text-[9px] text-orange-400 font-bold">3rd</span>
                <span className="text-[10px] font-bold text-gray-800">$30</span>
              </div>
            </div>
          </div>
          <p className="text-[8px] text-gray-400 text-center mt-1">{t("top100Prize")}</p>
        </div>
      </div>

      {/* Center: Play Button */}
      <section className="flex-1 flex flex-col items-center justify-center z-10 relative -mt-10">
        {energy !== null && energy === 0 && (
          <p className="text-red-500 text-sm font-semibold mb-3">{t("noEnergyLeft")}</p>
        )}
        {startGameError && (
          <p className="text-red-500 text-sm font-semibold mb-3 px-8 text-center">{startGameError}</p>
        )}
        {(isStartingGame || isConfirming) && (
          <p className="text-[#d76afd] text-sm font-semibold mb-3 animate-pulse">
            {startGameStatus || (isConfirming ? t("confirmingTransaction") : t("waitingApproval"))}
          </p>
        )}

        <div
          className={`relative group ${playButtonEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
          onClick={playButtonEnabled ? handlePlayClick : undefined}
        >
          {playButtonEnabled && (
            <div className="absolute -inset-10 rounded-full border border-dashed border-[#d76afd]/[0.12] animate-[spin_25s_linear_infinite]" />
          )}
          {playButtonEnabled && (
            <div className="absolute -inset-5 rounded-full border border-[#d76afd]/15" />
          )}
          {playButtonEnabled && (
            <div className="absolute -inset-6 rounded-full bg-[#d76afd]/[0.08] blur-2xl group-hover:bg-[#d76afd]/[0.16] transition-all duration-500" />
          )}

          <div className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
            playButtonEnabled
              ? 'bg-gradient-to-br from-[#d76afd] via-[#c45aef] to-[#8b5cf6] border-2 border-[#e9a8ff]/40 shadow-[0_0_40px_rgba(215,106,253,0.2)] group-hover:shadow-[0_0_60px_rgba(215,106,253,0.35)] group-hover:scale-[1.04] active:scale-95'
              : 'bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-gray-200'
          }`}>
            <div className={`relative z-10 transition-transform duration-300 ${playButtonEnabled ? 'group-hover:scale-110' : ''}`}>
              {isStartingGame ? (
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <PlayIcon />
              )}
            </div>
            <span className="relative z-10 mt-1 text-white font-bold text-[11px] uppercase tracking-widest">
              {playLabel}
            </span>
          </div>
        </div>

        {isWeb && (
          <p className="text-[10px] text-gray-500 text-center max-w-[18rem] mt-4 px-3 leading-relaxed">
            {t("playCostNote")}
          </p>
        )}

        {/* Username & Wallet */}
        <div className="flex flex-col items-center mt-5">
          <div className="flex items-center gap-2">
            {pfpUrl && (
              <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-[#d76afd]/30 flex-shrink-0">
                <img src={pfpUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <span className="text-gray-700 text-sm font-semibold">{username}</span>
          </div>
          {isConnected && (
            <span className="text-emerald-500 text-[10px] font-mono flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {formatAddress(walletAddress)}
            </span>
          )}
        </div>
      </section>

      {/* Telegram Community FAB - bottom right corner */}
      <a
        href="https://t.me/simmerliq"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-[76px] right-4 z-40 flex flex-col items-center gap-1 group transition-all duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="w-11 h-11 rounded-full bg-white border border-gray-100 shadow-card flex items-center justify-center group-hover:border-[#d76afd]/40 group-hover:shadow-soft transition-all duration-300">
          <TelegramIcon className="w-5 h-5 text-[#d76afd]" />
        </div>
        <span className="text-[8px] text-gray-400 group-hover:text-[#d76afd] transition-colors font-medium max-w-[100px] text-center leading-tight">{t("telegramCta")}</span>
      </a>

      {/* Bottom navigation */}
      <nav className={`fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50 shadow-soft transition-all duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none translate-y-full' : 'opacity-100 translate-y-0'}`}>
        <div className="flex justify-around items-center py-3 px-4">
          <button className="flex flex-col items-center gap-1 group relative">
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <HomeIcon active={true} />
            </div>
            <span className="text-[11px] font-semibold text-[#d76afd]">{tNav("home")}</span>
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#d76afd] rounded-full" />
          </button>
          
          <button
            onClick={() => router.push('/leaderboard')}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <TrophyIcon />
            </div>
            <span className="text-[11px] font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">{tNav("leaderboard")}</span>
          </button>
          
          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <UserIcon />
            </div>
            <span className="text-[11px] font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">{tNav("profile")}</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
