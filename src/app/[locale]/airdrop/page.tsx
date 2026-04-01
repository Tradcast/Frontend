"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#d76afd]">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const GiftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#d76afd]">
    <rect x="3" y="8" width="18" height="4" rx="1"/>
    <path d="M12 8v13"/>
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
  </svg>
);

export default function AirdropPage() {
  const router = useRouter();
  const t = useTranslations("airdrop");
  const tc = useTranslations("common");
  const [activeTab, setActiveTab] = useState('holdtpoints');

  return (
    <main className="flex flex-col min-h-screen bg-[#ebeff2] relative overflow-hidden">
      {/* Background Candlestick Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Candles - Top Left */}
        <svg className="absolute top-28 left-6 opacity-30" width="50" height="100" viewBox="0 0 50 100">
          <line x1="15" y1="10" x2="15" y2="25" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="25" width="12" height="35" rx="2" fill="#bdecf6"/>
          <line x1="15" y1="60" x2="15" y2="80" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="38" y1="25" x2="38" y2="40" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="32" y="40" width="12" height="25" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
          <line x1="38" y1="65" x2="38" y2="85" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Candles - Top Right */}
        <svg className="absolute top-36 right-4 opacity-25" width="40" height="85" viewBox="0 0 40 85">
          <line x1="20" y1="5" x2="20" y2="18" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="14" y="18" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="20" y1="58" x2="20" y2="75" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Candles - Bottom Left */}
        <svg className="absolute bottom-24 left-4 opacity-20" width="35" height="75" viewBox="0 0 35 75">
          <line x1="17" y1="5" x2="17" y2="18" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="11" y="18" width="12" height="30" rx="2" fill="#bdecf6"/>
          <line x1="17" y1="48" x2="17" y2="65" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Candles - Bottom Right */}
        <svg className="absolute bottom-32 right-8 opacity-30" width="55" height="95" viewBox="0 0 55 95">
          <line x1="15" y1="20" x2="15" y2="35" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="35" width="12" height="25" rx="2" fill="none" stroke="#bdecf6" strokeWidth="2"/>
          <line x1="15" y1="60" x2="15" y2="80" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="5" x2="40" y2="20" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
          <rect x="34" y="20" width="12" height="40" rx="2" fill="#bdecf6"/>
          <line x1="40" y1="60" x2="40" y2="80" stroke="#bdecf6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Fixed Header */}
      <header className="w-full p-6 z-20">
        {/* Back button */}
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-800 transition-all duration-300 shadow-card"
        >
          <BackIcon />
          <span className="text-sm font-medium">{tc("back")}</span>
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mt-6 text-center">
          {t("title")}
        </h1>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={() => setActiveTab('holdtpoints')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'holdtpoints'
                ? 'bg-[#d76afd] text-white shadow-button'
                : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {t("tabHold")}
          </button>
          <button
            onClick={() => setActiveTab('airdrop')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'airdrop'
                ? 'bg-[#d76afd] text-white shadow-button'
                : 'bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {t("tabAirdrop")}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center z-10 p-6">

        {/* Hold TPOINTs Tab Content */}
        {activeTab === 'holdtpoints' && (
          <div className="flex flex-col items-center w-full max-w-md">
            {/* Icon */}
            <div className="relative mb-6">
              <div className="relative bg-white p-6 rounded-3xl border border-gray-200 shadow-card">
                <GiftIcon />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
              {t("holdTitle")}
            </h2>

            {/* Coming Soon Badge */}
            <div className="relative mb-5">
              <div className="relative px-6 py-2 bg-gradient-to-r from-[#d76afd] to-[#a855f7] rounded-full shadow-button">
                <span className="text-sm font-bold text-white tracking-wider">{t("comingSoon")}</span>
              </div>
            </div>

            <p className="text-gray-600 text-sm text-center leading-relaxed mb-6 px-2">
              {t("holdIntro")}
            </p>

            {/* Prizes & Leaderboard Info */}
            <div className="w-full space-y-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">💰</div>
                  <div>
                    <h3 className="text-gray-800 font-semibold text-sm">{t("periodicalPrizes")}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed mt-1">
                      {t("periodicalPrizesDesc")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">🎯</div>
                  <div>
                    <h3 className="text-gray-800 font-semibold text-sm">{t("maximizeScore")}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed mt-1">
                      {t("maximizeScoreDesc")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#d76afd]/10 flex items-center justify-center text-xl shrink-0">🚀</div>
                  <div>
                    <h3 className="text-gray-800 font-semibold text-sm">{t("leaveProfit")}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed mt-1">
                      {t("leaveProfitDesc")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                <p className="text-amber-700 text-xs text-center font-medium leading-relaxed">
                  {t("leaderboardBanner")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Airdrop Tab Content */}
        {activeTab === 'airdrop' && (
          <div className="flex flex-col items-center w-full max-w-md">
            {/* Animated rocket */}
            <div className="relative mb-8 animate-bounce">
              <div className="relative bg-white p-8 rounded-3xl border border-gray-200 shadow-card">
                <RocketIcon />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              {t("airdropHeading")}
            </h2>

            {/* Coming Soon badge */}
            <div className="relative mb-6">
              <div className="relative px-8 py-3 bg-gradient-to-r from-[#d76afd] to-[#a855f7] rounded-full shadow-button">
                <span className="text-xl font-bold text-white tracking-wider">
                  {t("comingSoon")}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-center max-w-md text-sm leading-relaxed">
              {t("airdropBlurb")}
            </p>

            {/* Decorative dots */}
            <div className="flex gap-2 mt-8">
              <div className="w-2 h-2 rounded-full bg-[#d76afd] animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-[#d76afd] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-[#d76afd] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce {
          animation: bounce 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
