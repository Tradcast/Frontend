// src/app/home/page.tsx
"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useMenu } from "@/contexts/menu-context";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useConnectors, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance, useConfig, useSwitchChain } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { createWalletClient, custom, type Hash } from "viem";
import gameABI from "@/app/game_abi";
import tokenABI from "@/app/token_abi";

// Contract addresses
const GAME_CONTRACT_ADDRESS = "0x5931fC25bE1C8E40dA9147c5c11397f7422a0009" as `0x${string}`;
const TOKEN_CONTRACT_ADDRESS = "0x346528259cdF48fa1e5B23194828B477362B80f0" as `0x${string}`;

// Use Celo mainnet as default (or celoAlfajores for testnet)
const TARGET_CHAIN = celo; // Change to celoAlfajores for testnet

const LightningIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" : "text-slate-500"}`}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const TrophyIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" : "text-slate-500"}`}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const UserIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" : "text-slate-500"}`}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const FloatingCard = ({ delay = "0s", duration = "20s", children, className = "" }: any) => (
  <div
    className={`absolute ${className}`}
    style={{
      animation: `floatAround ${duration} ease-in-out infinite`,
      animationDelay: delay
    }}
  >
    {children}
  </div>
);
const GreenCandleIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2"/>
    <rect x="8" y="6" width="8" height="10" fill="currentColor" stroke="currentColor" strokeWidth="1.5" rx="1"/>
    <line x1="12" y1="16" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const RedCandleIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="12" y1="2" x2="12" y2="8" stroke="currentColor" strokeWidth="2"/>
    <rect x="8" y="8" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1"/>
    <line x1="12" y1="16" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const ChartIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const MoneyBagIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 2L7 6"/>
    <path d="M15 2l2 4"/>
    <path d="M12 22a8 8 0 0 0 8-8V8a8 8 0 0 0-16 0v6a8 8 0 0 0 8 8z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);
const CarIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);
const HouseIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const GiftIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="8" width="18" height="4" rx="1"/>
    <path d="M12 8v13"/>
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
  </svg>
);
const HelpIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <path d="M12 17h.01"/>
  </svg>
);
export default function HomePage() {
  const { context, isMiniAppReady } = useMiniApp();
  const { isMenuOpen } = useMenu();
  const router = useRouter();
  // Farcaster SDK state
  const [fcReady, setFcReady] = useState(false);
  const [fcContext, setFcContext] = useState<any>(null);
  // Wallet state
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { switchChain } = useSwitchChain();
  
  // Check if we're on the correct chain (Celo)
  const isOnCorrectChain = chainId ? chainId === TARGET_CHAIN.id : false;
  // Energy state from backend
  const [energy, setEnergy] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(true);
  
  // Game session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [startGameError, setStartGameError] = useState<string | null>(null);
  const [isStuckState, setIsStuckState] = useState(false); // Shows refresh button when stuck
  const playButtonTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const PLAY_BUTTON_TIMEOUT_MS = 7000; // 7 seconds before showing "stuck" message
  
  // Get wagmi config for wallet client
  const config = useConfig();
  const [txHash, setTxHash] = useState<Hash | undefined>(undefined);
  
  // Contract write hooks
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  // Use our own hash state as backup
  const currentHash = hash || txHash;
  
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

  // Read CELO balance (native token for gas)
  // Temporarily disabled to avoid getChainId issues with Farcaster connector
  // We'll check balance differently or skip this check
  const { data: celoBalanceData } = useBalance({
    address: address,
    query: {
      enabled: false, // Disabled to avoid getChainId error - Farcaster connector issue
    },
  });

  // Read minGamePrice from contract (to check if contract requires payment)
  // Temporarily disabled to avoid getChainId issues
  const { data: minGamePrice } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: gameABI,
    functionName: 'minGamePrice',
    query: {
      enabled: false, // Disabled to avoid getChainId error - will use 0 as default
    },
  });
  /* ------------------- Farcaster SDK Init ------------------- */
  useEffect(() => {
    if (fcReady) return;
    const initFarcaster = async () => {
      try {
        const { sdk } = await import("@farcaster/frame-sdk");
        await sdk.actions.ready();
        const context = await sdk.context;
        console.log("✅ Farcaster context:", context);
        setFcContext(context);
        setFcReady(true);
      } catch (err) {
        console.warn("Not inside Farcaster or SDK not found:", err);
      }
    };
    initFarcaster();
  }, [fcReady]);
  /* ------------------- Auto-connect Farcaster Frame Wallet ------------------- */
  const hasAttemptedFrameConnect = React.useRef(false);
  useEffect(() => {
    if (!fcReady || isConnected || isConnecting || hasAttemptedFrameConnect.current) return;
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
  }, [fcReady, isConnected, isConnecting, connectors, connect]);
  /* ------------------- Fetch Energy from Backend ------------------- */
  useEffect(() => {
    const fetchEnergy = async () => {
      if (!fcReady || !isMiniAppReady) return;
      setIsLoadingEnergy(true);
      try {
        const { sdk } = await import("@farcaster/frame-sdk");
        console.log('🟢 Fetching energy from backend...');
        const res = await sdk.quickAuth.fetch('/api/home', {
          method: 'GET',
        });
        const res2 = await sdk.quickAuth.fetch('/api/verify', {
          method: 'POST',
        });

        if (res.ok) {
          const data = await res.json();
          console.log('✅ Energy data received:', data);
          // Assuming backend returns { energy: 10, streak_days: 3 }
          if (data.energy !== undefined) {
            setEnergy(data.energy);
          }
          if (data.streak_days !== undefined) {
            setStreakDays(data.streak_days);
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
  }, [fcReady, isMiniAppReady]);
  // Get user info
  const user = fcContext?.user || context?.user;
  const walletAddress =
    address ||
    user?.verified_addresses?.eth_addresses?.[0] ||
    user?.custody ||
    "0x0000...0000";
  const displayName = user?.displayName || user?.username || "User";
  const username = user?.username || "user";
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
    setIsStuckState(false);
    if (playButtonTimeoutRef.current) {
      clearTimeout(playButtonTimeoutRef.current);
      playButtonTimeoutRef.current = null;
    }
  }, []);

  // Handle refresh when stuck
  const handleRefreshPage = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  // Handle start game session flow
  const handlePlayClick = async () => {
    if (!address || !isConnected) {
      console.error("Wallet not connected");
      setStartGameError("Please connect your wallet first");
      return;
    }
    
    if (!energy || energy <= 0) {
      console.log("Insufficient energy!");
      setStartGameError("Insufficient energy to play");
      return;
    }

    // Prevent double-clicks
    if (isStartingGame || txHash || isPending || isConfirming) {
      console.log("Already starting game, ignoring click");
      return;
    }

    try {
      setIsStartingGame(true);
      setStartGameError(null);
      
      // Clear any existing timeout
      if (playButtonTimeoutRef.current) {
        clearTimeout(playButtonTimeoutRef.current);
        playButtonTimeoutRef.current = null;
      }
      
      // Step 0: Switch to Celo chain if not already on it
      if (chainId && chainId !== TARGET_CHAIN.id) {
        console.log(`🔄 Switching from chain ${chainId} to Celo (${TARGET_CHAIN.id})...`);
        try {
          await switchChain({ chainId: TARGET_CHAIN.id });
          console.log('✅ Chain switched to Celo');
          // Small delay to let the chain switch complete
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (switchError: any) {
          console.error('❌ Failed to switch chain:', switchError);
          const errorText = (switchError?.message || '').toLowerCase();
          if (errorText.includes('user rejected') || errorText.includes('rejected')) {
            setStartGameError('Please switch to Celo network to play.');
          } else {
            setStartGameError('Please switch to Celo network in your wallet.');
          }
          resetPlayButtonState();
          return;
        }
      }
      
      // Step 1: Call API to create session (QuickAuth secured)
      console.log('🟢 Creating game session...');
      let sdk;
      try {
        const farcasterModule = await import("@farcaster/frame-sdk");
        sdk = farcasterModule.sdk;
      } catch (sdkError: any) {
        console.error('❌ Failed to load Farcaster SDK:', sdkError);
        setStartGameError('Failed to load SDK. Please refresh and try again.');
        resetPlayButtonState();
        return;
      }
      
      let apiResponse;
      try {
        apiResponse = await sdk.quickAuth.fetch('/api/game/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: address }),
        });
      } catch (fetchError: any) {
        console.error('❌ Network error calling API:', fetchError);
        setStartGameError('Network error. Please check your connection and try again.');
        resetPlayButtonState();
        return;
      }

      if (!apiResponse.ok) {
        let errorMessage = 'Failed to create game session';
        try {
          const errorData = await apiResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error (${apiResponse.status})`;
        }
        throw new Error(errorMessage);
      }

      let newSessionId;
      try {
        const responseData = await apiResponse.json();
        newSessionId = responseData.sessionId;
        if (!newSessionId) {
          throw new Error('No session ID returned from server');
        }
      } catch (parseError: any) {
        console.error('❌ Failed to parse API response:', parseError);
        setStartGameError('Invalid server response. Please try again.');
        resetPlayButtonState();
        return;
      }
      
      console.log('✅ Session created:', newSessionId);
      setSessionId(newSessionId);

      // Check if contract requires minimum payment
      const requiredPayment = minGamePrice ? BigInt(String(minGamePrice)) : BigInt('80000000000000000'); // Default: 0.08 CELO
      console.log('💰 Contract payment (minGamePrice or default):', requiredPayment.toString());

      // Step 2: Call smart contract startGameSession on Celo
      // Use viem directly with the connector to bypass wagmi's getChainId check
      console.log('🟢 Calling startGameSession contract on Celo...', {
        sessionId: newSessionId,
        payment: requiredPayment.toString(),
      });
      
      try {
        // Get the connector from wagmi
        const connector = config.connectors[0]; // Farcaster connector should be first
        if (!connector) {
          throw new Error('Wallet not connected');
        }
        
        // Get the provider from connector
        let provider: any;
        try {
          provider = await connector.getProvider();
        } catch (providerError: any) {
          console.error('❌ Failed to get provider:', providerError);
          throw new Error('Wallet provider not available. Please reconnect your wallet.');
        }
        
        if (!provider) {
          throw new Error('Provider not available');
        }
        
        // Create viem wallet client directly
        const walletClient = createWalletClient({
          chain: celo, // Explicitly set Celo chain
          transport: custom(provider as any),
          account: address as `0x${string}`,
        });
        
        // Write contract using viem directly
        console.log('🟢 Writing contract with viem walletClient...');
        const hash = await walletClient.writeContract({
          address: GAME_CONTRACT_ADDRESS,
          abi: gameABI,
          functionName: 'startGameSession',
          args: [BigInt(newSessionId)],
          value: requiredPayment as bigint,
        });
        
        console.log('✅ Transaction sent, hash:', hash);
        setTxHash(hash); // Store hash for receipt waiting
        
      } catch (directError: any) {
        // Check if user rejected the transaction
        const errorText = ((directError?.message || '') + (directError?.cause?.message || '') + (directError?.shortMessage || '')).toLowerCase();
        if (errorText.includes('user rejected') || 
            errorText.includes('rejected the request') ||
            errorText.includes('user denied') ||
            errorText.includes('denied transaction')) {
          console.warn('⚠️ User rejected the transaction');
          setStartGameError('Transaction cancelled. You can try again when ready.');
          resetPlayButtonState();
          return;
        }
        
        // Check for insufficient funds
        if (errorText.includes('insufficient') || errorText.includes('balance')) {
          console.error('❌ Insufficient funds:', directError);
          setStartGameError('Insufficient CELO balance for transaction.');
          resetPlayButtonState();
          return;
        }
        
        // Check for contract execution errors
        if (errorText.includes('execution reverted') || errorText.includes('revert')) {
          console.error('❌ Contract execution reverted:', directError);
          setStartGameError('Transaction failed. Please try again.');
          resetPlayButtonState();
          return;
        }
        
        // If direct viem approach fails, try wagmi's writeContract as fallback
        console.warn('Direct viem approach failed, trying wagmi writeContract:', directError);
        
        try {
          writeContract({
            address: GAME_CONTRACT_ADDRESS,
            abi: gameABI,
            functionName: 'startGameSession',
            args: [BigInt(newSessionId)],
            value: requiredPayment as bigint,
          } as any);
        } catch (wagmiError: any) {
          console.error('❌ Wagmi fallback also failed:', wagmiError);
          setStartGameError('Failed to send transaction. Please try again.');
          resetPlayButtonState();
          return;
        }
      }

    } catch (error: any) {
      console.error('❌ Error starting game:', error);
      const errorText = ((error?.message || '') + (error?.cause?.message || '')).toLowerCase();
      if (errorText.includes('user rejected') || 
          errorText.includes('rejected the request') ||
          errorText.includes('user denied')) {
        setStartGameError('Transaction cancelled. You can try again when ready.');
      } else if (errorText.includes('chain') || errorText.includes('network')) {
        setStartGameError('Please switch to Celo network to play.');
      } else if (errorText.includes('insufficient') || errorText.includes('balance')) {
        setStartGameError('Insufficient CELO balance.');
      } else {
        setStartGameError(error.message || 'Failed to start game. Please try again.');
      }
      resetPlayButtonState();
    }
  };

  // Navigate to tradearea when transaction is confirmed
  useEffect(() => {
    const confirmedHash = hash || txHash;
    if (isConfirmed && sessionId && confirmedHash) {
      console.log('✅ Transaction confirmed! Navigating to game...');
      // Don't set isStartingGame to false - let navigation happen while button stays disabled
      // The component will unmount when navigation completes
      router.push(`/tradearea?sessionId=${sessionId}`);
    }
  }, [isConfirmed, sessionId, hash, txHash, router]);

  // Timeout for play button - show "stuck" message after 7 seconds
  useEffect(() => {
    // Start timeout when starting game process
    if ((isStartingGame || txHash || isPending) && !isStuckState) {
      // Clear any existing timeout
      if (playButtonTimeoutRef.current) {
        clearTimeout(playButtonTimeoutRef.current);
      }

      playButtonTimeoutRef.current = setTimeout(() => {
        // If we're still in a loading state after timeout (and not confirmed/navigating)
        if ((isStartingGame || txHash || isPending) && !isConfirmed) {
          console.warn('⚠️ Play button stuck - showing refresh option');
          setIsStuckState(true);
        }
      }, PLAY_BUTTON_TIMEOUT_MS);
    }

    // Clear timeout and stuck state on successful confirmation
    if (isConfirmed) {
      if (playButtonTimeoutRef.current) {
        clearTimeout(playButtonTimeoutRef.current);
        playButtonTimeoutRef.current = null;
      }
      setIsStuckState(false);
    }

    // Cleanup on unmount
    return () => {
      if (playButtonTimeoutRef.current) {
        clearTimeout(playButtonTimeoutRef.current);
      }
    };
  }, [isStartingGame, txHash, isPending, isConfirmed, isStuckState]);

  // Handle write errors with better messaging (only for wagmi fallback)
  useEffect(() => {
    if (writeError) {
      console.error('❌ Contract write error (wagmi fallback):', writeError);
      
      // Only handle if we don't already have a txHash (meaning viem direct approach failed)
      if (txHash) {
        // Viem direct approach succeeded, ignore wagmi error
        return;
      }
      
      // Provide user-friendly error messages
      let errorMessage = 'Transaction failed. Please try again.';
      const fullErrorText = ((writeError.message || '') + ((writeError as any).shortMessage || '')).toLowerCase();
      
      // Check for chain mismatch error
      if (fullErrorText.includes('does not match the target chain') || 
          (fullErrorText.includes('chain') && fullErrorText.includes('mismatch'))) {
        console.warn('Chain mismatch detected - need to switch to Celo');
        errorMessage = 'Please switch to Celo network. Click Play again to switch.';
      }
      // Check for getChainId error (Farcaster connector issue)
      else if (fullErrorText.includes('getchainid') || 
          fullErrorText.includes('is not a function') ||
          (writeError as any).cause?.message?.includes('getChainId')) {
        console.warn('Chain ID error detected - Farcaster connector compatibility issue');
        errorMessage = 'Wallet connection issue. Please try again.';
      } else if (fullErrorText.includes('user rejected') || 
          fullErrorText.includes('rejected the request') ||
          fullErrorText.includes('user denied')) {
        // User rejected transaction - just show a friendly message and allow retry
        console.warn('⚠️ User rejected the transaction');
        errorMessage = 'Transaction cancelled. You can try again when ready.';
      } else if (fullErrorText.includes('insufficient') || 
          fullErrorText.includes('balance')) {
        errorMessage = 'Insufficient CELO balance for gas fees.';
      } else if (fullErrorText.includes('execution reverted') || fullErrorText.includes('revert')) {
        errorMessage = 'Transaction failed. Please try again.';
      } else if (writeError.message) {
        // Truncate long error messages
        errorMessage = writeError.message.length > 80 
          ? writeError.message.substring(0, 80) + '...' 
          : writeError.message;
      }
      
      setStartGameError(errorMessage);
      resetPlayButtonState();
    }
  }, [writeError, txHash, resetPlayButtonState]);
  /* ------------------- Loading Screen ------------------- */
  if (!fcReady || !isMiniAppReady || isLoadingEnergy) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A]">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[#8B5CF6]/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#A78BFA] animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#A78BFA]/20 to-[#8B5CF6]/20 backdrop-blur-xl"></div>
            </div>
            <p className="text-slate-300">
              {isLoadingEnergy ? 'Loading your data...' : 'Loading MiniApp...'}
            </p>
          </div>
        </section>
      </main>
    );
  }
  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#8B5CF6] opacity-12 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A78BFA] opacity-10 blur-[70px] rounded-full pointer-events-none"></div>
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>
      {/* Floating decorations */}
      <FloatingCard delay="0s" duration="25s" className="top-32 left-8">
        <div className="bg-gradient-to-br from-green-900/50 to-green-950/50 p-4 rounded-2xl border-2 border-green-700/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <GreenCandleIcon className="text-green-400" />
        </div>
      </FloatingCard>
      <FloatingCard delay="0s" duration="25s" className="bottom-32 right-8">
        <div className="bg-gradient-to-br from-red-900/50 to-red-950/50 p-4 rounded-2xl border-2 border-red-700/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <RedCandleIcon className="text-red-400" />
        </div>
      </FloatingCard>
      <FloatingCard delay="3s" duration="30s" className="top-64 left-16">
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-3 rounded-xl border-2 border-slate-700/30 backdrop-blur-xl">
          <ChartIcon className="text-[#A78BFA]" />
        </div>
      </FloatingCard>
      <FloatingCard delay="3s" duration="30s" className="bottom-64 right-16">
        <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-3 rounded-xl border-2 border-slate-700/30 backdrop-blur-xl">
          <MoneyBagIcon className="text-emerald-400" />
        </div>
      </FloatingCard>
      <FloatingCard delay="6s" duration="28s" className="bottom-48 left-12">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 rounded-2xl border-2 border-slate-700/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <HouseIcon className="text-blue-400" />
        </div>
      </FloatingCard>
      <FloatingCard delay="6s" duration="28s" className="top-48 right-12">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 rounded-2xl border-2 border-slate-700/40 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <CarIcon className="text-purple-400" />
        </div>
      </FloatingCard>
      {/* Header with Welcome message */}
      <header className="w-full p-6 flex flex-col items-center z-10 mt-8">
        <div className="w-full max-w-md mb-6">
          {/* Energy and Streak Display */}
          <div className="mt-4 flex items-center justify-center gap-3 mb-6">
            {/* Energy Display */}
            <div className="flex items-center gap-2 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl px-5 py-3 rounded-2xl border-2 border-slate-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <LightningIcon className="text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" />
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#A78BFA] to-white">
                {energy !== null ? energy : '...'}
              </span>
            </div>

          </div>
          {/* Welcome message with username and profile pic */}
          <div className="text-center mb-4">
            {/* Profile Picture */}
            {pfpUrl && (
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-2 border-[#A78BFA]/60 shadow-[0_0_16px_rgba(167,139,250,0.4)]">
                <img src={pfpUrl} alt="Profile" className="w-full h-full object-cover"/>
              </div>
            )}
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#A78BFA] to-white mb-2">
              Welcome, @{username}!
            </h1>
            {/* Wallet Address */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-slate-700/50 inline-block">
              <p className="text-sm text-slate-300 font-mono">
                {formatAddress(walletAddress)}
              </p>
            </div>
            {/* Wallet Connection Status */}
            {isConnected && (
              <div className="mt-2">
                <div className="inline-flex items-center gap-1.5 text-xs text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></div>
                  Connected
                </div>
              </div>
            )}
          </div>
          {energy !== null && energy === 0 && (
            <div className="mt-3 text-center">
              <span className="text-xs text-red-400 font-semibold">⚠️ No energy left!</span>
            </div>
          )}
          
          {/* Error Message */}
          {startGameError && (
            <div className="mt-3 text-center">
              <span className="text-xs text-red-400 font-semibold">⚠️ {startGameError}</span>
            </div>
          )}
          
          {/* Transaction Status */}
          {(isPending || isConfirming) && (
            <div className="mt-3 text-center">
              <span className="text-xs text-blue-400 font-semibold">
                {isPending ? '⏳ Waiting for approval...' : '⏳ Confirming transaction...'}
              </span>
            </div>
          )}
        </div>
      </header>
      {/* Play button section */}
      <section className="flex-1 flex flex-col items-center justify-center z-10 pb-24">
        <div
          className={`relative group ${
            isStuckState 
              ? 'cursor-pointer' 
              : energy && energy > 0 && !isStartingGame && !isPending && !isConfirming && !txHash && isConnected 
                ? 'cursor-pointer' 
                : 'cursor-not-allowed opacity-50'
          }`}
          onClick={
            isStuckState 
              ? handleRefreshPage 
              : (energy && energy > 0 && !isStartingGame && !isPending && !isConfirming && !txHash && isConnected 
                ? handlePlayClick 
                : undefined)
          }
        >
          {/* Glow effect - show when ready to play OR when stuck (for refresh) */}
          {(isStuckState || (energy && energy > 0 && !isStartingGame && !isPending && !isConfirming && !txHash && isConnected)) && (
            <div className="absolute inset-0 rounded-full">
              <div className={`absolute inset-0 rounded-full blur-[24px] transition-opacity duration-500 ${
                isStuckState 
                  ? 'bg-[#f59e0b] opacity-40 group-hover:opacity-60' 
                  : 'bg-[#8B5CF6] opacity-30 group-hover:opacity-50'
              }`}></div>
            </div>
          )}
          <div className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.4),inset_0_1px_6px_rgba(255,255,255,0.15)] border-[3px] border-white/15 transition-all duration-300 ${
            isStuckState
              ? 'bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#b45309] group-hover:scale-[1.03] active:scale-95 group-hover:shadow-[0_0_32px_rgba(245,158,11,0.6),inset_0_1px_6px_rgba(255,255,255,0.2)]'
              : energy && energy > 0 && !isStartingGame && !isPending && !isConfirming && !txHash && isConnected
                ? 'bg-gradient-to-br from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED] group-hover:scale-[1.03] active:scale-95 group-hover:shadow-[0_0_32px_rgba(139,92,246,0.6),inset_0_1px_6px_rgba(255,255,255,0.2)]'
                : 'bg-gradient-to-br from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED] grayscale'
          }`}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/10"></div>
            <div className={`relative z-10 transition-transform duration-300 ${
              isStuckState || (energy && energy > 0 && !isStartingGame && !isPending && !isConfirming && !txHash && isConnected) 
                ? 'group-hover:scale-105' 
                : ''
            }`}>
              {isStuckState ? (
                /* Refresh icon when stuck */
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                  <path d="M16 16h5v5"/>
                </svg>
              ) : (isPending || isConfirming || isStartingGame || txHash) ? (
                <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <PlayIcon />
              )}
            </div>
            <div className="relative z-10 mt-2 text-white font-bold tracking-[0.12em] text-[10px] uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] text-center px-2 leading-tight">
              {isStuckState
                ? 'Tap to Refresh'
                : isStartingGame || isPending || isConfirming || txHash
                  ? 'Starting...' 
                  : energy && energy > 0 && isConnected
                    ? 'Start Game' 
                    : !isConnected 
                      ? 'Connect Wallet'
                      : 'No Energy'}
            </div>
          </div>
        </div>
        
        {/* Stuck state message below the button */}
        {isStuckState && (
          <div className="mt-6 text-center animate-pulse">
            <p className="text-amber-400 text-sm font-semibold">
              ⚠️ Taking longer than expected
            </p>
            <p className="text-amber-300/80 text-xs mt-1">
              Tap the button above to refresh
            </p>
          </div>
        )}
      </section>
      {/* Bottom navigation - hidden when hamburger menu is open */}
      <nav className={`fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#0F172A] via-[#0F172A]/95 to-transparent backdrop-blur-2xl border-t-2 border-slate-800/60 pb-safe z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.5)] transition-all duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none translate-y-full' : 'opacity-100 translate-y-0'}`}>
        <div className="flex justify-around items-center py-5 px-4">
          <button className="flex flex-col items-center gap-1.5 group relative">
            <div className="absolute -inset-2 bg-[#8B5CF6]/15 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <HomeIcon active={true} />
            </div>
            <span className="text-[11px] font-bold text-[#A78BFA] tracking-wide relative">Home</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#A78BFA] rounded-full shadow-[0_0_6px_rgba(167,139,250,0.8)]"></div>
          </button>
          <button
            onClick={() => router.push('/leaderboard')}
            className="flex flex-col items-center gap-1.5 group relative"
          >
            <div className="absolute -inset-2 bg-[#8B5CF6]/15 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <TrophyIcon />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors duration-200 tracking-wide relative">Leaderboard</span>
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1.5 group relative"
          >
            <div className="absolute -inset-2 bg-[#8B5CF6]/15 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <UserIcon />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors duration-200 tracking-wide relative">Profile</span>
          </button>
        </div>
      </nav>
      {/* Animations */}
      <style jsx>{`
        @keyframes floatAround {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(10px, -15px) rotate(5deg);
          }
          50% {
            transform: translate(-5px, -25px) rotate(-3deg);
          }
          75% {
            transform: translate(-15px, -10px) rotate(7deg);
          }
        }
      `}</style>
    </main>
  );
}