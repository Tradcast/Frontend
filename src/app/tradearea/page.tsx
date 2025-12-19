"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createChart, CandlestickSeries, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import { createWalletClient, createPublicClient, custom, http, type Hash } from 'viem';
import gameABI from '@/app/game_abi';

// Contract address
const GAME_CONTRACT_ADDRESS = "0x5931fC25bE1C8E40dA9147c5c11397f7422a0009" as `0x${string}`;

// Use Celo mainnet as default (or celoAlfajores for testnet)
const TARGET_CHAIN = celo; // Change to celoAlfajores for testnet

interface WalletData {
  balance_total: number;
  total_profit: number;
  balance_free: number;
  in_position: number;
  long_average: number;
  short_average: number;
  direction: 'long' | 'short' | null;
  position_size: number;
  entry_price: number;
}

interface KlineData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

const ExitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

export default function TradeAreaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  // Wallet hooks
  const { address, isConnected: isWalletConnected, chainId } = useAccount();
  const config = useConfig();
  
  // Check if we're on the correct chain (Celo)
  // Note: Farcaster Frame wallet should already be on Celo based on manifest
  const isOnCorrectChain = chainId ? chainId === TARGET_CHAIN.id : true; // Assume correct if chainId not available
  
  // State for direct viem transaction hash
  const [endGameTxHash, setEndGameTxHash] = useState<Hash | undefined>(undefined);
  
  // Contract write hooks for endGameSession (as fallback)
  const { writeContract: writeEndGame, data: endGameHash, isPending: isEndGamePending, error: endGameError } = useWriteContract();
  
  // Use our direct hash or wagmi hash
  const currentEndGameHash = endGameHash || endGameTxHash;
  
  const { isLoading: isEndGameConfirming, isSuccess: isEndGameConfirmed } = useWaitForTransactionReceipt({
    hash: currentEndGameHash,
  });
  
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialDataLoaded = useRef(false);
  const authTokenRef = useRef<string | null>(null);
  const isAuthenticatedRef = useRef(false);
  const isConnectingRef = useRef(false);
  const finalPointsRef = useRef<number | null>(null);
  const hasEndedGameRef = useRef(false); // Prevent multiple end game calls
  const hasReceivedWalletData = useRef(false); // Track if we've received wallet data from backend
  const isChartDisposedRef = useRef(false); // Track if chart has been disposed
  const prevInPositionRef = useRef<number | null>(null); // Track previous in_position value for liquidation flash
  const isManualCloseRef = useRef(false); // Track if user manually clicked close button

  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [isChartReady, setIsChartReady] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showLiquidatedPopup, setShowLiquidatedPopup] = useState(false);
  const [showGameOverPopup, setShowGameOverPopup] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [showServerBusyError, setShowServerBusyError] = useState(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_AUTH_RETRIES = 5;
  const AUTH_TIMEOUT_MS = 8000; // 8 seconds
  const [walletData, setWalletData] = useState<WalletData>({
    balance_total: 0,
    total_profit: 0,
    balance_free: 0,
    in_position: 0,
    long_average: 0,
    short_average: 0,
    direction: null,
    position_size: 0,
    entry_price: 0
  });

  const parseTimestamp = (ts: any): number => {
    if (ts === undefined || ts === null) return NaN;

    let num = Number(ts);
    if (!isNaN(num)) {
      return num > 9999999999 ? Math.floor(num / 1000) : num;
    }

    const date = new Date(ts);
    if (!isNaN(date.getTime())) {
      return Math.floor(date.getTime() / 1000);
    }

    return NaN;
  };

  // Step 1: Get authentication token from API
  const getAuthToken = useCallback(async () => {
    try {
      setStatus('Authenticating...');

      const { sdk } = await import("@farcaster/frame-sdk");

      const response = await sdk.quickAuth.fetch('/api/verify', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.encrypted_token) {
        throw new Error('No encrypted token in response');
      }

      authTokenRef.current = data.encrypted_token;
      return data.encrypted_token;
    } catch (error: any) {
      console.error('❌ Authentication error:', error.message);
      setAuthError(error.message || 'Failed to authenticate');
      setStatus('Authentication Failed');
      throw error;
    }
  }, []);

  // Step 2: Connect WebSocket with authentication
  const connectWebSocket = useCallback(async (retryCount: number = 0) => {
    // Prevent duplicate connections
    if (isConnectingRef.current) {
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Check if we've exceeded max retries
    if (retryCount >= MAX_AUTH_RETRIES) {
      setShowServerBusyError(true);
      setIsAuthenticating(false);
      return;
    }

    isConnectingRef.current = true;
    setAuthRetryCount(retryCount);

    // Clear any existing auth timeout
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }

    // Get token if we don't have one
    if (!authTokenRef.current) {
      try {
        await getAuthToken();
      } catch (error) {
        isConnectingRef.current = false;
        return;
      }
    }

    try {
      setStatus(`Connecting to server...${retryCount > 0 ? ` (Attempt ${retryCount + 1}/${MAX_AUTH_RETRIES})` : ''}`);
      const ws = new WebSocket('wss://ws.simmerliq.com/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus(`Authenticating with server...${retryCount > 0 ? ` (Attempt ${retryCount + 1}/${MAX_AUTH_RETRIES})` : ''}`);
        isConnectingRef.current = false;

        if (authTokenRef.current) {
          ws.send(JSON.stringify({
            encrypted_token: authTokenRef.current
          }));

          // Start authentication timeout
          authTimeoutRef.current = setTimeout(() => {
            if (!isAuthenticatedRef.current && wsRef.current) {
              console.warn(`⚠️ Authentication timeout (attempt ${retryCount + 1}/${MAX_AUTH_RETRIES})`);
              // Close the current connection
              wsRef.current.onclose = null; // Prevent normal onclose handler
              wsRef.current.close();
              wsRef.current = null;
              isAuthenticatedRef.current = false;
              
              // Retry with incremented count
              const nextRetry = retryCount + 1;
              if (nextRetry >= MAX_AUTH_RETRIES) {
                setShowServerBusyError(true);
                setIsAuthenticating(false);
              } else {
                // Small delay before retry
                setTimeout(() => {
                  connectWebSocket(nextRetry);
                }, 500);
              }
            }
          }, AUTH_TIMEOUT_MS);
        } else {
          console.error('❌ No auth token available');
          ws.close();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle authentication response
          if (data.authenticated === true) {
            // Clear auth timeout on successful authentication
            if (authTimeoutRef.current) {
              clearTimeout(authTimeoutRef.current);
              authTimeoutRef.current = null;
            }
            isAuthenticatedRef.current = true;
            setIsConnected(true);
            setIsAuthenticating(false);
            setAuthRetryCount(0); // Reset retry count on success
            setStatus('Connected');
            isInitialDataLoaded.current = false;

            // Request initial data
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send('start');
              }
            }, 100);
            return;
          }

          // Handle authentication error
          if (data.error) {
            // Clear auth timeout on error
            if (authTimeoutRef.current) {
              clearTimeout(authTimeoutRef.current);
              authTimeoutRef.current = null;
            }
            console.error('❌ WebSocket auth error:', data.error);
            setAuthError(data.error);
            setStatus('Authentication Failed');
            setIsAuthenticating(false);
            ws.close();
            return;
          }

          // Only process data if authenticated
          if (!isAuthenticatedRef.current) {
            return;
          }

          // Helper to format klines
          const formatKline = (item: any): KlineData | null => {
            const timestamp = item.timestamp || item.open_time || item.time || item.t || item[0];
            const open = parseFloat(item.open || item[1]);
            const high = parseFloat(item.high || item[2]);
            const low = parseFloat(item.low || item[3]);
            const close = parseFloat(item.close || item[4]);

            const time = parseTimestamp(timestamp);

            if (isNaN(time) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) return null;
            if (high < low || open <= 0 || close <= 0) return null;

            return { time: time as Time, open, high, low, close };
          };

          // Case 1: Initial historical window
          if (data.type === 'prices' || (data.window && Array.isArray(data.window))) {
            const window = data.window || data.data || [];

            const formatted = window
              .map(formatKline)
              .filter((k: KlineData | null): k is KlineData => k !== null)
              .sort((a: KlineData, b: KlineData) => (a.time as number) - (b.time as number));

            if (formatted.length > 0 && candlestickSeriesRef.current && !isChartDisposedRef.current) {
              try {
                candlestickSeriesRef.current.setData(formatted as any);
              } catch (chartErr) {
                // Chart may be disposed, ignore
              }
            }
          }

          // Case 2: Single kline update
          else if (data.timestamp || data.open_time || data.time || data.open !== undefined) {
            const kline = formatKline(data);
            if (!kline || !candlestickSeriesRef.current || isChartDisposedRef.current) return;

            try {
              const lastCandle = candlestickSeriesRef.current.data().slice(-1)[0];

              if (lastCandle && kline.time === lastCandle.time) {
                candlestickSeriesRef.current.update(kline as any);
              } else if (!lastCandle || kline.time > lastCandle.time) {
                candlestickSeriesRef.current.update(kline as any);
              }
            } catch (chartErr) {
              // Chart may be disposed, ignore
            }
          }

          // Wallet updates
          else if (data.type === 'wallet' && data.wallet) {
            hasReceivedWalletData.current = true; // Mark that we've received wallet data
            setWalletData(prev => ({
              ...prev,
              balance_total: data.wallet.balance_total || 0,
              total_profit: data.wallet.total_profit || 0,
              balance_free: data.wallet.balance_free || 0,
              in_position: data.wallet.in_position || 0,
              long_average: data.wallet.long_average || 0,
              short_average: data.wallet.short_average || 0,
              direction: data.wallet.direction || null,
              position_size: data.wallet.position_size || 0,
              entry_price: data.wallet.entry_price || 0
            }));
          }

        } catch (err) {
          console.error('❌ Message handling error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setStatus('Connection Error');
        isConnectingRef.current = false;
      };

      ws.onclose = async () => {
        setIsConnected(false);
        setStatus('Disconnected');
        wsRef.current = null;
        isAuthenticatedRef.current = false;
        isInitialDataLoaded.current = false;
        isConnectingRef.current = false;

        // Show game over popup if we have sessionId and haven't already ended
        if (sessionId && !hasEndedGameRef.current && address && !showLiquidatedPopup) {
          setShowGameOverPopup(true);
        } else if (!sessionId) {
          // If no sessionId, allow reconnection
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!authError) {
              connectWebSocket();
            }
          }, 3000);
        }
      };

    } catch (error) {
      console.error('❌ Connection error:', error);
      setStatus('Connection Failed');
      isConnectingRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!authError) {
          connectWebSocket();
        }
      }, 3000);
    }
  }, [getAuthToken, authError, showLiquidatedPopup]);

  // Initialize chart
  useEffect(() => {
    const initChart = async () => {
      try {
        if (chartRef.current) {
          return;
        }

        if (!chartContainerRef.current) {
          return;
        }

        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
          layout: {
            background: { color: '#0f0f1a' },
            textColor: '#888',
          },
          grid: {
            vertLines: { color: '#2a2a3e' },
            horzLines: { color: '#2a2a3e' },
          },
          crosshair: {
            mode: 1,
          },
          rightPriceScale: {
            borderColor: '#2a2a3e',
          },
          timeScale: {
            borderColor: '#2a2a3e',
            timeVisible: true,
            secondsVisible: false,
          },
        });

        chartRef.current = chart;
        isChartDisposedRef.current = false; // Reset disposed flag when chart is created

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
          priceFormat: {
            type: 'price',
            precision: 4,
            minMove: 0.0001,
          },
        });

        candlestickSeriesRef.current = candlestickSeries;
        setIsChartReady(true);

        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current && !isChartDisposedRef.current) {
            try {
              chartRef.current.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
              });
            } catch (e) {
              // Chart may be disposed
            }
          }
        };

        window.addEventListener('resize', handleResize);

        setTimeout(() => {
          if (chartContainerRef.current && chartRef.current && !isChartDisposedRef.current) {
            try {
              chartRef.current.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
              });
            } catch (e) {
              // Chart may be disposed
            }
          }
        }, 100);

        return () => {
          window.removeEventListener('resize', handleResize);
        };

      } catch (error) {
        console.error('❌ Chart initialization error:', error);
      }
    };

    initChart();
  }, []);

  // Handle end game transaction confirmation
  useEffect(() => {
    const confirmedHash = endGameHash || endGameTxHash;
    
    if (isEndGameConfirmed && confirmedHash) {
      setStatus('Game ended! Redirecting...');
      hasEndedGameRef.current = true;
      // Navigate back to home after a short delay
      setTimeout(() => {
        router.push('/home');
      }, 2000);
    }
  }, [isEndGameConfirmed, endGameHash, endGameTxHash, router]);

  // Handle end game errors from writeContract hook
  useEffect(() => {
    if (endGameError) {
      // Check if user rejected the transaction
      const errorDetails = (endGameError as any).details;
      if (endGameError.message?.includes('User rejected') || 
          endGameError.message?.includes('user rejected') ||
          (errorDetails && errorDetails.includes('rejected'))) {
        setStatus('Transaction rejected - you can still exit');
        // Mark as attempted to prevent retries, but don't block exit
        hasEndedGameRef.current = true;
      } else if (endGameError.message?.includes('insufficient') || 
                 endGameError.message?.includes('Insufficient') ||
                 endGameError.message?.includes('balance')) {
        setStatus('Insufficient CELO for gas fees');
      } else {
        setStatus(`Transaction failed: ${endGameError.message || 'Unknown error'}`);
      }
    }
  }, [endGameError]);

  // Check for sessionId on mount
  useEffect(() => {
    if (!sessionId) {
      router.push('/home');
    }
  }, [sessionId, router]);

  // Check for position liquidation (in_position drops to 0 while in a position)
  // This triggers a red flash when a single position gets liquidated
  // Does NOT flash when user manually closes their position
  useEffect(() => {
    if (!hasReceivedWalletData.current) return;
    
    const prevInPosition = prevInPositionRef.current;
    const currentInPosition = walletData.in_position;
    
    // Update the ref for next comparison
    prevInPositionRef.current = currentInPosition;
    
    // Flash if in_position went from > 0 to 0 (position got liquidated)
    // BUT only if user didn't manually close the position
    if (prevInPosition !== null && prevInPosition > 0 && currentInPosition === 0) {
      if (isManualCloseRef.current) {
        // User manually closed, don't flash - reset the flag
        isManualCloseRef.current = false;
      } else {
        // Position was liquidated, show red flash
        setShowRedFlash(true);
        setTimeout(() => setShowRedFlash(false), 400);
      }
    }
  }, [walletData.in_position]);

  // Check for total liquidation (balance = 0 OR can't trade anymore)
  useEffect(() => {
    // Only check if authenticated, connected, AND we've received wallet data from backend
    // This prevents the popup from showing on initial load when balance_total defaults to 0
    if (!isAuthenticatedRef.current || !isConnected || isAuthenticating || !hasReceivedWalletData.current) {
      return;
    }

    const isBalanceZero = walletData.balance_total === 0;
    const cantTradeAnymore = walletData.balance_free < 100 && walletData.direction === null;
    
    if (isBalanceZero || cantTradeAnymore) {
      // Trigger red flash effect
      setShowRedFlash(true);
      setTimeout(() => setShowRedFlash(false), 400); // 400ms flash duration
      
      setShowLiquidatedPopup(true);
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    }
  }, [walletData.balance_total, walletData.balance_free, walletData.direction, isConnected, isAuthenticating]);

  // Start authentication and connection
  useEffect(() => {
    if (!sessionId) return; // Don't connect without sessionId
    
    connectWebSocket(0);

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (chartRef.current) {
        isChartDisposedRef.current = true; // Mark as disposed BEFORE removing
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, [connectWebSocket, sessionId]);

  const sendMessage = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isAuthenticatedRef.current) {
      wsRef.current.send(message);
    }
  };

  const handleLong = () => {
    if (walletData.balance_free >= 100) {
      sendMessage('long');
      setStatus('Opening LONG...');
    }
  };

  const handleShort = () => {
    if (walletData.balance_free >= 100) {
      sendMessage('short');
      setStatus('Opening SHORT...');
    }
  };

  const handleClose = () => {
    // Mark that user is manually closing - this prevents the red liquidation flash
    isManualCloseRef.current = true;
    sendMessage('close');
    setStatus('Closing position...');
  };

  // Handle ending game session
  // Helper function to safely get error text without JSON.stringify (which fails on BigInt)
  const getErrorText = (error: any): string => {
    try {
      const parts: string[] = [];
      if (error?.message) parts.push(String(error.message));
      if (error?.shortMessage) parts.push(String(error.shortMessage));
      if (error?.cause?.details) parts.push(String(error.cause.details));
      if (error?.cause?.shortMessage) parts.push(String(error.cause.shortMessage));
      if (error?.cause?.message) parts.push(String(error.cause.message));
      return parts.join(' ').toLowerCase();
    } catch {
      return String(error || '').toLowerCase();
    }
  };

  const handleEndGameSession = useCallback(async (allowExitOnReject: boolean = false) => {
    setSessionError(null); // Clear previous error
    
    if (!sessionId || !address || hasEndedGameRef.current) {
      return allowExitOnReject ? false : undefined; // Return false to indicate it's safe to exit
    }

    try {
      // Calculate TPOINTS tokens to mint based on final balance
      const finalBalance = walletData.balance_total || 0;
      const tpointsAmount = Math.max(0, Math.floor(finalBalance));
      const points = tpointsAmount;
      const pointsInWei = BigInt(tpointsAmount) * BigInt(10 ** 18);
      
      finalPointsRef.current = points;

      // Step 1: Call API to validate end game (QuickAuth secured)
      const { sdk } = await import("@farcaster/frame-sdk");
      
      const apiResponse = await sdk.quickAuth.fetch('/api/game/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          points,
          walletAddress: address,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to end game session');
      }

      let response = await apiResponse.json();
      
      // Step 2: Call smart contract endGameSession on Celo
      try {
        // Get the connector from wagmi
        const connector = config.connectors[0];
        
        if (!connector) {
          throw new Error('Wallet not connected - no connector found');
        }
        
        // Get the provider from connector
        const provider: any = await connector.getProvider();
        
        if (!provider) {
          throw new Error('Provider not available');
        }
        
        // Create public client to check session
        const publicClient = createPublicClient({
          chain: celo,
          transport: http(),
        });
        
        // Check if contract is paused
        try {
          const isPaused = await publicClient.readContract({
            address: GAME_CONTRACT_ADDRESS,
            abi: gameABI,
            functionName: 'paused',
          }) as boolean;
          
          if (isPaused) {
            throw new Error('The game contract is currently paused. Please try again later.');
          }
        } catch (pauseError: any) {
          if (pauseError.message?.includes('paused')) {
            throw pauseError;
          }
          // Continue if we couldn't check pause status
        }
        
        // Check if session exists on-chain
        let sessionExists = false;
        let sessionOwner = '';
        try {
          const sessionData = await publicClient.readContract({
            address: GAME_CONTRACT_ADDRESS,
            abi: gameABI,
            functionName: 'gameSessions',
            args: [BigInt(sessionId)],
          }) as [string, boolean, bigint];
          
          sessionOwner = sessionData[0];
          
          // Check if session exists (player is not zero address)
          if (sessionData[0] === '0x0000000000000000000000000000000000000000') {
            throw new Error('Game session not found on blockchain. Please go back and start a new game.');
          }
          
          sessionExists = true;
          
          // Check if session already ended
          if (sessionData[1]) {
            throw new Error('Game session has already been ended.');
          }
          
          // Check if caller is the session owner
          if (sessionData[0].toLowerCase() !== address.toLowerCase()) {
            throw new Error(`Wallet address mismatch! Please use the same wallet that started the game.`);
          }
        } catch (readError: any) {
          // If it's one of our custom errors, re-throw it
          if (readError.message?.includes('session') || 
              readError.message?.includes('Session') ||
              readError.message?.includes('owner') ||
              readError.message?.includes('paused') ||
              readError.message?.includes('mismatch') ||
              readError.message?.includes('Wallet')) {
            throw readError;
          }
          // If we couldn't read session data, the session probably doesn't exist
          if (!sessionExists) {
            throw new Error('Could not verify game session. The session may not exist on the blockchain.');
          }
        }
        
        // Create viem wallet client directly
        const walletClient = createWalletClient({
          chain: celo,
          transport: custom(provider as any),
          account: address as `0x${string}`,
        });
        
        // Write contract using viem directly
        const hash = await walletClient.writeContract({
          address: GAME_CONTRACT_ADDRESS,
          abi: gameABI,
          functionName: 'endGameSession',
          args: [BigInt(sessionId), pointsInWei, response.signature],
          gas: BigInt(200000),
        });
        
        setEndGameTxHash(hash);
        setStatus('Ending game session...');
        return true; // Transaction initiated
        
      } catch (directError: any) {
        const errorText = getErrorText(directError);
        
        // Check if user rejected the transaction
        if (errorText.includes('user rejected') || errorText.includes('rejected the request')) {
          throw new Error('Transaction was rejected by the wallet. Please try again or start a new game.');
        }
        
        // Check if it's the getChainId error
        if (directError?.message?.includes('getChainId') || 
            directError?.message?.includes('is not a function')) {
          throw new Error('Wallet connection error. Please refresh the page and try again.');
        }
        
        // Check for insufficient funds
        if (errorText.includes('insufficient') || errorText.includes('balance')) {
          throw new Error('Insufficient CELO balance for gas fees.');
        }
        
        // Check if it's one of our custom session errors
        if (directError?.message?.includes('session') || 
            directError?.message?.includes('Session') ||
            directError?.message?.includes('mismatch') ||
            directError?.message?.includes('Wallet')) {
          throw directError;
        }
        
        throw directError;
      }
    } catch (error: any) {
      const errorText = getErrorText(error);
      
      // Always mark as ended to prevent retries
      hasEndedGameRef.current = true;
      
      // Set appropriate status message
      if (errorText.includes('rejected') || errorText.includes('user rejected')) {
        setStatus('Transaction rejected');
        setSessionError('Transaction was rejected. Try starting a new game.');
      } else if (errorText.includes('insufficient') || errorText.includes('balance')) {
        setStatus('Insufficient CELO');
        setSessionError('Insufficient CELO for gas fees.');
      } else if (errorText.includes('session') || errorText.includes('mismatch')) {
        setStatus('Session error');
        setSessionError(error.message);
      } else {
        setStatus('Error');
        setSessionError(error.message || 'Unknown error');
      }
      
      // Always allow exit on error
      if (allowExitOnReject) {
        return false;
      }
      throw error;
    }
  }, [sessionId, address, walletData, config, chainId]);

  const handleExitAttempt = async () => {
    const hasPosition = walletData.direction !== null;
    if (hasPosition) {
      setShowExitWarning(true);
      setTimeout(() => setShowExitWarning(false), 3000);
      return;
    }
    
    // Show claiming state
    setIsClaiming(true);
    
    // Close WebSocket first
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    
    // Try to end game session, but don't block exit if it fails
    if (sessionId && !hasEndedGameRef.current) {
      try {
        const result = await handleEndGameSession(true);
        
        // If transaction was initiated (not rejected), wait a bit
        if (result === true) {
          setTimeout(() => {
            setIsClaiming(false);
            router.push('/home');
          }, 500);
        } else {
          setIsClaiming(false);
          router.push('/home');
        }
      } catch (error: any) {
        // On error, still allow exit
        setIsClaiming(false);
        router.push('/home');
      }
    } else {
      setIsClaiming(false);
      router.push('/home');
    }
  };

  // Handle claim & exit from game over popup
  const handleGameOverClaimAndExit = async () => {
    setShowGameOverPopup(false);
    
    // Close WebSocket if still open
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    
    // Try to end game session
    if (sessionId && !hasEndedGameRef.current && address) {
      try {
        const result = await handleEndGameSession(true);
        if (result === true) {
          setTimeout(() => {
            router.push('/home');
          }, 500);
        } else {
          router.push('/home');
        }
      } catch (error) {
        router.push('/home');
      }
    } else {
      router.push('/home');
    }
  };

  // Handle just exit from game over popup (no claim)
  const handleGameOverExit = () => {
    setShowGameOverPopup(false);
    hasEndedGameRef.current = true;
    router.push('/home');
  };

  // Handle go home from liquidation popup
  const handleLiquidatedGoHome = () => {
    setShowLiquidatedPopup(false);
    hasEndedGameRef.current = true;
    router.push('/home');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const percent = value * 100;
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const canTrade = isConnected && isAuthenticatedRef.current && walletData.balance_free >= 100;
  const hasPosition = walletData.direction !== null;

  // Show authentication error
  if (authError) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#0f0f1a',
        height: '100vh',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444', marginBottom: '10px' }}>
          Authentication Failed
        </div>
        <div style={{ fontSize: '14px', color: '#888', textAlign: 'center', maxWidth: '300px' }}>
          {authError}
        </div>
        <button
          onClick={() => router.push('/home')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6366f1',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '600',
            marginTop: '20px'
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Show server busy error (after max retries)
  if (showServerBusyError) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#0f0f1a',
        height: '100vh',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '10px' }}>🔄</div>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#f59e0b', marginBottom: '10px', textAlign: 'center' }}>
          Game is Too Busy
        </div>
        <div style={{ fontSize: '15px', color: '#94a3b8', textAlign: 'center', maxWidth: '320px', lineHeight: '1.6' }}>
          The game server is experiencing high traffic at the moment. Please try again later.
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#10b981', 
          textAlign: 'center', 
          maxWidth: '320px', 
          marginTop: '8px',
          padding: '12px 16px',
          backgroundColor: '#10b98115',
          borderRadius: '12px',
          border: '1px solid #10b98130'
        }}>
          💰 Your funds and transaction fee will be returned.
        </div>
        <button
          onClick={() => router.push('/home')}
          style={{
            padding: '14px 32px',
            backgroundColor: '#6366f1',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '15px',
            marginTop: '24px',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '10px',
      paddingBottom: '24px',
      backgroundColor: '#0f0f1a',
      height: '100vh',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      boxSizing: 'border-box',
    }}>

      {/* Red Flash Effect - triggered when balance becomes 0 */}
      {showRedFlash && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          zIndex: 99999,
          pointerEvents: 'none',
          animation: 'redFlash 400ms ease-out forwards',
        }} />
      )}

      <style>{`
        @keyframes redFlash {
          0% {
            opacity: 1;
            backgroundColor: rgba(239, 68, 68, 0.7);
            boxShadow: inset 0 0 100px rgba(239, 68, 68, 0.8);
          }
          50% {
            opacity: 0.8;
            backgroundColor: rgba(239, 68, 68, 0.5);
          }
          100% {
            opacity: 0;
            backgroundColor: rgba(239, 68, 68, 0);
          }
        }
      `}</style>

      {/* Loading Overlay - shown while authenticating but allows chart to initialize */}
      {isAuthenticating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0f0f1a',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Background gradient effects */}
          <div style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '256px',
            height: '256px',
            background: '#8B5CF6',
            opacity: 0.1,
            filter: 'blur(80px)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: '256px',
            height: '256px',
            background: '#A78BFA',
            opacity: 0.08,
            filter: 'blur(70px)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}></div>
          
          {/* Animated spinner */}
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            marginBottom: '24px',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '4px solid rgba(139, 92, 246, 0.2)',
            }}></div>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '4px solid transparent',
              borderTopColor: '#A78BFA',
              animation: 'spin 1s linear infinite',
            }}></div>
            <div style={{
              position: 'absolute',
              inset: '8px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(139, 92, 246, 0.2))',
              backdropFilter: 'blur(12px)',
            }}></div>
          </div>

          {/* Loading text */}
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            background: 'linear-gradient(90deg, white, #A78BFA, white)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            Loading Tradcast
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px',
          }}>
            {status || 'Connecting to server...'}
          </p>
          {authRetryCount > 0 && (
            <p style={{
              color: '#f59e0b',
              fontSize: '12px',
              marginTop: '8px',
            }}>
              Retrying connection... ({authRetryCount}/{MAX_AUTH_RETRIES})
            </p>
          )}

          {/* Pulsing dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#A78BFA',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#A78BFA',
              animation: 'pulse 1.5s ease-in-out infinite 0.2s',
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#A78BFA',
              animation: 'pulse 1.5s ease-in-out infinite 0.4s',
            }}></div>
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.4; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {showExitWarning && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 999
          }} onClick={() => setShowExitWarning(false)} />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#1a1a2e',
            border: '2px solid #ef4444',
            borderRadius: '16px',
            padding: '24px',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            maxWidth: '90%',
            width: '320px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#ef4444',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              ⚠️ Active Position!
            </div>
            <div style={{
              fontSize: '13px',
              color: '#a0a0b0',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              You must close your position before exiting the game.
            </div>
          </div>
        </>
      )}

      {/* Liquidated Popup */}
      {showLiquidatedPopup && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999
          }} />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#1a1a2e',
            border: '2px solid #ef4444',
            borderRadius: '20px',
            padding: '32px',
            zIndex: 10000,
            boxShadow: '0 12px 48px rgba(239, 68, 68, 0.3)',
            maxWidth: '90%',
            width: '340px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '16px',
              filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))'
            }}>
              😢
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#ef4444',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Liquidated!
            </div>
            <div style={{
              fontSize: '14px',
              color: '#a0a0b0',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Your balance reached $0. Better luck next time!
            </div>
            <button
              onClick={handleLiquidatedGoHome}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#6366f1',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '15px',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              Go to Home Page
            </button>
          </div>
        </>
      )}

      {/* Game Over Popup (WebSocket Disconnected) */}
      {showGameOverPopup && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999
          }} />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#1a1a2e',
            border: '2px solid #8b5cf6',
            borderRadius: '20px',
            padding: '32px',
            zIndex: 10000,
            boxShadow: '0 12px 48px rgba(139, 92, 246, 0.3)',
            maxWidth: '90%',
            width: '340px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              🎮
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Game Over
            </div>
            <div style={{
              fontSize: '14px',
              color: '#a0a0b0',
              marginBottom: '8px',
              lineHeight: '1.6'
            }}>
              Your game session has ended.
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '24px'
            }}>
              Final Balance: {Math.floor(walletData.balance_total).toLocaleString()} TPOINTS
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <button
                onClick={handleGameOverClaimAndExit}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '15px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ExitIcon />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span>Claim & Exit</span>
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>
                    {Math.floor(walletData.balance_total).toLocaleString()} TPOINTS
                  </span>
                </div>
              </button>
              <button
                onClick={handleGameOverExit}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: '#6366f1',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        padding: '8px 12px',
        backgroundColor: '#1a1a2e',
        borderRadius: '10px',
        border: '1px solid #2a2a3e',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            ₿
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', lineHeight: '1.2' }}>
              Tradcast
            </h1>
            <div style={{
              fontSize: '9px',
              color: isConnected && isAuthenticatedRef.current ? '#10b981' : isAuthenticating ? '#f59e0b' : '#ef4444',
              fontWeight: '500',
              marginTop: '2px'
            }}>
              ● {status}
              {(isEndGamePending || isEndGameConfirming) && ' (Ending game...)'}
            </div>
            {sessionError && (
              <div style={{
                fontSize: '8px',
                color: '#ef4444',
                fontWeight: '500',
                marginTop: '2px',
                maxWidth: '200px',
              }}>
                ⚠️ {sessionError}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleExitAttempt} 
          disabled={isClaiming}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: isClaiming ? '#6366f120' : (hasPosition ? '#ef444420' : '#10b98120'),
            border: isClaiming ? '1px solid #6366f1' : (hasPosition ? '1px solid #ef4444' : '1px solid #10b981'),
            borderRadius: '8px',
            color: isClaiming ? '#6366f1' : (hasPosition ? '#ef4444' : '#10b981'),
            cursor: isClaiming ? 'wait' : 'pointer',
            fontSize: '11px',
            fontWeight: '600',
            opacity: isClaiming ? 0.8 : 1,
          }}>
          {isClaiming ? (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #6366f140',
              borderTop: '2px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          ) : (
            <ExitIcon />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span>{isClaiming ? 'Claiming...' : 'Claim & Exit'}</span>
            <span style={{ fontSize: '9px', opacity: 0.8 }}>
              {Math.floor(walletData.balance_total).toLocaleString()} TPOINTS
            </span>
          </div>
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '8px',
        flexShrink: 0
      }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '10px',
          padding: '10px 8px',
          border: '1px solid #2a2a3e',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '9px', color: '#888', marginBottom: '3px' }}>Leverage</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            20×
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '10px',
          padding: '10px 8px',
          border: `1px solid ${walletData.total_profit >= 0 ? '#10b98130' : '#ef444430'}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '9px', color: '#888', marginBottom: '3px' }}>Total P&L</div>
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: walletData.total_profit >= 0 ? '#10b981' : '#ef4444'
          }}>
            {formatPercent(walletData.total_profit)}
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '10px',
          padding: '10px 8px',
          border: '1px solid #2a2a3e',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '9px', color: '#888', marginBottom: '3px' }}>Balance</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
            {formatCurrency(walletData.balance_total)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        backgroundColor: '#1a1a2e',
        borderRadius: '10px',
        padding: '10px',
        border: '1px solid #2a2a3e',
        marginBottom: '8px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        <div
          ref={chartContainerRef}
          style={{
            width: '100%',
            flex: 1,
            minHeight: 0,
            position: 'relative'
          }}
        >
          {(!isChartReady || isAuthenticating) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#888',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {isAuthenticating ? 'Authenticating...' : 'Loading chart...'}
            </div>
          )}
        </div>
      </div>

      {/* Balance Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '8px',
        flexShrink: 0
      }}>
        <div style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '10px',
          padding: '10px',
          border: '1px solid #2a2a3e'
        }}>
          <div style={{ fontSize: '9px', color: '#888', marginBottom: '3px' }}>Free Balance</div>
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: walletData.balance_free >= 100 ? '#10b981' : '#ef4444'
          }}>
            {formatCurrency(walletData.balance_free)}
          </div>
          {walletData.balance_free < 100 && (
            <div style={{ fontSize: '8px', color: '#ef4444', marginTop: '2px', fontWeight: '500' }}>
              Min $100 to trade
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '10px',
          padding: '10px',
          border: '1px solid #2a2a3e'
        }}>
          <div style={{ fontSize: '9px', color: '#888', marginBottom: '3px' }}>In Position</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
            {formatCurrency(walletData.in_position)}
          </div>
          {hasPosition && (
            <div style={{
              fontSize: '8px',
              color: walletData.direction === 'long' ? '#10b981' : '#ef4444',
              marginTop: '2px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {walletData.direction}
            </div>
          )}
        </div>
      </div>

      {/* Trading Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        flexShrink: 0,
        marginTop: '8px',
        marginBottom: '16px',
      }}>
        <button onClick={handleLong} disabled={!canTrade} style={{
          padding: '14px 8px',
          backgroundColor: canTrade ? '#10b981' : '#2a2a3e',
          color: canTrade ? 'white' : '#666',
          border: 'none',
          borderRadius: '10px',
          cursor: canTrade ? 'pointer' : 'not-allowed',
          fontWeight: '700',
          fontSize: '13px',
          boxShadow: canTrade ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Long
        </button>

        <button onClick={handleShort} disabled={!canTrade} style={{
          padding: '14px 8px',
          backgroundColor: canTrade ? '#ef4444' : '#2a2a3e',
          color: canTrade ? 'white' : '#666',
          border: 'none',
          borderRadius: '10px',
          cursor: canTrade ? 'pointer' : 'not-allowed',
          fontWeight: '700',
          fontSize: '13px',
          boxShadow: canTrade ? '0 4px 12px rgba(239, 68, 68, 0.4)' : 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Short
        </button>

        <button onClick={handleClose} disabled={!isConnected || !hasPosition || !isAuthenticatedRef.current} style={{
          padding: '14px 8px',
          backgroundColor: (isConnected && hasPosition && isAuthenticatedRef.current) ? '#6366f1' : '#2a2a3e',
          color: (isConnected && hasPosition && isAuthenticatedRef.current) ? 'white' : '#666',
          border: 'none',
          borderRadius: '10px',
          cursor: (isConnected && hasPosition && isAuthenticatedRef.current) ? 'pointer' : 'not-allowed',
          fontWeight: '700',
          fontSize: '13px',
          boxShadow: (isConnected && hasPosition && isAuthenticatedRef.current) ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Close
        </button>
      </div>
    </div>
  );
}