"use client";
import { useRouter } from "next/navigation";

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const CoinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
    <circle cx="12" cy="12" r="8"/>
    <path d="M12 2v2"/>
    <path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/>
    <path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/>
    <path d="m19.07 4.93-1.41 1.41"/>
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A78BFA]">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const LeverageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B5CF6] opacity-12 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A78BFA] opacity-10 blur-[70px] rounded-full pointer-events-none"></div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      {/* Back button */}
      <button
        onClick={() => router.push('/home')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white transition-all duration-300"
      >
        <BackIcon />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center z-10 p-6 pt-20 pb-12 overflow-y-auto">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#A78BFA] to-white mb-2 text-center">
          What is Tradcast?
        </h1>
        
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-[2px] w-8 bg-gradient-to-r from-transparent to-[#8B5CF6] rounded-full"></div>
          <div className="h-1.5 w-16 bg-gradient-to-r from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.4)]"></div>
          <div className="h-[2px] w-8 bg-gradient-to-l from-transparent to-[#8B5CF6] rounded-full"></div>
        </div>

        {/* Main description card */}
        <div className="w-full max-w-lg bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl border-2 border-slate-700/50 p-6 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <p className="text-slate-200 text-base leading-relaxed mb-4">
            <span className="text-[#A78BFA] font-bold">Tradcast</span> is a real-life volatile trading simulation game. All price data is <span className="text-emerald-400 font-semibold">100% real market data</span> aggregated across multiple tokens and timeframes.
          </p>
          <p className="text-slate-300 text-sm leading-relaxed">
            Practice your trading skills with real volatility, zero financial risk. Master the art of reading charts, timing entries, and managing positions.
          </p>
        </div>

        {/* How to Play Section */}
        <div className="w-full max-w-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎮</span> How to Play
          </h2>
          
          {/* Trading Buttons Explanation */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl border-2 border-slate-700/50 p-5 mb-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <h3 className="text-white font-semibold mb-4 text-center">Trading Buttons</h3>
            
            {/* Button Examples */}
            <div className="flex justify-center gap-3 mb-5">
              <div className="px-4 py-2 bg-emerald-500 text-white font-bold text-sm rounded-lg shadow-[0_4px_12px_rgba(16,185,129,0.4)]">
                LONG
              </div>
              <div className="px-4 py-2 bg-red-500 text-white font-bold text-sm rounded-lg shadow-[0_4px_12px_rgba(239,68,68,0.4)]">
                SHORT
              </div>
              <div className="px-4 py-2 bg-indigo-500 text-white font-bold text-sm rounded-lg shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
                CLOSE
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 text-xs font-bold">L</span>
                </div>
                <p className="text-slate-300 text-sm">
                  <span className="text-emerald-400 font-semibold">LONG:</span> Opens a long position or adds <span className="text-white font-semibold">$100</span> to an existing long position. Profit when price goes UP.
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-500/20 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-400 text-xs font-bold">S</span>
                </div>
                <p className="text-slate-300 text-sm">
                  <span className="text-red-400 font-semibold">SHORT:</span> Opens a short position or adds <span className="text-white font-semibold">$100</span> to an existing short position. Profit when price goes DOWN.
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-500/20 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-400 text-xs font-bold">C</span>
                </div>
                <p className="text-slate-300 text-sm">
                  <span className="text-indigo-400 font-semibold">CLOSE:</span> Closes your current position and realizes your profit or loss.
                </p>
              </div>
            </div>
          </div>
          
          {/* Important Rules */}
          <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/30 backdrop-blur-xl rounded-2xl border-2 border-amber-700/40 p-5 mb-4">
            <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
              <span>⚠️</span> Important Rules
            </h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>You <span className="text-white font-semibold">cannot</span> open LONG and SHORT positions at the same time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>There is <span className="text-white font-semibold">no hedge</span> in this game</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>To switch direction, <span className="text-white font-semibold">close your position first</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>Each position uses <span className="text-orange-400 font-bold">20× leverage</span></span>
              </li>
            </ul>
          </div>
          
          {/* Game Flow */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl border-2 border-slate-700/50 p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span>🏁</span> Game Flow
            </h3>
            <ol className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#8B5CF6]/30 rounded-full flex items-center justify-center text-[#A78BFA] text-xs font-bold flex-shrink-0">1</span>
                <span>Start the game and watch the real-time chart</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#8B5CF6]/30 rounded-full flex items-center justify-center text-[#A78BFA] text-xs font-bold flex-shrink-0">2</span>
                <span>Open positions using LONG or SHORT buttons</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#8B5CF6]/30 rounded-full flex items-center justify-center text-[#A78BFA] text-xs font-bold flex-shrink-0">3</span>
                <span>Close your position when ready to take profit or cut loss</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#8B5CF6]/30 rounded-full flex items-center justify-center text-[#A78BFA] text-xs font-bold flex-shrink-0">4</span>
                <span>Click <span className="text-emerald-400 font-semibold">&quot;Claim &amp; Exit&quot;</span> to claim your TPOINT tokens</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-[#8B5CF6]/30 rounded-full flex items-center justify-center text-[#A78BFA] text-xs font-bold flex-shrink-0">5</span>
                <span>Return to home page with your earned rewards!</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Features grid */}
        <div className="w-full max-w-lg grid grid-cols-1 gap-4 mb-6">
          {/* Feature 1 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/40 p-4 flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <ChartIcon />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Real Market Data</h3>
              <p className="text-slate-400 text-sm">Trade with authentic price movements from real crypto markets.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/40 p-4 flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <LeverageIcon />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">20× Leverage</h3>
              <p className="text-slate-400 text-sm">All positions use 20× leverage for amplified gains (and losses!).</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/40 p-4 flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <CoinIcon />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Earn TPOINT Tokens</h3>
              <p className="text-slate-400 text-sm">Profit from your trades and earn TPOINT tokens as rewards.</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/40 p-4 flex items-start gap-4">
            <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrophyIcon />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Compete & Rank</h3>
              <p className="text-slate-400 text-sm">Climb the leaderboard and prove your trading skills.</p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-slate-500 text-xs text-center mt-6 max-w-md">
          Start practicing now and build your trading skills for when it matters most!
        </p>
      </div>
    </main>
  );
}
