"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createChart, CandlestickSeries, IChartApi, ISeriesApi } from 'lightweight-charts';

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
  time: number;
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
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialDataLoaded = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Connecting...');
  const [isChartReady, setIsChartReady] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
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
    // If timestamp has more than 10 digits → milliseconds
    return num > 9999999999 ? Math.floor(num / 1000) : num;
  }

  // Try parsing as date string
  const date = new Date(ts);
  if (!isNaN(date.getTime())) {
    return Math.floor(date.getTime() / 1000);
  }

  return NaN;
};

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      console.log('Attempting WebSocket connection...');
      const ws = new WebSocket(process.env.TRADE_WS_URL!);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setStatus('Connected');
        isInitialDataLoaded.current = false;
        setTimeout(() => {
             if (ws.readyState === WebSocket.OPEN) ws.send('start');
        }, 100);
      };

      ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (!data) return;

    // Helper to format any kline (from window or stream)
    const formatKline = (item: any): KlineData | null => {
      const timestamp = item.timestamp || item.open_time || item.time || item.t || item[0];
      const open = parseFloat(item.open || item[1]);
      const high = parseFloat(item.high || item[2]);
      const low = parseFloat(item.low || item[3]);
      const close = parseFloat(item.close || item[4]);

      const time = parseTimestamp(timestamp);

      if (isNaN(time) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) return null;
      if (high < low || open <= 0 || close <= 0) return null;

      return { time, open, high, low, close };
    };

    // Case 1: Initial historical window
    if (data.type === 'prices' || (data.window && Array.isArray(data.window))) {
      const window = data.window || data.data || [];
      console.log('Received initial window:', window.length);

      const formatted = window
        .map(formatKline)
        .filter((k): k is KlineData => k !== null)
        .sort((a, b) => a.time - b.time);

      if (formatted.length > 0 && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(formatted);
        console.log('Chart initialized with', formatted.length, 'candles');
      }
    }

    // Case 2: Single kline update (live candle)
    else if (data.timestamp || data.open_time || data.time || data.open !== undefined) {
      const kline = formatKline(data);
      if (!kline || !candlestickSeriesRef.current) return;

      // This is the key: always try to update/add the candle
      const lastCandle = candlestickSeriesRef.current.data().slice(-1)[0];

      if (lastCandle && kline.time === lastCandle.time) {
        // Same candle → update it (common in real-time)
        candlestickSeriesRef.current.update(kline);
        console.log('Updated candle:', new Date(kline.time * 1000).toISOString());
      } else if (!lastCandle || kline.time > lastCandle.time) {
        // New candle → append
        candlestickSeriesRef.current.update(kline); // .update() works for new too!
        console.log('New candle:', new Date(kline.time * 1000).toISOString());
      }
      // else: older candle → ignore (shouldn't happen)
    }

    // Wallet updates (unchanged)
    else if (data.type === 'wallet' && data.wallet) {
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
    console.error('Message handling error:', err);
  }
};

      ws.onerror = (error) => {
        console.error('WebSocket error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        setIsConnected(false);
        setStatus('Disconnected');
        wsRef.current = null;
        isInitialDataLoaded.current = false;

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
        }, 3000);
      };

    } catch (error) {
      console.error('Connection error');
      setStatus('Connection Failed');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
        }, 3000);
    }
  }, []);

  useEffect(() => {
    const initChart = async () => {
      try {
        if (chartRef.current) {
          console.log('⚠️ Chart already initialized');
          return;
        }

        if (!chartContainerRef.current) {
          console.error('❌ Chart container not found');
          return;
        }

        console.log('🎨 Initializing TradingView Lightweight Chart...');

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
          watermark: {
            visible: false,
          },
        });

        chartRef.current = chart;

        // Add candlestick series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });

        candlestickSeriesRef.current = candlestickSeries;

        console.log('✅ Chart instance created');
        setIsChartReady(true);

        // Handle window resize
        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight,
            });
          }
        };

        window.addEventListener('resize', handleResize);

        // Initial resize
        setTimeout(() => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight,
            });
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
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [connectWebSocket]);

  const sendMessage = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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
    sendMessage('close');
    setStatus('Closing position...');
  };

  const handleExitAttempt = () => {
    const hasPosition = walletData.direction !== null;
    if (hasPosition) {
      setShowExitWarning(true);
      setTimeout(() => setShowExitWarning(false), 3000);
    } else {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      router.push('/home');
    }
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

  const canTrade = isConnected && walletData.balance_free >= 100;
  const hasPosition = walletData.direction !== null;

  return (
    <div style={{
    padding: '10px',
    paddingBottom: '24px',  // ← This adds space at the bottom
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

      {/* Header - More compact */}
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
              SimmerLiq
            </h1>
            <div style={{
              fontSize: '9px',
              color: isConnected ? '#10b981' : '#ef4444',
              fontWeight: '500',
              marginTop: '2px'
            }}>
              ● {status}
            </div>
          </div>
        </div>

        <button onClick={handleExitAttempt} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: hasPosition ? '#ef444420' : '#2a2a3e',
            border: hasPosition ? '1px solid #ef4444' : '1px solid #3a3a4e',
            borderRadius: '8px',
            color: hasPosition ? '#ef4444' : '#a0a0b0',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}>
          <ExitIcon />
          <span>Exit</span>
        </button>
      </div>

      {/* Stats Grid - More compact */}
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

      {/* Chart - More compact */}
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
          {!isChartReady && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#888'
            }}>
              Loading chart...
            </div>
          )}
        </div>
      </div>

      {/* Balance Info - More compact */}
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

      {/* Trading Buttons - Moved up with reduced gap */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px',
      flexShrink: 0,
      marginTop: '8px',           // ← pulls them up from the very bottom
      marginBottom: '16px',       // ← extra safe space below buttons
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

        <button onClick={handleClose} disabled={!isConnected || !hasPosition} style={{
            padding: '14px 8px',
            backgroundColor: (isConnected && hasPosition) ? '#6366f1' : '#2a2a3e',
            color: (isConnected && hasPosition) ? 'white' : '#666',
            border: 'none',
            borderRadius: '10px',
            cursor: (isConnected && hasPosition) ? 'pointer' : 'not-allowed',
            fontWeight: '700',
            fontSize: '13px',
            boxShadow: (isConnected && hasPosition) ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
          Close
        </button>
      </div>
    </div>
  );
}