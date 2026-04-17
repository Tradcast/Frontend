// src/app/[locale]/market/page.tsx
"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useAccount, useConnect, useConnectors } from "wagmi";

const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const TrophyIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const UserIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MarketIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-300 ${active ? "text-[#d76afd]" : "text-gray-400"}`}>
    <path d="M3 9h18l-1.5 10a2 2 0 0 1-2 1.8H6.5a2 2 0 0 1-2-1.8L3 9Z" />
    <path d="M8 9V6a4 4 0 0 1 8 0v3" />
  </svg>
);

const LightningIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const RocketIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const CoinIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10" />
    <path d="M15 9.5a2.5 2.5 0 0 0-2.5-2.5h-1A2.5 2.5 0 0 0 9 9.5a2.5 2.5 0 0 0 2.5 2.5h1a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5h-1A2.5 2.5 0 0 1 9 14.5" />
  </svg>
);

const UsersIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const VaultIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 8.5V7" />
    <path d="M15.5 12H17" />
    <path d="M12 15.5V17" />
    <path d="M8.5 12H7" />
  </svg>
);

const ComingSoonBadge = ({ label = "Coming Soon" }: { label?: string }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
    {label}
  </span>
);

const SectionHeading = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-3 mb-3">
    <div className="w-10 h-10 rounded-xl bg-[#d76afd]/10 flex items-center justify-center text-[#d76afd]">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h2 className="text-base font-bold text-gray-800 leading-tight">{title}</h2>
      {subtitle && <p className="text-[11px] text-gray-500 leading-tight">{subtitle}</p>}
    </div>
    <ComingSoonBadge />
  </div>
);

type EnergyPack = { energy: number; priceCents: number };
const ENERGY_PACKS: EnergyPack[] = [
  { energy: 5, priceCents: 2 },
  { energy: 10, priceCents: 4 },
  { energy: 20, priceCents: 7 },
  { energy: 50, priceCents: 15 },
];

type Boost = { multiplier: string; duration: string; priceCents: number; highlight?: boolean };
const BOOSTS: Boost[] = [
  { multiplier: "10x", duration: "20 min", priceCents: 30 },
  { multiplier: "10x", duration: "1 hour", priceCents: 70 },
  { multiplier: "10x", duration: "2 hours", priceCents: 100 },
  { multiplier: "10x", duration: "4 hours", priceCents: 175 },
  { multiplier: "25x", duration: "15 min", priceCents: 100, highlight: true },
];

type Payout = { burn: number; rewardUsd: number };
const PAYOUTS: Payout[] = [
  { burn: 500_000, rewardUsd: 2.8 },
  { burn: 1_000_000, rewardUsd: 6 },
  { burn: 2_000_000, rewardUsd: 14 },
];

const formatCents = (cents: number) => {
  const dollars = cents / 100;
  return dollars >= 1 ? `$${dollars.toFixed(2)}` : `${cents}¢`;
};

const formatNumber = (n: number) => n.toLocaleString();

export default function MarketPage() {
  const tNav = useTranslations("nav");
  const { isMiniAppReady, isMiniPay, isWeb } = useMiniApp();
  const router = useRouter();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const [fcReady, setFcReady] = useState(false);
  const hasAttemptedFrameConnect = React.useRef(false);

  // Mock data — backend will feed these later.
  const invitedCount = 0;
  const claimableInvitationTpoints = 0;
  const currentStreak = 0;
  const treasuryBalanceUsd = 0;

  useEffect(() => {
    if (isMiniPay || isWeb) {
      setFcReady(true);
    }
  }, [isMiniPay, isWeb]);

  useEffect(() => {
    if (fcReady || isMiniPay || isWeb) return;
    const initFarcaster = async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        await sdk.actions.ready();
        setFcReady(true);
      } catch {
        setFcReady(true);
      }
    };
    initFarcaster();
  }, [fcReady, isMiniPay, isWeb]);

  useEffect(() => {
    if (isConnected || isConnecting || hasAttemptedFrameConnect.current) return;

    if (isMiniPay) {
      const injectedConnector = connectors.find((c) => c.id === "injected" || c.id === "metaMask");
      if (injectedConnector) {
        hasAttemptedFrameConnect.current = true;
        connect({ connector: injectedConnector });
      }
      return;
    }

    if (isWeb && !isConnected && !isConnecting) {
      setTimeout(() => {
        if (!isConnected) router.push("/");
      }, 1000);
      return;
    }

    if (!fcReady) return;
    const frameConnector = connectors.find((c) => /frame|farcaster/i.test(c.id + c.name));
    if (frameConnector) {
      hasAttemptedFrameConnect.current = true;
      setTimeout(() => connect({ connector: frameConnector }), 0);
    }
  }, [fcReady, isMiniPay, isWeb, isConnected, isConnecting, connectors, connect, router]);

  return (
    <main className="flex flex-col min-h-screen bg-[#ebeff2] relative overflow-hidden">
      {/* Background Candlestick Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute top-20 left-6 opacity-30" width="55" height="120" viewBox="0 0 55 120">
          <line x1="15" y1="10" x2="15" y2="30" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
          <rect x="9" y="30" width="12" height="40" rx="2" fill="#bdecf6" />
          <line x1="15" y1="70" x2="15" y2="90" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="25" x2="40" y2="40" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
          <rect x="34" y="40" width="12" height="30" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2" />
          <line x1="40" y1="70" x2="40" y2="95" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="absolute top-28 right-4 opacity-25" width="50" height="100" viewBox="0 0 50 100">
          <line x1="25" y1="5" x2="25" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
          <rect x="19" y="20" width="12" height="45" rx="2" fill="#bdecf6" />
          <line x1="25" y1="65" x2="25" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-36 left-3 opacity-20" width="40" height="90" viewBox="0 0 40 90">
          <line x1="20" y1="5" x2="20" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
          <rect x="14" y="20" width="12" height="35" rx="2" fill="#bdecf6" />
          <line x1="20" y1="55" x2="20" y2="80" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex-1 px-4 pt-8 pb-28 z-10 max-w-2xl w-full mx-auto">
        {/* Page Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Market</h1>
          <p className="text-gray-500 text-xs">Buy energy, boost your rewards, and cash out TPOINTs.</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-[2px] w-6 bg-gradient-to-r from-transparent to-[#bdecf6] rounded-full" />
            <div className="h-1.5 w-20 bg-gradient-to-r from-[#bdecf6] to-[#d76afd] rounded-full" />
            <div className="h-[2px] w-6 bg-gradient-to-l from-transparent to-[#bdecf6] rounded-full" />
          </div>
        </div>

        {/* Energy Packs */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-4 mb-4">
          <SectionHeading
            icon={<LightningIcon />}
            title="Energy Packs"
            subtitle="Top up your energy with stablecoins (USDC / USDT / USDm)."
          />
          <div className="grid grid-cols-2 gap-2">
            {ENERGY_PACKS.map((pack) => (
              <div
                key={pack.energy}
                className="relative rounded-xl border border-gray-100 bg-gradient-to-br from-white to-[#f7f8fa] p-3 flex flex-col items-center text-center"
              >
                <div className="flex items-center gap-1 text-[#d76afd] font-bold text-lg">
                  <LightningIcon className="text-[#d76afd]" />
                  {pack.energy}
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Energy</span>
                <div className="mt-2 px-2 py-0.5 rounded-full bg-[#d76afd]/10 text-[#d76afd] text-xs font-bold">
                  {formatCents(pack.priceCents)}
                </div>
                <button
                  disabled
                  className="mt-3 w-full text-[11px] font-semibold py-1.5 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 text-center">
            Prices are admin-adjustable on-chain.
          </p>
        </section>

        {/* Boosts */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-4 mb-4">
          <SectionHeading
            icon={<RocketIcon />}
            title="Reward Boosters"
            subtitle="Earn multiplied TPOINTs and score for a limited time."
          />
          <div className="grid grid-cols-1 gap-2">
            {BOOSTS.map((boost, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl border px-3 py-2.5 flex items-center justify-between gap-3 ${
                  boost.highlight
                    ? "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50"
                    : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[11px] shrink-0 ${
                      boost.highlight
                        ? "bg-gradient-to-br from-amber-400 to-orange-500"
                        : "bg-gradient-to-br from-[#d76afd] to-[#8b5cf6]"
                    }`}
                  >
                    {boost.multiplier}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 leading-tight">
                      {boost.multiplier} TPOINTs & Score
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight">for {boost.duration}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="text-sm font-bold text-[#d76afd] tabular-nums">
                    {formatCents(boost.priceCents)}
                  </span>
                  <button
                    disabled
                    className="text-[10px] font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 text-center">
            Active boost time & expiry are stored on-chain for reliability.
          </p>
        </section>

        {/* Payouts / Burn TPOINTs */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-4 mb-4">
          <SectionHeading
            icon={<CoinIcon />}
            title="TPOINT Payouts"
            subtitle="Burn TPOINTs and receive stablecoin from treasury."
          />

          <div className="flex items-center justify-between bg-gradient-to-r from-[#d76afd]/5 to-[#bdecf6]/20 border border-[#d76afd]/10 rounded-xl px-3 py-2 mb-3">
            <div className="flex items-center gap-2">
              <VaultIcon className="text-[#d76afd]" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Treasury Balance</p>
                <p className="text-sm font-bold text-gray-800 tabular-nums">
                  ${treasuryBalanceUsd.toFixed(2)}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-gray-400">
              Payouts pause if treasury &lt; $15
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {PAYOUTS.map((p, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 font-bold text-[10px]">
                    BURN
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 leading-tight">
                      {formatNumber(p.burn)} TPOINTs
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      You receive <span className="text-emerald-600 font-bold">${p.rewardUsd.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed shrink-0"
                >
                  Coming Soon
                </button>
              </div>
            ))}

            {/* Treal access */}
            <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-[#d76afd]/10 px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#d76afd]/15 border border-[#d76afd]/20 flex items-center justify-center text-[#d76afd] text-base">
                  ★
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 leading-tight">
                    Burn 2,000,000 TPOINTs
                  </p>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Unlock <span className="text-[#d76afd] font-bold">Treal</span> access for 1 month
                  </p>
                </div>
              </div>
              <button
                disabled
                className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 cursor-not-allowed shrink-0"
              >
                Coming Soon
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mt-3 text-center">
            Burn date is anchored on-chain — access window is verifiable.
          </p>
        </section>

        {/* Invitations */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-4 mb-4">
          <SectionHeading
            icon={<UsersIcon />}
            title="Invitation Rewards"
            subtitle="Invite friends to earn TPOINTs. Claim every 24 hours."
          />

          <div className="flex items-center justify-between bg-gradient-to-r from-[#bdecf6]/30 to-[#d76afd]/10 border border-[#bdecf6] rounded-xl px-3 py-3 mb-3">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">You Invited</p>
              <p className="text-xl font-bold text-gray-800 tabular-nums">
                {invitedCount} <span className="text-xs font-semibold text-gray-500">users</span>
              </p>
            </div>
            <div className="text-right min-w-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Claimable</p>
              <p className="text-xl font-bold text-[#d76afd] tabular-nums">
                {formatNumber(claimableInvitationTpoints)}{" "}
                <span className="text-xs font-semibold text-gray-500">TPOINTs</span>
              </p>
            </div>
          </div>

          <button
            disabled
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          >
            Claim Invitation Rewards · Coming Soon
          </button>

          <p className="text-[10px] text-gray-400 mt-3 text-center">
            Max 10,000 TPOINTs per claim · 1 claim per 23.5 hours.
          </p>
        </section>

        {/* Streak prize — quick link to profile */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-4 mb-4">
          <SectionHeading
            icon={<span className="text-xl">🔥</span>}
            title="Daily Streak Reward"
            subtitle="Claim free TPOINTs every day when your streak is 10+."
          />
          <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-3 py-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Current Streak</p>
              <p className="text-xl font-bold text-orange-500 tabular-nums">{currentStreak} 🔥</p>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="text-[11px] font-semibold px-3 py-2 rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-100 transition-colors"
            >
              Go to Profile
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 text-center">
            Max 5,000 TPOINTs per claim · 1 claim per 23.5 hours.
          </p>
        </section>

        {/* Disclaimer */}
        <div className="text-center px-4">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            These features are not live yet. Smart contracts are being finalized — stay tuned!
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50 shadow-soft">
        <div className="flex justify-around items-center py-3 px-2">
          <button
            onClick={() => router.push("/home")}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <HomeIcon />
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
              {tNav("home")}
            </span>
          </button>

          <button
            onClick={() => router.push("/leaderboard")}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <TrophyIcon />
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
              {tNav("leaderboard")}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1 group relative">
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <MarketIcon active={true} />
            </div>
            <span className="text-[10px] font-semibold text-[#d76afd]">{tNav("market")}</span>
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#d76afd] rounded-full" />
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center gap-1 group relative"
          >
            <div className="relative transform group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
              <UserIcon />
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
              {tNav("profile")}
            </span>
          </button>
        </div>
      </nav>
    </main>
  );
}
