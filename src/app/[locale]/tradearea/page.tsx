"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { createChart, CandlestickSeries, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig, useSwitchChain } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import {
  createWalletClient,
  custom,
  encodeFunctionData,
  type Hash,
} from 'viem';
import { createCeloPublicClientForApp } from '@/lib/celo-public-client';
import gameABI from '@/app/game_abi';
import tokenABI from '@/app/token_abi';
import { useMiniApp } from '@/contexts/miniapp-context';
import { env } from '@/lib/env';
import { ensureWalletOnCeloChain } from '@/lib/ensure-celo-chain';
import { getCeloFeeCurrencyForPaymentToken } from '@/lib/celo-fee-currency';
import { sendCeloWebTxWithStableGasFeeOrCelo } from '@/lib/celo-web-stable-gas-tx';
import { SplashScreen } from '@/components/SplashScreen';

const GAME_CONTRACT_ADDRESS = "0x2AF88995303B5e02b705A904e478729CD9ABc319" as `0x${string}`;
const TOKEN_CONTRACT_ADDRESS = "0x346528259cdF48fa1e5B23194828B477362B80f0" as `0x${string}`;
const TARGET_CHAIN = celo;

// Helper to detect wallet-based auth environments (MiniPay or Web)
const useWalletAuth = (isMiniPay: boolean, isWeb: boolean) => isMiniPay || isWeb;

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
  const t = useTranslations('tradearea');
  const navigateHome = useCallback((refreshTpoints: boolean = false) => {
    if (!refreshTpoints) {
      router.push('/home');
      return;
    }

    const params = new URLSearchParams();
    params.set('refreshTpoints', '1');
    if (expectedMintWeiRef.current > 0n) {
      params.set('expectedMintWei', expectedMintWeiRef.current.toString());
    }
    if (preMintBalanceWeiRef.current !== null) {
      params.set('preMintBalanceWei', preMintBalanceWeiRef.current.toString());
    }
    router.push(`/home?${params.toString()}`);
  }, [router]);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const skipTx = searchParams.get('skipTx') === 'true';
  /** From home paid start — used to pay gas in stablecoin on web (Celo feeCurrency). */
  const sessionPaymentToken = searchParams.get('paymentToken');
  const { isMiniPay, isWeb, isFarcaster } = useMiniApp();
  
  const { address, isConnected: isWalletConnected, connector: activeConnector } = useAccount();
  const config = useConfig();
  const { switchChainAsync } = useSwitchChain();

  // Determine if we use wallet-based auth
  const isWalletAuthMode = useWalletAuth(isMiniPay, isWeb);
  
  const [endGameTxHash, setEndGameTxHash] = useState<Hash | undefined>(undefined);
  
  const { writeContract: writeEndGame, data: endGameHash, isPending: isEndGamePending, error: endGameError } = useWriteContract();
  
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
  const preMintBalanceWeiRef = useRef<bigint | null>(null);
  const expectedMintWeiRef = useRef<bigint>(0n);
  const hasEndedGameRef = useRef(false);
  const hasReceivedWalletData = useRef(false);
  const isChartDisposedRef = useRef(false);
  const prevInPositionRef = useRef<number | null>(null);
  const isManualCloseRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('');
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
  const AUTH_TIMEOUT_MS = 8000;
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

  const getAuthToken = useCallback(async () => {
    try {
      setStatus(t('statusAuthenticating'));
      
      let response;
      if (isWalletAuthMode) {
        // MiniPay or Web: use regular fetch with wallet address
        const authType = isWeb ? 'web' : 'minipay';
        console.log(`🔵 ${authType.toUpperCase()}: Getting auth token with fid (wallet):`, address);
        const authParam = isWeb ? `fid=${encodeURIComponent(address!)}&authType=web` : `fid=${encodeURIComponent(address!)}`;
        response = await fetch(`/api/verify?${authParam}`, {
          method: 'POST',
        });
      } else {
        // Farcaster: use SDK quickAuth
        const { sdk } = await import("@farcaster/frame-sdk");
        response = await sdk.quickAuth.fetch('/api/verify', {
          method: 'POST',
        });
      }
      
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
      setStatus(t('statusAuthFailed'));
      throw error;
    }
  }, [address, isWalletAuthMode, isWeb, t]);

  const connectWebSocket = useCallback(async (retryCount: number = 0) => {
    if (isConnectingRef.current) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
    if (retryCount >= MAX_AUTH_RETRIES) {
      setShowServerBusyError(true);
      setIsAuthenticating(false);
      return;
    }

    isConnectingRef.current = true;
    setAuthRetryCount(retryCount);

    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }

    if (!authTokenRef.current) {
      try {
        await getAuthToken();
      } catch (error) {
        isConnectingRef.current = false;
        return;
      }
    }

    try {
      setStatus(
        retryCount > 0
          ? t('connectingServerAttempt', { n: retryCount + 1, max: MAX_AUTH_RETRIES })
          : t('connectingServer')
      );
      const ws = new WebSocket(env.NEXT_PUBLIC_TRADE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus(
          retryCount > 0
            ? t('authenticatingServerAttempt', { n: retryCount + 1, max: MAX_AUTH_RETRIES })
            : t('authenticatingServer')
        );
        isConnectingRef.current = false;

        if (authTokenRef.current) {
          ws.send(JSON.stringify({ encrypted_token: authTokenRef.current }));
          authTimeoutRef.current = setTimeout(() => {
            if (!isAuthenticatedRef.current && wsRef.current) {
              console.warn(`⚠️ Authentication timeout (attempt ${retryCount + 1}/${MAX_AUTH_RETRIES})`);
              wsRef.current.onclose = null;
              wsRef.current.close();
              wsRef.current = null;
              isAuthenticatedRef.current = false;
              const nextRetry = retryCount + 1;
              if (nextRetry >= MAX_AUTH_RETRIES) {
                setShowServerBusyError(true);
                setIsAuthenticating(false);
              } else {
                setTimeout(() => connectWebSocket(nextRetry), 500);
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

          if (data.authenticated === true) {
            if (authTimeoutRef.current) {
              clearTimeout(authTimeoutRef.current);
              authTimeoutRef.current = null;
            }
            isAuthenticatedRef.current = true;
            setIsConnected(true);
            setIsAuthenticating(false);
            setAuthRetryCount(0);
            setStatus(t('statusConnected'));
            isInitialDataLoaded.current = false;
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) ws.send('start');
            }, 100);
            return;
          }

          if (data.error) {
            if (authTimeoutRef.current) {
              clearTimeout(authTimeoutRef.current);
              authTimeoutRef.current = null;
            }
            console.error('❌ WebSocket auth error:', data.error);
            setAuthError(data.error);
            setStatus(t('statusAuthFailed'));
            setIsAuthenticating(false);
            ws.close();
            return;
          }

          if (!isAuthenticatedRef.current) return;

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

          if (data.type === 'prices' || (data.window && Array.isArray(data.window))) {
            const window = data.window || data.data || [];
            const formatted = window
              .map(formatKline)
              .filter((k: KlineData | null): k is KlineData => k !== null)
              .sort((a: KlineData, b: KlineData) => (a.time as number) - (b.time as number));
            if (formatted.length > 0 && candlestickSeriesRef.current && !isChartDisposedRef.current) {
              try {
                candlestickSeriesRef.current.setData(formatted as any);
                // Scroll to show latest candles after data load
                if (chartRef.current) {
                  chartRef.current.timeScale().scrollToRealTime();
                }
              } catch (chartErr) {}
            }
          }
          else if (data.timestamp || data.open_time || data.time || data.open !== undefined) {
            const kline = formatKline(data);
            if (!kline || !candlestickSeriesRef.current || isChartDisposedRef.current) return;
            try {
              const lastCandle = candlestickSeriesRef.current.data().slice(-1)[0];
              if (lastCandle && kline.time === lastCandle.time) {
                candlestickSeriesRef.current.update(kline as any);
              } else if (!lastCandle || kline.time > lastCandle.time) {
                candlestickSeriesRef.current.update(kline as any);
                // Keep view on latest candle when new candle arrives
                if (chartRef.current) {
                  chartRef.current.timeScale().scrollToRealTime();
                }
              }
            } catch (chartErr) {}
          }
          else if (data.type === 'wallet' && data.wallet) {
            hasReceivedWalletData.current = true;
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
        setStatus(t('statusConnectionError'));
        isConnectingRef.current = false;
      };

      ws.onclose = async () => {
        setIsConnected(false);
        setStatus(t('statusDisconnected'));
        wsRef.current = null;
        isAuthenticatedRef.current = false;
        isInitialDataLoaded.current = false;
        isConnectingRef.current = false;

        if (sessionId && !hasEndedGameRef.current && address && !showLiquidatedPopup) {
          setShowGameOverPopup(true);
        } else if (!sessionId) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!authError) connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('❌ Connection error:', error);
      setStatus(t('statusConnectionFailed'));
      isConnectingRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!authError) connectWebSocket();
      }, 3000);
    }
  }, [getAuthToken, authError, showLiquidatedPopup, t]);

  // Initialize chart with light theme and dynamic sizing
  // Reference dimensions from Farcaster miniapp (377x360)
  const REFERENCE_WIDTH = 377;
  const REFERENCE_HEIGHT = 360;
  const TARGET_CANDLES = 60;
  
  // Calculate bar spacing to fit target candles in width
  const calculateBarSpacing = (width: number) => {
    // Base spacing for reference width to fit 60 candles
    // Account for right price scale (~50px) and some padding
    const chartAreaWidth = width - 50;
    return Math.max(3, chartAreaWidth / TARGET_CANDLES);
  };

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    
    const initChart = async () => {
      try {
        if (chartRef.current || !chartContainerRef.current) return;

        const container = chartContainerRef.current;
        const initialWidth = container.clientWidth || REFERENCE_WIDTH;
        const initialHeight = container.clientHeight || REFERENCE_HEIGHT;
        const initialBarSpacing = calculateBarSpacing(initialWidth);
        
        const chart = createChart(container, {
          width: initialWidth,
          height: initialHeight,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#6b7280',
          },
          grid: {
            vertLines: { color: '#f3f4f6' },
            horzLines: { color: '#f3f4f6' },
          },
          crosshair: { mode: 1 },
          rightPriceScale: { 
            borderColor: '#e5e7eb',
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
          timeScale: {
            borderColor: '#e5e7eb',
            timeVisible: true,
            secondsVisible: false,
            barSpacing: initialBarSpacing,
            rightOffset: 5,
            fixLeftEdge: false,
            fixRightEdge: true,
          },
        });

        chartRef.current = chart;
        isChartDisposedRef.current = false;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
          priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
        });

        candlestickSeriesRef.current = candlestickSeries;
        setIsChartReady(true);

        // Resize handler for dynamic chart sizing with auto-scaling
        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current && !isChartDisposedRef.current) {
            try {
              const newWidth = chartContainerRef.current.clientWidth;
              const newHeight = chartContainerRef.current.clientHeight;
              if (newWidth > 0 && newHeight > 0) {
                const newBarSpacing = calculateBarSpacing(newWidth);
                chartRef.current.applyOptions({
                  width: newWidth,
                  height: newHeight,
                });
                chartRef.current.timeScale().applyOptions({
                  barSpacing: newBarSpacing,
                });
                // Scroll to show latest candles after resize
                chartRef.current.timeScale().scrollToRealTime();
              }
            } catch (e) {}
          }
        };

        // Use ResizeObserver for container size changes (more reliable than window resize)
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target === container) {
              handleResize();
            }
          }
        });
        resizeObserver.observe(container);

        // Also listen for window resize as fallback
        window.addEventListener('resize', handleResize);
        
        // Initial resize after layout settles
        setTimeout(handleResize, 100);
        setTimeout(handleResize, 500); // Extra delay for flex layouts

        return () => {
          window.removeEventListener('resize', handleResize);
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
        };
      } catch (error) {
        console.error('❌ Chart initialization error:', error);
      }
    };

    initChart();
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const confirmedHash = endGameHash || endGameTxHash;
    if (isEndGameConfirmed && confirmedHash) {
      hasEndedGameRef.current = true;
      if (skipTx) {
        setStatus(t('statusGameEnded'));
        setTimeout(() => navigateHome(false), 1000);
        return;
      }

      (async () => {
        setStatus(t('statusWaitingMint'));
        await waitForTpointMint();
        setStatus(t('statusGameEnded'));
        setTimeout(() => navigateHome(true), 500);
      })();
    }
  }, [isEndGameConfirmed, endGameHash, endGameTxHash, skipTx, waitForTpointMint, navigateHome, t]);

  useEffect(() => {
    if (endGameError) {
      const errorDetails = (endGameError as any).details;
      if (endGameError.message?.includes('User rejected') || 
          endGameError.message?.includes('user rejected') ||
          (errorDetails && errorDetails.includes('rejected'))) {
        setStatus(t('statusTxRejected'));
        hasEndedGameRef.current = true;
      } else if (endGameError.message?.includes('insufficient') || 
                 endGameError.message?.includes('Insufficient') ||
                 endGameError.message?.includes('balance')) {
        setStatus(t('statusInsufficientGas'));
      } else {
        setStatus(t('transactionFailed', { message: endGameError.message || 'Unknown error' }));
      }
    }
  }, [endGameError, t]);

  useEffect(() => {
    if (!sessionId) router.push('/home');
  }, [sessionId, router]);

  useEffect(() => {
    if (!hasReceivedWalletData.current) return;
    const prevInPosition = prevInPositionRef.current;
    const currentInPosition = walletData.in_position;
    prevInPositionRef.current = currentInPosition;
    if (prevInPosition !== null && prevInPosition > 0 && currentInPosition === 0) {
      if (isManualCloseRef.current) {
        isManualCloseRef.current = false;
      } else {
        setShowRedFlash(true);
        setTimeout(() => setShowRedFlash(false), 400);
      }
    }
  }, [walletData.in_position]);

  useEffect(() => {
    if (!isAuthenticatedRef.current || !isConnected || isAuthenticating || !hasReceivedWalletData.current) return;
    const isBalanceZero = walletData.balance_total === 0;
    const cantTradeAnymore = walletData.balance_free < 100 && walletData.direction === null;
    if (isBalanceZero || cantTradeAnymore) {
      setShowRedFlash(true);
      setTimeout(() => setShowRedFlash(false), 400);
      setShowLiquidatedPopup(true);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    }
  }, [walletData.balance_total, walletData.balance_free, walletData.direction, isConnected, isAuthenticating]);

  useEffect(() => {
    if (!sessionId) return;
    
    // For MiniPay/Web, wait for wallet address before connecting
    if (isWalletAuthMode && !address) {
      console.log('🔵 Wallet auth: Waiting for wallet address before connecting WebSocket...');
      return;
    }
    
    connectWebSocket(0);
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (chartRef.current) {
        isChartDisposedRef.current = true;
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, [connectWebSocket, sessionId, address]);

  // MiniPay/Web: Handle visibility change to reconnect when app returns to foreground
  useEffect(() => {
    if (!isWalletAuthMode) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔵 Wallet auth: App returned to foreground');
        // Check if WebSocket is disconnected and reconnect
        if (sessionId && address && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
          console.log('🔵 Wallet auth: Reconnecting WebSocket...');
          authTokenRef.current = null; // Clear old token to get a fresh one
          isAuthenticatedRef.current = false;
          isConnectingRef.current = false;
          setIsAuthenticating(true);
          connectWebSocket(0);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, address, connectWebSocket, isWalletAuthMode]);

  // MiniPay/Web: Send periodic ping to keep connection alive
  useEffect(() => {
    if (!isWalletAuthMode || !isConnected) return;
    
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send a ping/heartbeat to keep connection alive
        try {
          wsRef.current.send('ping');
        } catch (e) {
          console.warn('🔵 Wallet auth: Ping failed, connection might be dead');
        }
      }
    }, 25000); // Every 25 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, isWalletAuthMode]);

  const sendMessage = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isAuthenticatedRef.current) {
      wsRef.current.send(message);
    }
  };

  const handleLong = () => {
    if (walletData.balance_free >= 100) {
      sendMessage('long');
    }
  };

  const handleShort = () => {
    if (walletData.balance_free >= 100) {
      sendMessage('short');
    }
  };

  const handleClose = () => {
    isManualCloseRef.current = true;
    sendMessage('close');
  };

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

  async function waitForTpointMint() {
    if (!address) return;
    const expectedMintWei = expectedMintWeiRef.current;
    const preMintBalanceWei = preMintBalanceWeiRef.current;

    // Nothing expected or no baseline balance available: don't block redirect.
    if (expectedMintWei <= 0n || preMintBalanceWei === null) return;

    const targetBalanceWei = preMintBalanceWei + expectedMintWei;
    const publicClient = createCeloPublicClientForApp();

    for (let attempt = 0; attempt < 12; attempt++) {
      try {
        const currentBalanceWei = await publicClient.readContract({
          address: TOKEN_CONTRACT_ADDRESS,
          abi: tokenABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
          authorizationList: undefined,
        }) as bigint;

        if (currentBalanceWei >= targetBalanceWei) {
          return;
        }
      } catch (error) {
        // Keep polling despite transient RPC/indexing errors.
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  const handleEndGameSession = useCallback(async (allowExitOnReject: boolean = false) => {
    setSessionError(null);
    if (!sessionId || !address || hasEndedGameRef.current) {
      return allowExitOnReject ? false : undefined;
    }

    try {
      const finalBalance = walletData.balance_total || 0;
      const tpointsAmount = Math.max(0, Math.floor(finalBalance));
      const points = tpointsAmount;
      const pointsInWei = BigInt(tpointsAmount) * BigInt(10 ** 18);
      finalPointsRef.current = points;
      expectedMintWeiRef.current = pointsInWei;

      let apiResponse;
      if (isWalletAuthMode) {
        const authType = isWeb ? 'web' : 'minipay';
        console.log(`🔵 ${authType.toUpperCase()}: Ending game session with fid (wallet):`, address);
        const authParam = isWeb ? `fid=${encodeURIComponent(address!)}&authType=web` : `fid=${encodeURIComponent(address!)}`;
        apiResponse = await fetch(`/api/game/end?${authParam}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, points, walletAddress: address }),
        });
      } else {
        const { sdk } = await import("@farcaster/frame-sdk");
        apiResponse = await sdk.quickAuth.fetch('/api/game/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, points, walletAddress: address }),
        });
      }

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to end game session');
      }

      let response = await apiResponse.json();

      if (skipTx) {
        console.log('🟢 Free play mode - skipping end game contract call');
        hasEndedGameRef.current = true;
        setStatus(t('statusGameEnded'));
        setTimeout(() => navigateHome(false), 1000);
        return true;
      }
      
      try {
        let provider: any = null;
        const connector = activeConnector ?? config.connectors[0];
        if (connector) {
          try { provider = await connector.getProvider(); } catch {}
        }
        if (!provider && typeof window !== 'undefined' && (window as any).ethereum) {
          provider = (window as any).ethereum;
        }
        if (!provider) throw new Error('Provider not available. Try refreshing or reconnecting your wallet.');
        
        const publicClient = createCeloPublicClientForApp();
        try {
          const preMintBalanceWei = await publicClient.readContract({
            address: TOKEN_CONTRACT_ADDRESS,
            abi: tokenABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
            authorizationList: undefined,
          }) as bigint;
          preMintBalanceWeiRef.current = preMintBalanceWei;
        } catch {
          preMintBalanceWeiRef.current = null;
        }
        
        try {
          const isPaused = await publicClient.readContract({
            address: GAME_CONTRACT_ADDRESS,
            abi: gameABI,
            functionName: 'paused',
            authorizationList: undefined,
          }) as boolean;
          if (isPaused) throw new Error('The game contract is currently paused. Please try again later.');
        } catch (pauseError: any) {
          if (pauseError.message?.includes('paused')) throw pauseError;
        }
        
        let sessionExists = false;
        try {
          const sessionData = await publicClient.readContract({
            address: GAME_CONTRACT_ADDRESS,
            abi: gameABI,
            functionName: 'gameSessions',
            args: [BigInt(sessionId)],
            authorizationList: undefined,
          }) as [string, boolean, bigint];
          
          if (sessionData[0] === '0x0000000000000000000000000000000000000000') {
            throw new Error('Game session not found on blockchain. Please go back and start a new game.');
          }
          sessionExists = true;
          if (sessionData[1]) throw new Error('Game session has already been ended.');
          if (sessionData[0].toLowerCase() !== address.toLowerCase()) {
            throw new Error(`Wallet address mismatch! Please use the same wallet that started the game.`);
          }
        } catch (readError: any) {
          if (readError.message?.includes('session') || readError.message?.includes('Session') ||
              readError.message?.includes('owner') || readError.message?.includes('paused') ||
              readError.message?.includes('mismatch') || readError.message?.includes('Wallet')) {
            throw readError;
          }
          if (!sessionExists) throw new Error('Could not verify game session. The session may not exist on the blockchain.');
        }

        await ensureWalletOnCeloChain({
          target: TARGET_CHAIN,
          switchChainAsync,
          getProvider: async () => provider,
        });

        const walletClient = createWalletClient({
          chain: celo,
          transport: custom(provider as any),
          account: address as `0x${string}`,
        });
        
        const exitFeeCurrency =
          !isMiniPay && (isWeb || isFarcaster)
            ? getCeloFeeCurrencyForPaymentToken(sessionPaymentToken ?? undefined)
            : undefined;

        const hash = await sendCeloWebTxWithStableGasFeeOrCelo({
          walletClient,
          chain: TARGET_CHAIN,
          account: address as `0x${string}`,
          to: GAME_CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: gameABI,
            functionName: 'endGameSession',
            args: [BigInt(sessionId), pointsInWei, response.signature],
          }),
          feeCurrency: exitFeeCurrency,
          gas: BigInt(200000),
          sendWithCeloGas: () =>
            walletClient.writeContract({
              account: address as `0x${string}`,
              chain: TARGET_CHAIN,
              address: GAME_CONTRACT_ADDRESS,
              abi: gameABI,
              functionName: 'endGameSession',
              args: [BigInt(sessionId), pointsInWei, response.signature],
              gas: BigInt(200000),
            }),
        });
        
        setEndGameTxHash(hash);
        setStatus(t('statusEnding'));
        return true;
      } catch (directError: any) {
        const errorText = getErrorText(directError);
        if (errorText.includes('keychain error') || errorText.includes('-25300')) {
          throw new Error('Wallet signing failed. Please close and reopen the app, then try again.');
        }
        if (errorText.includes('user rejected') || errorText.includes('rejected the request')) {
          throw new Error('Transaction was rejected by the wallet. Please try again or start a new game.');
        }
        if (directError?.message?.includes('getChainId') || directError?.message?.includes('is not a function')) {
          throw new Error('Wallet connection error. Please refresh the page and try again.');
        }
        if (errorText.includes('insufficient') || errorText.includes('balance')) {
          throw new Error('Insufficient CELO for gas or stablecoin for fees.');
        }
        if (
          errorText.includes('does not match the target chain') ||
          (errorText.includes('chain id') && errorText.includes('expected'))
        ) {
          throw new Error(
            'Switch your wallet to Celo (chain 42220) in MetaMask, then try Claim & Exit again.'
          );
        }
        if (directError?.message?.includes('session') || directError?.message?.includes('Session') ||
            directError?.message?.includes('mismatch') || directError?.message?.includes('Wallet')) {
          throw directError;
        }
        throw directError;
      }
    } catch (error: any) {
      const errorText = getErrorText(error);
      hasEndedGameRef.current = true;
      if (errorText.includes('rejected') || errorText.includes('user rejected')) {
        setStatus(t('statusTxRejectedShort'));
        setSessionError('Transaction was rejected. Try starting a new game.');
      } else if (errorText.includes('insufficient') || errorText.includes('balance')) {
        setStatus(t('statusInsufficientCeloShort'));
        setSessionError('Insufficient CELO for gas or stablecoin balance.');
      } else if (errorText.includes('session') || errorText.includes('mismatch')) {
        setStatus(t('statusSessionError'));
        setSessionError(error.message);
      } else {
        setStatus(t('statusError'));
        setSessionError(error.message || 'Unknown error');
      }
      if (allowExitOnReject) return false;
      throw error;
    }
  }, [sessionId, address, walletData, config, activeConnector, switchChainAsync, isMiniPay, isWeb, isFarcaster, skipTx, sessionPaymentToken, navigateHome, t]);

  const handleExitAttempt = async () => {
    const hasPosition = walletData.direction !== null;
    if (hasPosition) {
      setShowExitWarning(true);
      setTimeout(() => setShowExitWarning(false), 3000);
      return;
    }
    setIsClaiming(true);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    if (sessionId && !hasEndedGameRef.current) {
      try {
        const result = await handleEndGameSession(true);
        if (result === true) {
          setTimeout(() => { setIsClaiming(false); navigateHome(!skipTx); }, 500);
        } else {
          setIsClaiming(false);
          navigateHome(false);
        }
      } catch (error: any) {
        setIsClaiming(false);
        navigateHome(false);
      }
    } else {
      setIsClaiming(false);
      navigateHome(false);
    }
  };

  const handleGameOverClaimAndExit = async () => {
    setShowGameOverPopup(false);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    if (sessionId && !hasEndedGameRef.current && address) {
      try {
        const result = await handleEndGameSession(true);
        if (result === true) {
          setTimeout(() => navigateHome(!skipTx), 500);
        } else {
          navigateHome(false);
        }
      } catch (error) {
        navigateHome(false);
      }
    } else {
      navigateHome(false);
    }
  };

  const handleGameOverExit = () => {
    setShowGameOverPopup(false);
    hasEndedGameRef.current = true;
    navigateHome(false);
  };

  const handleLiquidatedGoHome = () => {
    setShowLiquidatedPopup(false);
    hasEndedGameRef.current = true;
    navigateHome(false);
  };

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    return `🪙${formatted}`;
  };

  const formatPercent = (value: number) => {
    const percent = value * 100;
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const canTrade = isConnected && isAuthenticatedRef.current && walletData.balance_free >= 100;
  const hasPosition = walletData.direction !== null;

  // Auth error screen
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#ebeff2] p-6">
        <div className="bg-white rounded-2xl p-8 shadow-card border border-gray-200 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-500 mb-3">{t('authFailedTitle')}</h2>
          <p className="text-gray-500 text-sm mb-6">{authError}</p>
          <button
            onClick={() => router.push('/home')}
            className="w-full py-3 bg-[#d76afd] text-white font-semibold rounded-xl shadow-button hover:bg-[#c255e8] transition-colors"
          >
            {t('returnToHome')}
          </button>
        </div>
      </div>
    );
  }

  // Server busy error screen
  if (showServerBusyError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#ebeff2] p-6">
        <div className="bg-white rounded-2xl p-8 shadow-card border border-gray-200 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-xl font-bold text-amber-600 mb-3">{t('gameBusyTitle')}</h2>
          <p className="text-gray-500 text-sm mb-4">{t('gameBusyDesc')}</p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6">
            <p className="text-emerald-600 text-sm">{t('fundsReturned')}</p>
          </div>
          <button
            onClick={() => router.push('/home')}
            className="w-full py-3 bg-[#d76afd] text-white font-semibold rounded-xl shadow-button hover:bg-[#c255e8] transition-colors"
          >
            {t('returnToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#ebeff2] p-2 sm:p-3">
      {/* Red Flash Effect */}
      {showRedFlash && (
        <div className="fixed inset-0 bg-red-500/50 z-[99999] pointer-events-none animate-pulse" />
      )}

      {/* Loading Overlay */}
      {isAuthenticating && (
        <SplashScreen
          message={status || t('connectingFallback')}
          submessage={authRetryCount > 0 ? t('splashRetrying', { current: authRetryCount, max: MAX_AUTH_RETRIES }) : undefined}
        />
      )}

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[999]" onClick={() => setShowExitWarning(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-[1000] shadow-xl border border-red-200 max-w-[90%] w-80">
            <h3 className="text-lg font-bold text-red-500 mb-3 text-center">{t('activePositionTitle')}</h3>
            <p className="text-gray-600 text-sm text-center">{t('activePositionDesc')}</p>
          </div>
        </>
      )}

      {/* Liquidated Popup */}
      {showLiquidatedPopup && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[9999]" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-8 z-[10000] shadow-xl border border-red-200 max-w-[90%] w-80 text-center">
            <div className="text-6xl mb-4">😢</div>
            <h3 className="text-2xl font-bold text-red-500 mb-3">{t('liquidatedTitle')}</h3>
            <p className="text-gray-600 text-sm mb-6">{t('liquidatedDesc')}</p>
            <button
              onClick={handleLiquidatedGoHome}
              className="w-full py-3 bg-[#d76afd] text-white font-semibold rounded-xl shadow-button hover:bg-[#c255e8] transition-colors"
            >
              {t('goHomePage')}
            </button>
          </div>
        </>
      )}

      {/* Game Over Popup */}
      {showGameOverPopup && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[9999]" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-8 z-[10000] shadow-xl border border-gray-200 max-w-[90%] w-80 text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('gameOverTitle')}</h3>
            <p className="text-gray-500 text-sm mb-2">{t('gameOverDesc')}</p>
            <p className="text-lg font-bold text-emerald-500 mb-6">
              {t('finalBalance')} {Math.floor(walletData.balance_total).toLocaleString()} TPOINTS
            </p>
            <div className="space-y-3">
              <button
                onClick={handleGameOverClaimAndExit}
                className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <ExitIcon />
                {t('claimExit')}
              </button>
              <button
                onClick={handleGameOverExit}
                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                {t('goHome')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header - Fixed height */}
      <div className="flex-shrink-0 flex items-center justify-between mb-1.5 sm:mb-2 p-2 sm:p-3 bg-white rounded-xl border border-gray-200 shadow-card">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#d76afd] flex items-center justify-center text-white font-bold text-base sm:text-lg">T</div>
          <div>
            <h1 className="text-sm sm:text-lg font-bold text-gray-800">{t('brand')}</h1>
            <p className={`text-[10px] sm:text-xs font-medium ${isConnected && isAuthenticatedRef.current ? 'text-emerald-500' : isAuthenticating ? 'text-amber-500' : 'text-red-500'}`}>
              ● {status}
              {(isEndGamePending || isEndGameConfirming) && ` ${t('statusEndingBadge')}`}
            </p>
            {sessionError && <p className="text-[9px] sm:text-[10px] text-red-500 max-w-[120px] sm:max-w-[200px] truncate">⚠️ {sessionError}</p>}
          </div>
        </div>

        <button
          onClick={handleExitAttempt}
          disabled={isClaiming}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
            isClaiming ? 'bg-gray-100 text-gray-400' :
            hasPosition ? 'bg-red-50 text-red-500 border border-red-200' :
            'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          {isClaiming ? (
            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <ExitIcon />
          )}
          {skipTx ? (
            <span className="whitespace-nowrap">{isClaiming ? t('exiting') : t('exit')}</span>
          ) : (
            <div className="flex flex-col items-start">
              <span className="whitespace-nowrap">{isClaiming ? t('claiming') : t('claimExit')}</span>
              <span className="text-[8px] sm:text-[10px] opacity-80">{Math.floor(walletData.balance_total).toLocaleString()} TPOINTS</span>
            </div>
          )}
        </button>
      </div>

      {/* Stats Grid - Fixed height */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <div className="bg-white rounded-xl p-1.5 sm:p-2 border border-gray-200 shadow-card text-center">
          <p className="text-[9px] sm:text-[10px] text-gray-500">{t('leverage')}</p>
          <p className="text-sm sm:text-lg font-bold text-[#d76afd]">20×</p>
        </div>
        <div className={`bg-white rounded-xl p-1.5 sm:p-2 border shadow-card text-center ${walletData.total_profit >= 0 ? 'border-emerald-200' : 'border-red-200'}`}>
          <p className="text-[9px] sm:text-[10px] text-gray-500">{t('totalPnL')}</p>
          <p className={`text-xs sm:text-base font-bold ${walletData.total_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatPercent(walletData.total_profit)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-1.5 sm:p-2 border border-gray-200 shadow-card text-center">
          <p className="text-[9px] sm:text-[10px] text-gray-500">{t('balance')}</p>
          <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{formatCurrency(walletData.balance_total)}</p>
        </div>
      </div>

      {/* Chart - Flexible height, takes remaining space */}
      <div className="flex-1 min-h-0 bg-white rounded-xl p-1.5 sm:p-2 border border-gray-200 shadow-card mb-1.5 sm:mb-2">
        <div ref={chartContainerRef} className="w-full h-full relative">
          {(!isChartReady || isAuthenticating) && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              {isAuthenticating ? t('authenticatingChart') : t('chartLoading')}
            </div>
          )}
        </div>
      </div>

      {/* Balance Info - Fixed height */}
      <div className="flex-shrink-0 grid grid-cols-2 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        <div className="bg-white rounded-xl p-1.5 sm:p-2 border border-gray-200 shadow-card">
          <p className="text-[9px] sm:text-[10px] text-gray-500">{t('freeBalance')}</p>
          <p className={`text-xs sm:text-base font-bold truncate ${walletData.balance_free >= 100 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatCurrency(walletData.balance_free)}
          </p>
          {walletData.balance_free < 100 && (
            <p className="text-[8px] sm:text-[9px] text-red-500">{t('min100')}</p>
          )}
        </div>
        <div className="bg-white rounded-xl p-1.5 sm:p-2 border border-gray-200 shadow-card">
          <p className="text-[9px] sm:text-[10px] text-gray-500">{t('inPosition')}</p>
          <p className="text-xs sm:text-base font-bold text-gray-800 truncate">{formatCurrency(walletData.in_position)}</p>
          {hasPosition && (
            <p className={`text-[8px] sm:text-[9px] font-semibold uppercase ${walletData.direction === 'long' ? 'text-emerald-500' : 'text-red-500'}`}>
              {walletData.direction}
            </p>
          )}
        </div>
      </div>

      {/* Trading Buttons - Fixed height */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-1.5 sm:gap-2">
        <button
          onClick={handleLong}
          disabled={!canTrade}
          className={`py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wide transition-all ${
            canTrade ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 active:scale-95' : 'bg-gray-200 text-gray-400'
          }`}
        >
          {t('long')}
        </button>
        <button
          onClick={handleShort}
          disabled={!canTrade}
          className={`py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wide transition-all ${
            canTrade ? 'bg-red-500 text-white shadow-lg hover:bg-red-600 active:scale-95' : 'bg-gray-200 text-gray-400'
          }`}
        >
          {t('short')}
        </button>
        <button
          onClick={handleClose}
          disabled={!isConnected || !hasPosition || !isAuthenticatedRef.current}
          className={`py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wide transition-all ${
            (isConnected && hasPosition && isAuthenticatedRef.current) ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:scale-95' : 'bg-gray-200 text-gray-400'
          }`}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
