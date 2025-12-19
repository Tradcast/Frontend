"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" : "text-slate-500"}`}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const TrophyIconSmall = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" : "text-slate-500"}`}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const UserIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" : "text-slate-500"}`}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

interface LeaderboardEntry {
  username: string;
  total_profit: number;
  the_user: boolean;
  rank: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Use Farcaster SDK quickAuth like in profile page
      const { sdk } = await import("@farcaster/frame-sdk");
      console.log('🟢 Fetching leaderboard from backend...');

      const response = await sdk.quickAuth.fetch('/api/leaderboard', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      console.log('✅ Leaderboard data received:', data);
      setLeaderboard(data.leaderboard || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-amber-400 to-yellow-500";
    if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-400";
    if (rank === 3) return "bg-gradient-to-br from-orange-500 to-orange-600";
    return "bg-slate-600";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const formatProfit = (profit: number) => {
    return profit.toFixed(2);
  };

  const topTen = leaderboard.filter(entry => !entry.the_user || entry.rank <= 10);
  const userEntry = leaderboard.find(entry => entry.the_user);

  return (
    <main className="flex flex-col h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#8B5CF6] opacity-10 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#A78BFA] opacity-8 blur-[70px] rounded-full pointer-events-none"></div>

      <div className="flex-1 overflow-y-auto pb-24 pt-6 px-3 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white tracking-wide mb-3">
              LEADERBOARD
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[2px] w-6 md:w-8 bg-gradient-to-r from-transparent to-[#8B5CF6] rounded-full"></div>
              <div className="h-1.5 md:h-2 w-16 md:w-24 bg-gradient-to-r from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.4)]"></div>
              <div className="h-[2px] w-6 md:w-8 bg-gradient-to-l from-transparent to-[#8B5CF6] rounded-full"></div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-center">
              <p className="text-red-300">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Leaderboard table */}
          {!loading && !error && (
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl md:rounded-3xl border-2 border-slate-700/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-4 gap-4 px-6 py-4 bg-gradient-to-r from-[#5B21B6] to-[#6D28D9]">
                <div className="text-white font-bold text-sm uppercase tracking-wider">Rank</div>
                <div className="text-white font-bold text-sm uppercase tracking-wider">Username</div>
                <div className="text-white font-bold text-sm uppercase tracking-wider text-right">Total Profit</div>
                <div className="text-white font-bold text-sm uppercase tracking-wider text-center">Status</div>
              </div>

              {/* Mobile header */}
              <div className="md:hidden grid grid-cols-4 gap-2 px-3 py-3 bg-gradient-to-r from-[#5B21B6] to-[#6D28D9]">
                <div className="text-white font-bold text-[10px] uppercase">Rank</div>
                <div className="text-white font-bold text-[10px] uppercase">User</div>
                <div className="text-white font-bold text-[10px] uppercase text-right">Profit</div>
                <div className="text-white font-bold text-[10px] uppercase text-center"></div>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-slate-700/40">
                {topTen.map((entry, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-4 gap-2 md:gap-4 px-3 md:px-6 py-3 md:py-4 transition-all duration-300 ${
                      entry.the_user 
                        ? "bg-[#8B5CF6]/20 border-l-4 border-[#8B5CF6]" 
                        : "hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${getRankColor(entry.rank)} flex items-center justify-center font-bold text-[10px] md:text-sm shadow-lg text-white`}>
                        {entry.rank <= 3 ? getRankIcon(entry.rank) : `#${entry.rank}`}
                      </div>
                    </div>

                    {/* Username */}
                    <div className="flex items-center">
                      <span className={`font-medium text-[10px] md:text-sm truncate ${
                        entry.the_user ? "text-[#A78BFA] font-bold" : "text-slate-200"
                      }`}>
                        {entry.username}
                      </span>
                    </div>

                    {/* Total Profit */}
                    <div className="flex items-center justify-end">
                      <span className={`font-semibold text-[10px] md:text-sm ${
                        entry.total_profit > 0 ? "text-green-400" : "text-slate-300"
                      }`}>
                        ${formatProfit(entry.total_profit)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center">
                      {entry.the_user && (
                        <span className="px-2 md:px-3 py-0.5 md:py-1 bg-[#8B5CF6] text-white text-[8px] md:text-xs font-bold rounded-full">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* User's rank if outside top 10 */}
                {userEntry && userEntry.rank > 10 && (
                  <>
                    <div className="px-3 md:px-6 py-2 text-center">
                      <span className="text-slate-500 text-xs md:text-sm">...</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 md:gap-4 px-3 md:px-6 py-3 md:py-4 bg-[#8B5CF6]/20 border-l-4 border-[#8B5CF6]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-[10px] md:text-sm shadow-lg text-white">
                          #{userEntry.rank}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <span className="text-[#A78BFA] font-bold text-[10px] md:text-sm truncate">
                          {userEntry.username}
                        </span>
                      </div>

                      <div className="flex items-center justify-end">
                        <span className={`font-semibold text-[10px] md:text-sm ${
                          userEntry.total_profit > 0 ? "text-green-400" : "text-slate-300"
                        }`}>
                          ${formatProfit(userEntry.total_profit)}
                        </span>
                      </div>

                      <div className="flex items-center justify-center">
                        <span className="px-2 md:px-3 py-0.5 md:py-1 bg-[#8B5CF6] text-white text-[8px] md:text-xs font-bold rounded-full">
                          YOU
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stats summary */}
          {!loading && !error && userEntry && (
            <div className="mt-4 text-center">
              <p className="text-slate-400 text-xs md:text-sm">
                Your Rank: <span className="text-[#A78BFA] font-bold">#{userEntry.rank}</span> •
                Total Profit: <span className={`font-bold ${userEntry.total_profit > 0 ? "text-green-400" : "text-slate-300"}`}>
                  ${formatProfit(userEntry.total_profit)}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#0F172A] via-[#0F172A]/95 to-transparent backdrop-blur-2xl border-t-2 border-slate-800/60 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center py-4 px-4 pb-safe">
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="absolute -inset-2 bg-[#8B5CF6]/15 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <HomeIcon />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors duration-200 tracking-wide relative">Home</span>
          </button>

          <button className="flex flex-col items-center gap-1 group relative">
            <div className="absolute -inset-2 bg-[#8B5CF6]/15 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <TrophyIconSmall active={true} />
            </div>
            <span className="text-[10px] font-bold text-[#A78BFA] tracking-wide relative">Leaderboard</span>
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#A78BFA] rounded-full shadow-[0_0_6px_rgba(167,139,250,0.8)]"></div>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="absolute -inset-2 bg-[#8B5CF6]/15 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <UserIcon />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors duration-200 tracking-wide relative">Profile</span>
          </button>
        </div>
      </nav>
    </main>
  );
}