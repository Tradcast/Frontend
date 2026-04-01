// src/app/profile/page.tsx
"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { getAuthFetch } from "@/lib/auth-fetch";

const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const format2 = (value?: number) =>
  typeof value === "number" ? value.toFixed(2) : "0.00";

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

const UserIconSmall = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const StatsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d76afd]">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const AchievementIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d76afd]">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#d76afd]">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

interface TradeAction {
  action: string;
  time: number;
}

interface Trade {
  trade_env_id: string;
  actions: TradeAction[];
  final_pnl: number;
  final_profit: number;
  created_at: string;
}

interface ProfileData {
  username: string;
  wallet: string;
  total_games: number;
  total_profit: number;
  total_PnL: number;
  energy: number;
  streak_days: number;
  invitation_key: string;
  invited_key: string;
  is_banned: boolean;
  latest_trades: Trade[];
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tNav = useTranslations("nav");
  const { context, isMiniAppReady, isMiniPay, isWeb } = useMiniApp();
  const router = useRouter();

  const [fcReady, setFcReady] = useState(false);
  const [fcContext, setFcContext] = useState<any>(null);

  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [copied, setCopied] = useState(false);

  // Environment is now detected via useMiniApp hook (isMiniPay, isWeb)
  useEffect(() => {
    if (isMiniPay) {
      console.log('🟡 MiniPay environment detected on profile page');
      setFcReady(true);
    } else if (isWeb) {
      console.log('🌐 Web environment detected on profile page');
      setFcReady(true);
    }
  }, [isMiniPay, isWeb]);

  useEffect(() => {
    // Skip Farcaster SDK init for MiniPay and Web
    if (fcReady || isMiniPay || isWeb) return;

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
        setFcReady(true);
      }
    };

    initFarcaster();
  }, [fcReady, isMiniPay, isWeb]);

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

    // Web users - redirect to landing if not connected
    if (isWeb && !isConnected && !isConnecting) {
      console.log("🌐 Web user not connected on profile - redirecting to landing");
      setTimeout(() => {
        if (!isConnected) {
          router.push('/');
        }
      }, 1000);
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

  // Helper function to make authenticated API calls
  const authFetch = useCallback(
    (url: string, options: RequestInit = {}) => {
      return getAuthFetch(address, isMiniPay, isWeb)(url, options);
    },
    [address, isMiniPay, isWeb]
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!fcReady || !isMiniAppReady) return;
      // For MiniPay and Web, need wallet address
      if ((isMiniPay || isWeb) && !address) return;

      setIsLoadingProfile(true);
      try {
        console.log('🟢 Fetching profile from backend...');
        const res = await authFetch('/api/profile', {
          method: 'GET',
        });

        if (res.ok) {
          const data = await res.json();
          console.log('✅ Profile data received:', data);
          setProfileData(data);
        } else {
          console.error('❌ Failed to fetch profile:', res.status);
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [fcReady, isMiniAppReady, isMiniPay, isWeb, address, authFetch]);

  const user = fcContext?.user || context?.user;

  const walletAddress =
    address ||
    user?.verified_addresses?.eth_addresses?.[0] ||
    user?.custody ||
    "0x0000...0000";

  const displayName = profileData?.username || user?.displayName || user?.username || "User";
  const username = user?.username || "user";
  const pfpUrl = user?.pfpUrl;

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!fcReady || !isMiniAppReady || isLoadingProfile) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-[#ebeff2] relative overflow-hidden">
          {/* Background candles for loading */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="absolute top-24 left-8 opacity-25" width="45" height="90" viewBox="0 0 45 90">
              <line x1="15" y1="10" x2="15" y2="25" stroke="#bdecf6" strokeWidth="2"/>
              <rect x="9" y="25" width="12" height="30" rx="2" fill="#bdecf6"/>
              <line x1="15" y1="55" x2="15" y2="75" stroke="#bdecf6" strokeWidth="2"/>
            </svg>
            <svg className="absolute top-32 right-10 opacity-30" width="50" height="95" viewBox="0 0 50 95">
              <line x1="25" y1="5" x2="25" y2="20" stroke="#bdecf6" strokeWidth="2"/>
              <rect x="19" y="20" width="12" height="40" rx="2" fill="#bdecf6"/>
              <line x1="25" y1="60" x2="25" y2="80" stroke="#bdecf6" strokeWidth="2"/>
            </svg>
            <svg className="absolute bottom-32 left-6 opacity-20" width="40" height="80" viewBox="0 0 40 80">
              <line x1="20" y1="5" x2="20" y2="18" stroke="#bdecf6" strokeWidth="2"/>
              <rect x="14" y="18" width="12" height="35" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
              <line x1="20" y1="53" x2="20" y2="70" stroke="#bdecf6" strokeWidth="2"/>
            </svg>
            <svg className="absolute bottom-28 right-8 opacity-25" width="35" height="70" viewBox="0 0 35 70">
              <line x1="17" y1="5" x2="17" y2="15" stroke="#bdecf6" strokeWidth="2"/>
              <rect x="11" y="15" width="12" height="30" rx="2" fill="#bdecf6"/>
              <line x1="17" y1="45" x2="17" y2="60" stroke="#bdecf6" strokeWidth="2"/>
            </svg>
          </div>
          <div className="w-full max-w-md mx-auto p-8 text-center relative z-10">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[#bdecf6]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#d76afd] animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-[#f7f8fa]"></div>
            </div>
            <p className="text-gray-600 font-medium">{t("loading")}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#ebeff2] relative overflow-hidden">
      {/* Background Candlestick Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Candle Group - Top Left */}
        <svg className="absolute top-20 left-6 opacity-30" width="55" height="120" viewBox="0 0 55 120">
          <line x1="15" y1="10" x2="15" y2="30" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="30" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="15" y1="70" x2="15" y2="90" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="25" x2="40" y2="40" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="34" y="40" width="12" height="30" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
          <line x1="40" y1="70" x2="40" y2="95" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Candle Group - Top Right */}
        <svg className="absolute top-28 right-4 opacity-25" width="50" height="100" viewBox="0 0 50 100">
          <line x1="25" y1="5" x2="25" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="19" y="20" width="12" height="45" rx="2" fill="#bdecf6"/>
          <line x1="25" y1="65" x2="25" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Candle Group - Bottom Left */}
        <svg className="absolute bottom-36 left-3 opacity-20" width="40" height="90" viewBox="0 0 40 90">
          <line x1="20" y1="5" x2="20" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="14" y="20" width="12" height="35" rx="2" fill="#bdecf6"/>
          <line x1="20" y1="55" x2="20" y2="80" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Candle Group - Bottom Right */}
        <svg className="absolute bottom-40 right-8 opacity-30" width="60" height="110" viewBox="0 0 60 110">
          <line x1="15" y1="30" x2="15" y2="45" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="45" width="12" height="25" rx="2" fill="#bdecf6"/>
          <line x1="15" y1="70" x2="15" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="15" x2="40" y2="30" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="34" y="30" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="40" y1="70" x2="40" y2="95" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-6 z-10 pb-28 pt-8">
        {/* Profile Picture */}
        <div className="relative mb-6 group">
          {pfpUrl ? (
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-[#bdecf6] shadow-card group-hover:scale-105 transition-transform duration-500">
              <img src={pfpUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="relative w-28 h-28 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center shadow-card group-hover:scale-[1.03] transition-transform duration-500">
              <div className="relative z-10">
                <UserIcon />
              </div>
            </div>
          )}
        </div>

        {/* Username */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {displayName}
          </h1>
        </div>

        {/* Wallet Address */}
        <div className="bg-white px-5 py-3 rounded-xl border border-gray-200 mb-4 shadow-card">
          <p className="text-sm text-gray-600 font-mono">
            {formatAddress(walletAddress)}
          </p>
        </div>

        {/* Wallet Connection Status */}
        {isConnected && (
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-emerald-600 font-semibold">{t("walletConnected")}</span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center justify-center gap-2 mb-8 w-full max-w-md">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-[#bdecf6] rounded-full"></div>
          <div className="h-2 w-24 bg-gradient-to-r from-[#bdecf6] to-[#d76afd] rounded-full"></div>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-[#bdecf6] rounded-full"></div>
        </div>

        {/* Stats Grid - Row 1 */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mb-4 px-4">
          {/* Total Games Card */}
          <div className="group relative p-4 bg-white rounded-2xl border border-gray-200 shadow-card hover:shadow-soft transition-all duration-300">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#d76afd]/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <StatsIcon />
              </div>
              <span className="text-xs font-bold text-gray-500">{t("totalGames")}</span>
              <span className="text-2xl font-bold text-[#d76afd]">
                {profileData?.total_games ?? 0}
              </span>
            </div>
          </div>

          {/* Streak Days Card */}
          <div className="group relative p-4 bg-white rounded-2xl border border-orange-200 shadow-card hover:shadow-soft transition-all duration-300">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-500">{t("streakDays")}</span>
              <span className="text-2xl font-bold text-orange-500">
                {profileData?.streak_days ?? 0} 🔥
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Row 2 */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mb-4 px-4">
          {/* Total Profit Card */}
          <div className="group relative p-4 bg-white rounded-2xl border border-emerald-200 shadow-card hover:shadow-soft transition-all duration-300">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <AchievementIcon />
              </div>
              <span className="text-xs font-bold text-gray-500">{t("totalProfit")}</span>
              <span className={`text-lg font-semibold ${(profileData?.total_profit ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {(profileData?.total_profit ?? 0) >= 0 ? '+' : ''}{format2(profileData?.total_profit)}
              </span>
            </div>
          </div>

          {/* Total PnL Card */}
          <div className="group relative p-4 bg-white rounded-2xl border border-gray-200 shadow-card hover:shadow-soft transition-all duration-300">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-[#d76afd]/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d76afd]">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-500">{t("totalPnL")}</span>
              <span className={`text-lg font-semibold ${(profileData?.total_PnL ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {(profileData?.total_PnL ?? 0) >= 0 ? '+' : ''}{format2(profileData?.total_PnL)}%
              </span>
            </div>
          </div>
        </div>

        {/* Invitation Key Card */}
        <div className="w-full max-w-2xl mb-6 px-4">
          <div className="group relative p-4 bg-gradient-to-r from-[#d76afd]/10 to-[#bdecf6]/20 rounded-2xl border border-[#d76afd]/30 shadow-card hover:shadow-soft transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#d76afd]/20 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d76afd]">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">{t("invitationKeyLabel")}</span>
                  <span className="text-lg font-bold text-[#d76afd] font-mono tracking-wider">
                    {profileData?.invitation_key || '------'}
                  </span>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!profileData?.invitation_key) return;
                  const text = profileData.invitation_key;
                  let success = false;
                  try {
                    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                      await navigator.clipboard.writeText(text);
                      success = true;
                    }
                  } catch {
                    // clipboard API failed, try fallback
                  }
                  if (!success) {
                    try {
                      const textArea = document.createElement('textarea');
                      textArea.value = text;
                      textArea.setAttribute('readonly', '');
                      textArea.style.position = 'fixed';
                      textArea.style.left = '-9999px';
                      textArea.style.top = '-9999px';
                      textArea.style.opacity = '0';
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      textArea.setSelectionRange(0, text.length);
                      success = document.execCommand('copy');
                      document.body.removeChild(textArea);
                    } catch {
                      // fallback also failed
                    }
                  }
                  if (success) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className={`p-2 rounded-lg transition-all duration-200 border ${copied ? 'bg-emerald-50 border-emerald-300' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                title={t("copyKeyTitle")}
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d76afd]">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Support via Telegram */}
        <div className="w-full max-w-2xl mb-6 px-4">
          <a
            href="https://t.me/TradcastBot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-card hover:shadow-soft hover:border-[#229ED9]/40 transition-all duration-300 group"
          >
            <div className="w-10 h-10 bg-[#229ED9]/10 rounded-xl flex items-center justify-center text-[#229ED9] group-hover:scale-105 transition-transform duration-300">
              <TelegramIcon />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-800">{t("supportTitle")}</span>
              <p className="text-xs text-gray-400">{t("supportSubtitle")}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-[#229ED9] transition-colors duration-200">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>

        {/* Latest Trades Section */}
        <div className="w-full max-w-2xl px-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <HistoryIcon />
            <h2 className="text-lg font-bold text-gray-800">{t("latestTrades")}</h2>
            <span className="text-xs text-gray-500">({profileData?.latest_trades?.length ?? 0})</span>
          </div>

          {profileData?.latest_trades && Array.isArray(profileData.latest_trades) && profileData.latest_trades.length > 0 ? (
            <div className="space-y-3">
              {profileData.latest_trades.map((trade, idx) => {
                const isProfit = trade.final_pnl >= 0;
                const tradeDate = new Date(trade.created_at);
                const formattedDate = tradeDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-card hover:shadow-soft transition-all duration-300"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#d76afd] font-mono">{trade.trade_env_id}</span>
                        <span className="text-[10px] text-gray-400">{formattedDate}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full ${isProfit ? 'bg-emerald-100 border border-emerald-200' : 'bg-red-100 border border-red-200'}`}>
                        <span className={`text-sm font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isProfit ? '+' : ''}{trade.final_pnl.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{t("profit")}</span>
                        <span className={`text-sm font-bold ${trade.final_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {trade.final_profit >= 0 ? '+' : ''}{trade.final_profit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{t("pnl")}</span>
                        <span className={`text-sm font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isProfit ? '+' : ''}{trade.final_pnl.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-card text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <HistoryIcon />
              </div>
              <p className="text-gray-600 text-sm">{t("noTrades")}</p>
              <p className="text-gray-400 text-xs mt-1">{t("noTradesHint")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50 shadow-soft">
        <div className="flex justify-around items-center py-4 px-4">
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <HomeIcon />
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">{tNav("home")}</span>
          </button>

          <button
            onClick={() => router.push('/leaderboard')}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <TrophyIcon />
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">{tNav("leaderboard")}</span>
          </button>

          <button className="flex flex-col items-center gap-1 group relative">
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <UserIconSmall active={true} />
            </div>
            <span className="text-xs font-semibold text-[#d76afd]">{tNav("profile")}</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#d76afd] rounded-full"></div>
          </button>
        </div>
      </nav>
    </main>
  );
}
