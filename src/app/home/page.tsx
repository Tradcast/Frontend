// src/app/home/page.tsx
"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useConnectors } from "wagmi";

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
export default function HomePage() {
  const { context, isMiniAppReady } = useMiniApp();
  const router = useRouter();
  // Farcaster SDK state
  const [fcReady, setFcReady] = useState(false);
  const [fcContext, setFcContext] = useState<any>(null);
  // Wallet state
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  // Energy state from backend
  const [energy, setEnergy] = useState<number | null>(null);
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(true);
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
          // Assuming backend returns { energy: 10 }
          if (data.energy !== undefined) {
            setEnergy(data.energy);
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
  const handlePlayClick = () => {
    console.log("Play button clicked! Navigating to Trade Area...");
    if (energy && energy > 0) {
      router.push('/tradearea');
    } else {
      console.log("Insufficient energy!");
    }
  };
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
          {/* Energy Display */}
          <div className="mt-4 flex items-center justify-center gap-2 mb-6 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl px-6 py-3 rounded-2xl border-2 border-slate-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <LightningIcon className="text-[#A78BFA] drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" />
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#A78BFA] to-white">
              {energy !== null ? energy : '...'}
            </span>
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
        </div>
      </header>
      {/* Play button section */}
      <section className="flex-1 flex flex-col items-center justify-center z-10 pb-24">
        <div
          className={`relative group ${energy && energy > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
          onClick={handlePlayClick}
        >
          {energy && energy > 0 && (
            <div className="absolute inset-0 rounded-full">
              <div className="absolute inset-0 bg-[#8B5CF6] rounded-full blur-[24px] opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            </div>
          )}
          <div className={`relative w-40 h-40 bg-gradient-to-br from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED] rounded-full flex flex-col items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.4),inset_0_1px_6px_rgba(255,255,255,0.15)] border-[3px] border-white/15 transition-all duration-300 ${
            energy && energy > 0
              ? 'group-hover:scale-[1.03] active:scale-95 group-hover:shadow-[0_0_32px_rgba(139,92,246,0.6),inset_0_1px_6px_rgba(255,255,255,0.2)]'
              : 'grayscale'
          }`}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/10"></div>
            <div className={`relative z-10 transition-transform duration-300 ${energy && energy > 0 ? 'group-hover:scale-105' : ''}`}>
              <PlayIcon />
            </div>
            <div className="relative z-10 mt-2 text-white font-bold tracking-[0.15em] text-xs uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
              {energy && energy > 0 ? 'Start Game' : 'No Energy'}
            </div>
          </div>
        </div>
      </section>
      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#0F172A] via-[#0F172A]/95 to-transparent backdrop-blur-2xl border-t-2 border-slate-800/60 pb-safe z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
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