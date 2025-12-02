// src/app/profile/page.tsx
"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useConnectors } from "wagmi";

const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" : "text-slate-500"}`}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const TrophyIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" : "text-slate-500"}`}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const UserIconSmall = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" : "text-slate-500"}`}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const StatsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A78BFA]">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const AchievementIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A78BFA]">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A78BFA]">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A78BFA] drop-shadow-[0_0_12px_rgba(167,139,250,0.6)]">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

interface ProfileData {
  fid: number;
  name: string;
  stats: {
    total_games: number;
    liquidation_times: number;
  };
  achivements: {
    "highest pnl": number;
  };
  history: Array<{
    trade_time: string;
    initial_balance: number;
    final_balance: number;
    pnl: number;
  }>;
}

export default function ProfilePage() {
  const { context, isMiniAppReady } = useMiniApp();
  const router = useRouter();

  // Farcaster SDK state
  const [fcReady, setFcReady] = useState(false);
  const [fcContext, setFcContext] = useState<any>(null);

  // Wallet state
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();

  // Profile data from backend
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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

  /* ------------------- Fetch Profile from Backend ------------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!fcReady || !isMiniAppReady) return;

      setIsLoadingProfile(true);
      try {
        const { sdk } = await import("@farcaster/frame-sdk");
        console.log('🟢 Fetching profile from backend...');

        const res = await sdk.quickAuth.fetch('/api/profile', {
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
  }, [fcReady, isMiniAppReady]);

  // Get user info - prioritize fcContext over context
  const user = fcContext?.user || context?.user;

  const walletAddress =
    address ||
    user?.verified_addresses?.eth_addresses?.[0] ||
    user?.custody ||
    "0x0000...0000";

  const displayName = profileData?.name || user?.displayName || user?.username || "User";
  const username = user?.username || "user";
  const pfpUrl = user?.pfpUrl;

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  /* ------------------- Loading Screen ------------------- */
  if (!fcReady || !isMiniAppReady || isLoadingProfile) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A]">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[#8B5CF6]/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#A78BFA] animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#A78BFA]/20 to-[#8B5CF6]/20 backdrop-blur-xl"></div>
            </div>
            <p className="text-slate-300">Loading Profile...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] relative overflow-hidden">

      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#8B5CF6] opacity-12 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#A78BFA] opacity-10 blur-[70px] rounded-full pointer-events-none"></div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="flex-1 flex flex-col items-center justify-start p-6 z-10 pb-28 pt-8">

        {/* Profile Picture */}
        <div className="relative mb-6 group">
          {pfpUrl ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#A78BFA]/60 shadow-[0_0_32px_rgba(167,139,250,0.5)] group-hover:scale-105 transition-transform duration-500">
              <img src={pfpUrl} alt="Profile" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#8B5CF6]/20 to-transparent"></div>
            </div>
          ) : (
            <div className="relative w-32 h-32 bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-3xl border-2 border-slate-700/60 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_24px_rgba(139,92,246,0.15)] backdrop-blur-xl group-hover:scale-[1.03] transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-t from-[#8B5CF6]/8 to-transparent rounded-3xl"></div>
              <div className="relative z-10 animate-float">
                <UserIcon />
              </div>
            </div>
          )}
        </div>

        {/* Username */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#A78BFA] to-white mb-2">
            @{username}
          </h1>
          {displayName !== username && (
            <p className="text-slate-400 text-lg">{displayName}</p>
          )}
        </div>

        {/* Wallet Address */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl px-5 py-3 rounded-xl border border-slate-700/50 mb-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <p className="text-sm text-slate-300 font-mono">
            {formatAddress(walletAddress)}
          </p>
        </div>

        {/* Wallet Connection Status */}
        {isConnected && (
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full backdrop-blur-xl">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
              <span className="text-xs text-green-400 font-semibold">Wallet Connected</span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center justify-center gap-2 mb-8 w-full max-w-md">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-[#8B5CF6] rounded-full"></div>
          <div className="h-2 w-24 bg-gradient-to-r from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.4)]"></div>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-[#8B5CF6] rounded-full"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-6 px-4">

          {/* Stats Card */}
          <div className="group relative p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border-2 border-slate-700/60 backdrop-blur-xl hover:border-[#8B5CF6]/50 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.2)]">
            <div className="flex flex-col items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <StatsIcon />
              </div>
              <span className="text-sm font-bold text-slate-300">Stats</span>
            </div>
            <div className="text-center space-y-2">
              <div className="flex justify-between items-center px-2">
                <span className="text-xs text-slate-400">Total Games:</span>
                <span className="text-sm font-bold text-[#A78BFA]">
                  {profileData?.stats?.total_games ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-xs text-slate-400">Liquidations:</span>
                <span className="text-sm font-bold text-red-400">
                  {profileData?.stats?.liquidation_times ?? 0}
                </span>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/0 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
          </div>

          {/* Achievements Card */}
          <div className="group relative p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border-2 border-slate-700/60 backdrop-blur-xl hover:border-[#8B5CF6]/50 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.2)]">
            <div className="flex flex-col items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <AchievementIcon />
              </div>
              <span className="text-sm font-bold text-slate-300">Achievements</span>
            </div>
            <div className="text-center space-y-2">
              <div className="flex flex-col items-center px-2">
                <span className="text-xs text-slate-400 mb-1">Highest PNL</span>
                <span className="text-lg font-bold text-emerald-400">
                  ${profileData?.achivements?.["highest pnl"] ?? 0}
                </span>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/0 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
          </div>

          {/* History Card */}
          <div className="group relative p-5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border-2 border-slate-700/60 backdrop-blur-xl hover:border-[#8B5CF6]/50 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.2)]">
            <div className="flex flex-col items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <HistoryIcon />
              </div>
              <span className="text-sm font-bold text-slate-300">History</span>
            </div>
            <div className="text-center">
              <span className="text-xs text-slate-400">
                {profileData?.history?.length ?? 0} trades
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/0 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
          </div>

        </div>

        {/* Trade History */}
        {profileData && (
          <div className="w-full max-w-2xl px-4 mb-6">

            {profileData.history && Array.isArray(profileData.history) && profileData.history.length > 0 ? (
              <div className="space-y-3">
                {profileData.history.map((trade, idx) => {
                  const profitLoss = trade.final_balance - trade.initial_balance;
                  const isProfit = profitLoss >= 0;

                  return (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border-2 border-slate-700/50 p-4 backdrop-blur-xl hover:border-[#8B5CF6]/40 transition-all duration-300"
                    >
                      {/* Header: Time and PNL Badge */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-slate-400 font-mono">{trade.trade_time}</span>
                        <div className={`px-3 py-1 rounded-full ${isProfit ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
                          <span className={`text-sm font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}{trade.pnl}%
                          </span>
                        </div>
                      </div>

                      {/* Balance Flow */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Initial</span>
                          <span className="text-base font-bold text-slate-200">${trade.initial_balance.toLocaleString()}</span>
                        </div>

                        <div className="flex-1 mx-3 flex items-center">
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full"></div>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mx-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                          <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full"></div>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Final</span>
                          <span className="text-base font-bold text-slate-200">${trade.final_balance.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Profit/Loss Amount */}
                      <div className="flex justify-center pt-2 border-t border-slate-700/50">
                        <span className="text-xs text-slate-400">
                          {isProfit ? 'Profit' : 'Loss'}:
                          <span className={`ml-1 font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${Math.abs(profitLoss).toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/30 p-8 backdrop-blur-xl text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
                  <HistoryIcon />
                </div>
                <p className="text-slate-400 text-sm">No trades yet</p>
                <p className="text-slate-500 text-xs mt-1">Start playing to build your history!</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#0F172A] via-[#0F172A]/95 to-transparent backdrop-blur-2xl border-t-2 border-slate-800/60 pb-safe z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center py-5 px-4">

          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center gap-1.5 group relative"
          >
            <div className="absolute -inset-2 bg-[#8B5CF6]/15 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <HomeIcon />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors duration-200 tracking-wide relative">Home</span>
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

          <button className="flex flex-col items-center gap-1.5 group relative">
            <div className="absolute -inset-2 bg-[#8B5CF6]/15 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <UserIconSmall active={true} />
            </div>
            <span className="text-[11px] font-bold text-[#A78BFA] tracking-wide relative">Profile</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#A78BFA] rounded-full shadow-[0_0_6px_rgba(167,139,250,0.8)]"></div>
          </button>

        </div>
      </nav>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

    </main>
  );
}
