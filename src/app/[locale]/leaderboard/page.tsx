"use client";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { useMiniApp } from "@/contexts/miniapp-context";
import { getAuthFetch } from "@/lib/auth-fetch";

const MONTHLY_PRIZES = [
  { rank: 1, prize: '$100', color: 'text-amber-600' },
  { rank: 2, prize: '$50', color: 'text-gray-600' },
  { rank: 3, prize: '$30', color: 'text-orange-500' },
];

const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const TrophyIconSmall = ({ active }: { active?: boolean }) => (
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

type LeaderboardType = 'daily' | 'weekly' | 'overall' | 'monthly';

interface LeaderboardEntry {
  username: string;
  daily_profit?: number;
  weekly_profit?: number;
  total_profit?: number;
  monthly_profit?: number;
  the_user: boolean;
  rank: number;
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const tNav = useTranslations("nav");
  const tc = useTranslations("common");
  const router = useRouter();
  const { isMiniPay, isWeb } = useMiniApp();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeaderboardType>('overall');
  
  // Wallet state
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  
  // Auto-connect wallet for MiniPay
  useEffect(() => {
    if (!isMiniPay || isConnected || isConnecting) return;
    
    const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'metaMask');
    if (injectedConnector) {
      console.log("🟡 Auto-connecting to MiniPay wallet on leaderboard...");
      connect({ connector: injectedConnector });
    }
  }, [isMiniPay, isConnected, isConnecting, connectors, connect]);

  // Redirect web users if not connected
  useEffect(() => {
    if (isWeb && !isConnected && !isConnecting) {
      console.log("🌐 Web user not connected on leaderboard - redirecting to landing");
      setTimeout(() => {
        if (!isConnected) {
          router.push('/');
        }
      }, 1000);
    }
  }, [isWeb, isConnected, isConnecting, router]);
  
  // Helper function to make authenticated API calls (works for Farcaster, MiniPay, and Web)
  const authFetch = useCallback(
    (url: string, options: RequestInit = {}) => {
      return getAuthFetch(address, isMiniPay, isWeb)(url, options);
    },
    [address, isMiniPay, isWeb]
  );

  useEffect(() => {
    if ((isMiniPay || isWeb) && !address) {
      return;
    }
    fetchLeaderboard(activeTab);
  }, [activeTab, isMiniPay, isWeb, address]);

  const getEndpoint = (type: LeaderboardType) => {
    switch (type) {
      case 'daily':
        return '/api/daily_leaderboard';
      case 'weekly':
        return '/api/weekly_leaderboard';
      case 'monthly':
        return '/api/monthly_leaderboard';
      case 'overall':
      default:
        return '/api/leaderboard';
    }
  };

  const fetchLeaderboard = async (type: LeaderboardType) => {
    try {
      setLoading(true);

      console.log(`🟢 Fetching ${type} leaderboard from backend...`);
      
      const response = await authFetch(getEndpoint(type), {
        method: 'GET',
      });

      if (!response) {
        throw new Error('No response received');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      console.log('✅ Leaderboard data received:', data);
      
      // Safely access leaderboard data
      const leaderboardData = data?.leaderboard || [];
      setLeaderboard(leaderboardData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err?.message || t("fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: LeaderboardType) => {
    setActiveTab(tab);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-amber-400 to-yellow-500";
    if (rank === 2) return "bg-gradient-to-br from-gray-300 to-gray-400";
    if (rank === 3) return "bg-gradient-to-br from-orange-400 to-orange-500";
    return "bg-gray-200";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const formatProfit = (profit: number) => {
    return Math.round(profit).toString();
  };

  const getProfit = (entry: LeaderboardEntry): number => {
    switch (activeTab) {
      case 'daily':
        return entry.daily_profit ?? 0;
      case 'weekly':
        return entry.weekly_profit ?? 0;
      case 'monthly':
        return entry.monthly_profit ?? entry.total_profit ?? 0;
      case 'overall':
      default:
        return entry.total_profit ?? 0;
    }
  };

  const getProfitLabel = () => {
    switch (activeTab) {
      case 'daily':
        return t("dailyProfit");
      case 'weekly':
        return t("weeklyProfit");
      case 'monthly':
        return t("monthlyProfit");
      case 'overall':
      default:
        return t("totalProfit");
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'daily':
        return t("titleDaily");
      case 'weekly':
        return t("titleWeekly");
      case 'monthly':
        return t("titleMonthly");
      case 'overall':
      default:
        return t("title");
    }
  };

  const currentLeaderboard = leaderboard;
  const topTen = currentLeaderboard.filter(entry => !entry.the_user || entry.rank <= 10);
  const userEntry = currentLeaderboard.find(entry => entry.the_user);

  return (
    <main className="flex flex-col h-screen bg-[#ebeff2] relative overflow-hidden">
      {/* Background Candlestick Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ascending candles - Top Left */}
        <svg className="absolute top-16 left-4 opacity-35" width="70" height="130" viewBox="0 0 70 130">
          <line x1="15" y1="70" x2="15" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="85" width="12" height="20" rx="2" fill="#bdecf6"/>
          <line x1="15" y1="105" x2="15" y2="115" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="35" y1="50" x2="35" y2="65" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="29" y="65" width="12" height="30" rx="2" fill="#bdecf6"/>
          <line x1="35" y1="95" x2="35" y2="110" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="55" y1="25" x2="55" y2="40" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="49" y="40" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="55" y1="80" x2="55" y2="100" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Single tall candle - Top Right */}
        <svg className="absolute top-24 right-6 opacity-40" width="40" height="100" viewBox="0 0 40 100">
          <line x1="20" y1="5" x2="20" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="13" y="20" width="14" height="50" rx="2" fill="#bdecf6"/>
          <line x1="20" y1="70" x2="20" y2="90" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Bearish candle - Bottom Left */}
        <svg className="absolute bottom-28 left-6 opacity-30" width="35" height="80" viewBox="0 0 35 80">
          <line x1="17" y1="5" x2="17" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="11" y="20" width="12" height="30" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
          <line x1="17" y1="50" x2="17" y2="70" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Two candles - Bottom Right */}
        <svg className="absolute bottom-32 right-4 opacity-35" width="55" height="100" viewBox="0 0 55 100">
          <line x1="15" y1="20" x2="15" y2="35" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="35" width="12" height="30" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
          <line x1="15" y1="65" x2="15" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="10" x2="40" y2="25" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="34" y="25" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="40" y1="65" x2="40" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 pt-6 px-3 md:px-6 z-10">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-wide mb-3">
              {getTitle()}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[2px] w-6 md:w-8 bg-gradient-to-r from-transparent to-[#bdecf6] rounded-full"></div>
              <div className="h-1.5 md:h-2 w-16 md:w-24 bg-gradient-to-r from-[#bdecf6] to-[#d76afd] rounded-full"></div>
              <div className="h-[2px] w-6 md:w-8 bg-gradient-to-l from-transparent to-[#bdecf6] rounded-full"></div>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleTabChange('daily')}
              className={`flex-1 min-w-[50px] sm:min-w-[70px] px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl font-semibold text-[10px] sm:text-xs md:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {t("tabDaily")}
            </button>
            <button
              onClick={() => handleTabChange('weekly')}
              className={`flex-1 min-w-[50px] sm:min-w-[70px] px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl font-semibold text-[10px] sm:text-xs md:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'weekly'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {t("tabWeekly")}
            </button>
            <button
              onClick={() => handleTabChange('overall')}
              className={`flex-1 min-w-[50px] sm:min-w-[70px] px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl font-semibold text-[10px] sm:text-xs md:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'overall'
                  ? 'bg-[#d76afd] text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {t("tabOverall")}
            </button>
            <button
              onClick={() => handleTabChange('monthly')}
              className={`flex-1 min-w-[60px] sm:min-w-[85px] px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl font-semibold text-[10px] sm:text-xs md:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'monthly'
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              {t("tabMonthly")}
            </button>
          </div>

          {/* Monthly Prizes Banner */}
          {activeTab === 'monthly' && (
            <div className="mb-5 p-4 rounded-2xl bg-white border border-gray-200 shadow-card">
              <div className="text-center mb-3">
                <span className="text-lg font-bold text-gray-800">{t("monthlyTournament")}</span>
                <p className="text-gray-500 text-xs mt-1">{t("monthlyTournamentDesc")}</p>
                <p className="text-gray-500 text-xs mt-0.5">{t("monthlyTournamentSub")}</p>
              </div>

              <div className="flex justify-center gap-3 mb-3">
                {MONTHLY_PRIZES.map((p) => (
                  <div key={p.rank} className="flex flex-col items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 min-w-[80px]">
                    <span className="text-2xl">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}</span>
                    <span className={`text-lg font-bold ${p.color} mt-1`}>{p.prize}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{p.rank === 1 ? t("rankPlace1") : p.rank === 2 ? t("rankPlace2") : t("rankPlace3")}</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-200 text-center">
                <p className="text-amber-700 text-xs font-semibold">{t("top100Extra")}</p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#bdecf6] border-t-[#d76afd]"></div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => fetchLeaderboard(activeTab)}
                className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                {tc("retry")}
              </button>
            </div>
          )}

          {/* Leaderboard table */}
          {!loading && !error && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-4 gap-4 px-6 py-4 bg-gradient-to-r from-[#d76afd] to-[#a855f7]">
                <div className="text-white font-bold text-sm uppercase tracking-wider">{t("colRank")}</div>
                <div className="text-white font-bold text-sm uppercase tracking-wider">{t("colUsername")}</div>
                <div className="text-white font-bold text-sm uppercase tracking-wider text-right">{getProfitLabel()}</div>
                <div className="text-white font-bold text-sm uppercase tracking-wider text-center">{t("colStatus")}</div>
              </div>

              {/* Mobile header */}
              <div className="md:hidden grid grid-cols-4 gap-2 px-3 py-3 bg-gradient-to-r from-[#d76afd] to-[#a855f7]">
                <div className="text-white font-bold text-[10px] uppercase">{t("colRank")}</div>
                <div className="text-white font-bold text-[10px] uppercase">{t("colUser")}</div>
                <div className="text-white font-bold text-[10px] uppercase text-right">{t("colProfit")}</div>
                <div className="text-white font-bold text-[10px] uppercase text-center"></div>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-gray-100">
                {topTen.map((entry, index) => {
                  const profit = getProfit(entry);
                  return (
                    <div
                      key={index}
                      className={`grid grid-cols-4 gap-2 md:gap-4 px-3 md:px-6 py-3 md:py-4 transition-all duration-300 ${
                        entry.the_user 
                          ? "bg-[#d76afd]/10 border-l-4 border-[#d76afd]" 
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${getRankColor(entry.rank)} flex items-center justify-center font-bold text-[10px] md:text-sm shadow text-white`}>
                          {entry.rank <= 3 ? getRankIcon(entry.rank) : `#${entry.rank}`}
                        </div>
                      </div>

                      {/* Username */}
                      <div className="flex items-center">
                        <span className={`font-medium text-[10px] md:text-sm truncate ${
                          entry.the_user ? "text-[#d76afd] font-bold" : "text-gray-700"
                        }`}>
                          {entry.username}
                        </span>
                      </div>

                      {/* Profit */}
                      <div className="flex items-center justify-end">
                        <span className={`font-semibold text-[10px] md:text-sm ${
                          profit > 0 ? "text-emerald-500" : profit < 0 ? "text-red-500" : "text-gray-500"
                        }`}>
                          🪙{formatProfit(profit)}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-center gap-1">
                        {entry.the_user && (
                          <span className="px-2 md:px-3 py-0.5 md:py-1 bg-[#d76afd] text-white text-[8px] md:text-xs font-bold rounded-full">
                            {t("you")}
                          </span>
                        )}
                        {activeTab === 'monthly' && entry.rank <= 3 && (
                          <span className="text-[10px] md:text-xs font-bold text-amber-500">
                            {entry.rank === 1 ? '$100' : entry.rank === 2 ? '$50' : '$30'}
                          </span>
                        )}
                        {activeTab === 'monthly' && entry.rank > 3 && entry.rank <= 100 && (
                          <span className="text-[8px] md:text-[10px] text-amber-500 font-medium">{t("pool")}</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* User's rank if outside top 10 */}
                {userEntry && userEntry.rank > 10 && (
                  <>
                    <div className="px-3 md:px-6 py-2 text-center">
                      <span className="text-gray-400 text-xs md:text-sm">...</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 md:gap-4 px-3 md:px-6 py-3 md:py-4 bg-[#d76afd]/10 border-l-4 border-[#d76afd]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px] md:text-sm shadow text-gray-700">
                          #{userEntry.rank}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <span className="text-[#d76afd] font-bold text-[10px] md:text-sm truncate">
                          {userEntry.username}
                        </span>
                      </div>

                      <div className="flex items-center justify-end">
                        <span className={`font-semibold text-[10px] md:text-sm ${
                          getProfit(userEntry) > 0 ? "text-emerald-500" : getProfit(userEntry) < 0 ? "text-red-500" : "text-gray-500"
                        }`}>
                          🪙{formatProfit(getProfit(userEntry))}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-1">
                        <span className="px-2 md:px-3 py-0.5 md:py-1 bg-[#d76afd] text-white text-[8px] md:text-xs font-bold rounded-full">
                          {t("you")}
                        </span>
                        {activeTab === 'monthly' && userEntry!.rank <= 100 && (
                          <span className="text-[8px] md:text-[10px] text-amber-500 font-medium">{t("pool")}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Empty state */}
                {topTen.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-gray-500">{t("noData")}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats summary */}
          {!loading && !error && userEntry && (
            <div className="mt-4 text-center">
              <p className="text-gray-500 text-xs md:text-sm">
                {t("yourRank")}: <span className="text-[#d76afd] font-bold">#{userEntry.rank}</span> •
                {getProfitLabel()}: <span className={`font-bold ${getProfit(userEntry) > 0 ? "text-emerald-500" : getProfit(userEntry) < 0 ? "text-red-500" : "text-gray-500"}`}>
                  🪙{formatProfit(getProfit(userEntry))}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 shadow-soft">
        <div className="flex justify-around items-center py-4 px-4 pb-safe">
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <HomeIcon />
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">{tNav("home")}</span>
          </button>

          <button className="flex flex-col items-center gap-1 group relative">
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <TrophyIconSmall active={true} />
            </div>
            <span className="text-[10px] font-semibold text-[#d76afd]">{tNav("leaderboard")}</span>
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#d76afd] rounded-full"></div>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <UserIcon />
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">{tNav("profile")}</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
